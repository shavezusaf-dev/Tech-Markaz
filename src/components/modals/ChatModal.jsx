import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fmt, parseImgs } from '../../lib/format';
import {
  getGuestId,
  getOrCreateConversation,
  fetchMessages,
  uploadChatMedia,
  sendChatMessage,
  subscribeToMessages,
} from '../../lib/chat';

function fmtDuration(s) {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch {}
  }
  return '';
}

export default function ChatModal() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [seller, setSeller] = useState(null);
  const [product, setProduct] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const durationRef = useRef(0);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    const onOpen = async (e) => {
      const detail = e?.detail || {};
      if (!detail.sellerId) {
        toast('Chat unavailable for this product', 'warn');
        return;
      }
      setSeller(detail);
      setProduct(detail.product || null);
      setOpen(true);
      setLoading(true);
      try {
        const guestId = getGuestId();
        const conv = await getOrCreateConversation({
          customerId: user?.id || null,
          guestEmail: user ? null : guestId,
          guestName: user ? null : 'Guest',
          sellerId: detail.sellerId,
          productId: detail.productId || null,
        });
        setConversation(conv);
        const msgs = await fetchMessages(conv.id);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
        toast(err.message || 'Failed to load chat', 'err');
      } finally {
        setLoading(false);
      }
    };

    document.addEventListener('open-chat', onOpen);
    return () => document.removeEventListener('open-chat', onOpen);
  }, [user, toast]);

  useEffect(() => {
    if (!conversation) return;
    unsubRef.current = subscribeToMessages(conversation.id, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [conversation]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!open) {
      cancelRecording();
      setMessages([]);
      setConversation(null);
      setMsg('');
      setProduct(null);
      setSeller(null);
    }
  }, [open]);

  const sendText = async () => {
    const t = msg.trim();
    if (!t || !conversation || sending) return;
    setSending(true);
    try {
      await sendChatMessage({
        conversationId: conversation.id,
        senderType: 'customer',
        senderId: user?.id || null,
        body: t,
      });
      setMsg('');
    } catch (err) {
      toast(err.message || 'Send failed', 'err');
    } finally {
      setSending(false);
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !conversation) return;
    if (file.size > 5 * 1024 * 1024) return toast('Image must be under 5 MB', 'warn');
    if (!file.type.startsWith('image/')) return toast('Only images allowed', 'warn');

    setSending(true);
    try {
      const url = await uploadChatMedia(file, 'image');
      await sendChatMessage({
        conversationId: conversation.id,
        senderType: 'customer',
        senderId: user?.id || null,
        imageUrl: url,
      });
    } catch (err) {
      toast(err.message || 'Upload failed', 'err');
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (!conversation) return;
    const mime = pickMime();
    if (mime === null) {
      toast('Voice recording not supported in this browser', 'warn');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        const chunks = audioChunksRef.current.slice();
        stream.getTracks().forEach((t) => t.stop());
        const duration = durationRef.current;
        clearInterval(recTimerRef.current);
        setRecording(false);
        setRecSeconds(0);
        durationRef.current = 0;

        if (!chunks.length) {
          toast('No audio captured', 'warn');
          return;
        }

        const actualMime = mr.mimeType || 'audio/webm';
        const baseMime = actualMime.split(';')[0];
        const blob = new Blob(chunks, { type: baseMime });
        const ext = baseMime.includes('mp4') ? 'm4a' : baseMime.includes('ogg') ? 'ogg' : 'webm';

        setSending(true);
        try {
          const url = await uploadChatMedia(
            new File([blob], `voice.${ext}`, { type: baseMime }),
            'audio'
          );
          await sendChatMessage({
            conversationId: conversation.id,
            senderType: 'customer',
            senderId: user?.id || null,
            audioUrl: url,
            durationSeconds: duration,
          });
        } catch (err) {
          toast(err.message || 'Voice upload failed', 'err');
        } finally {
          setSending(false);
        }
      };

      mr.start();
      setRecording(true);
      setRecSeconds(0);
      durationRef.current = 0;
      recTimerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecSeconds(durationRef.current);
      }, 1000);
    } catch (err) {
      toast('Microphone access denied', 'err');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
    clearInterval(recTimerRef.current);
    setRecording(false);
    setRecSeconds(0);
    durationRef.current = 0;
    audioChunksRef.current = [];
  };

  const sendProductRef = async () => {
    if (!product || !conversation || sending) return;
    const pImgs = parseImgs(product.images);
    setSending(true);
    try {
      await sendChatMessage({
        conversationId: conversation.id,
        senderType: 'customer',
        senderId: user?.id || null,
        productRef: {
          id: product.id,
          title: product.title,
          price: parseFloat(product.price) || 0,
          image: pImgs[0] || null,
        },
      });
    } catch (err) {
      toast(err.message || 'Send failed', 'err');
    } finally {
      setSending(false);
    }
  };

  const isMine = (m) => {
    if (!user) return false;
    if (m.sender_id && m.sender_id === user.id) return true;
    return m.sender_type === 'customer';
  };
  const productBarImg = product ? parseImgs(product.images)[0] : null;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Chat with ${seller?.name || 'Seller'}`}
      maxWidth="max-w-[560px]"
      noScroll
    >
      <div
        className="flex flex-col"
        style={{ height: 'min(560px, calc(100vh - 200px))' }}
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pr-1 space-y-3 pb-3"
        >
          {loading && (
            <div className="flex items-center justify-center h-full text-muted text-[13px]">
              Loading chat...
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-3">
                <Icon name="message" size={22} />
              </div>
              <div className="text-[13.5px] font-extrabold text-ink mb-1">
                Start a conversation
              </div>
              <div className="text-[12px] text-muted">
                Ask about the product, price, or delivery.
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl overflow-hidden shadow-sm border ${
                  isMine(m)
                    ? 'bg-brand/95 border-brand text-white rounded-br-md'
                    : 'bg-white/70 dark:bg-white/[0.08] border-white/80 dark:border-white/15 text-ink-2 rounded-bl-md backdrop-blur-md'
                }`}
              >
                {m.product_ref_title && (
                  <Link
                    to={`/product/${m.product_ref_id}`}
                    className="block bg-white/70 dark:bg-white/[0.06]"
                  >
                    <div className="flex gap-2.5 p-2.5 border-b border-line/60">
                      {m.product_ref_image ? (
                        <img
                          src={m.product_ref_image}
                          alt=""
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="w-14 h-14 rounded-lg object-contain bg-white p-1 border border-line/60 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-surface-2 border border-line/60 shrink-0 flex items-center justify-center">
                          <Icon name="image" size={18} className="text-muted" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-bold text-ink leading-tight line-clamp-2 mb-1">
                          {m.product_ref_title}
                        </div>
                        <div className="text-[13px] font-black text-brand">
                          {fmt(m.product_ref_price)}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {m.image_url && (
                  <img
                    src={m.image_url}
                    alt=""
                    className="w-full max-w-[260px] max-h-[280px] object-cover cursor-pointer"
                    onClick={() => window.open(m.image_url, '_blank')}
                  />
                )}

                {m.audio_url && (
                  <div className="p-2 flex items-center gap-2 min-w-[220px]">
                    <audio
                      controls
                      preload="auto"
                      src={m.audio_url}
                      className="h-8 w-[210px]"
                    />
                  </div>
                )}

                {m.body && (
                  <div className="px-3.5 py-2.5 text-[13px] leading-snug font-medium">
                    {m.body}
                  </div>
                )}

                <div
                  className={`px-3.5 pb-2 text-[10px] ${
                    isMine(m) ? 'text-white/70' : 'text-muted'
                  } ${!m.body && !m.audio_url ? 'pt-2' : ''}`}
                >
                  {new Date(m.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {m.audio_url && m.duration_seconds ? (
                    <span className="ml-2">{fmtDuration(m.duration_seconds)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-end">
              <div className="bg-brand/70 text-white/80 px-3 py-1.5 rounded-full text-[11px] font-semibold">
                Sending...
              </div>
            </div>
          )}
        </div>

        {product && !recording && (
          <div className="border-t border-line pt-2.5 pb-2.5">
            <button
              onClick={sendProductRef}
              disabled={sending}
              className="glass-tile w-full flex items-center gap-2.5 rounded-xl p-2.5 text-left group"
            >
              <div className="relative z-10 flex items-center gap-2.5 w-full">
                {productBarImg ? (
                  <img
                    src={productBarImg}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-line shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-2 border border-line shrink-0 flex items-center justify-center">
                    <Icon name="image" size={14} className="text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-bold text-ink leading-tight line-clamp-1">
                    {product.title}
                  </div>
                  <div className="text-[11.5px] font-extrabold text-brand">
                    {fmt(product.price)}
                  </div>
                </div>
                <span className="bg-brand text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shrink-0 group-hover:bg-brand-dark transition">
                  Send
                </span>
              </div>
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-line">
          {recording ? (
            <div className="flex items-center gap-3 bg-bad/10 border border-bad/30 rounded-xl px-4 py-3">
              <span className="w-3 h-3 rounded-full bg-bad animate-pulse" />
              <span className="text-[13px] font-extrabold text-bad">
                Recording {fmtDuration(recSeconds)}
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={cancelRecording}
                  className="text-[12px] font-extrabold text-muted px-3 py-1.5 rounded-lg hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={stopRecording}
                  className="bg-bad text-white text-[12px] font-extrabold px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Icon name="check" size={13} color="white" strokeWidth={3} />
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl bg-surface-2 hover:bg-brand-light hover:text-brand flex items-center justify-center shrink-0 transition"
                title="Attach image"
                disabled={sending}
              >
                <Icon name="image" size={17} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />

              <button
                onClick={startRecording}
                className="w-10 h-10 rounded-xl bg-surface-2 hover:bg-bad/10 hover:text-bad flex items-center justify-center shrink-0 transition"
                title="Record voice"
                disabled={sending}
              >
                <Icon name="mic" size={17} />
              </button>

              <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendText();
                  }
                }}
                placeholder="Type a message..."
                className="form-input flex-1 mb-0"
                disabled={sending}
              />

              <button
                onClick={sendText}
                disabled={!msg.trim() || sending}
                className="btn-primary px-4 shrink-0 disabled:opacity-50"
              >
                <Icon name="arrowRight" size={16} color="white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

