import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSeller } from '../contexts/SellerContext';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchMessages, sendChatMessage, subscribeToMessages, uploadChatMedia,
  isAdminConversation, isSupportConversation, getOrCreateAdminSellerConversation,
  deleteConversation,
} from '../../lib/chat';
import Icon from '../../components/ui/Icon';

function fmtDuration(s) {
  s = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const m of list) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch {} }
  return '';
}

export default function Messages() {
  const { user, isAdmin } = useSeller();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(isAdmin ? 'sellers' : 'customers');
  const [allConvs, setAllConvs] = useState([]);
  const [sellersMap, setSellersMap] = useState({});
  const [unreadIds, setUnreadIds] = useState(new Set());
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msg, setMsg] = useState('');
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

  useEffect(() => { setTab(isAdmin ? 'sellers' : 'customers'); }, [isAdmin]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      let q = supabase.from('conversations').select('*').order('last_message_at', { ascending: false });
      if (!isAdmin) q = q.eq('seller_id', user.id);
      const { data } = await q;
      const list = data || [];
      setAllConvs(list);

      if (list.length) {
        const ids = list.map((c) => c.id);
        const { data: unreadMsgs } = await supabase
          .from('chat_messages').select('conversation_id, sender_id')
          .in('conversation_id', ids).is('read_at', null);
        const mine = new Set();
        (unreadMsgs || []).forEach((m) => { if (m.sender_id !== user.id) mine.add(m.conversation_id); });
        setUnreadIds(mine);
      } else {
        setUnreadIds(new Set());
      }

      if (isAdmin) {
        const sellerIds = Array.from(new Set(list.map((c) => c.seller_id).filter(Boolean)));
        if (sellerIds.length) {
          const { data: sellers } = await supabase
            .from('sellers').select('id,store_name,full_name,store_logo_url').in('id', sellerIds);
          const map = {};
          (sellers || []).forEach((s) => { map[s.id] = s; });
          setSellersMap(map);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoadingConvs(false); }
  };

  useEffect(() => { loadConversations(); /* eslint-disable-next-line */ }, [user, isAdmin]);

  useEffect(() => {
    const t = setInterval(() => loadConversations(), 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [user, isAdmin]);

  useEffect(() => { setActive(null); setMessages([]); }, [tab]);

  // Classify each conversation into a "bucket" for tabs
  const classify = (c) => {
    if (isAdminConversation(c)) return 'admin_seller';
    if (isSupportConversation(c)) return 'support';
    return 'customer_seller';
  };

  const conversations = allConvs.filter((c) => {
    const kind = classify(c);
    if (isAdmin) {
      if (tab === 'sellers') return kind === 'admin_seller';
      if (tab === 'support') return kind === 'support';
      if (tab === 'viewAll') return kind === 'customer_seller';
      return false;
    } else {
      if (tab === 'admin') return kind === 'admin_seller';
      if (tab === 'customers') return kind === 'customer_seller';
      return false;
    }
  });

  // Per-tab unread counts
  const unreadByTab = useMemo(() => {
    const m = { sellers: 0, support: 0, viewAll: 0, customers: 0, admin: 0 };
    allConvs.forEach((c) => {
      if (!unreadIds.has(c.id)) return;
      const kind = classify(c);
      if (kind === 'admin_seller') m.sellers++;
      else if (kind === 'support') m.support++;
      else m.viewAll++;
    });
    // Seller-side mapping
    m.customers = m.viewAll;
    m.admin = m.sellers;
    return m;
  }, [allConvs, unreadIds]);

  useEffect(() => {
    const convId = searchParams.get('conv');
    if (convId && allConvs.length && !active) {
      const found = allConvs.find((c) => c.id === convId);
      if (found) {
        const wantTab = searchParams.get('tab') || (isAdmin ? 'sellers' : 'customers');
        if (wantTab !== tab) setTab(wantTab);
        setActive(found);
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allConvs, searchParams]);

  useEffect(() => {
    if (!active) return;
    setLoadingMsgs(true);
    (async () => {
      try {
        const msgs = await fetchMessages(active.id);
        setMessages(msgs);
        await supabase.from('chat_messages').update({ read_at: new Date().toISOString() })
          .eq('conversation_id', active.id).is('read_at', null);
        setUnreadIds((s) => { const n = new Set(s); n.delete(active.id); return n; });
      } catch { toast('Failed to load messages', 'err'); }
      finally { setLoadingMsgs(false); }
    })();
    // eslint-disable-next-line
  }, [active?.id]);

  useEffect(() => {
    if (!active) return;
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeToMessages(active.id, (newMsg) => {
      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      if (newMsg.sender_id !== user.id) {
        supabase.from('chat_messages').update({ read_at: new Date().toISOString() })
          .eq('id', newMsg.id).then(() => {});
      }
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [active?.id, user?.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const displayName = (c) => {
    if (isSupportConversation(c)) return c.guest_name || c.guest_email?.split('@')[0] || 'Customer';
    if (isAdminConversation(c)) {
      if (isAdmin) {
        const s = sellersMap[c.seller_id];
        return s?.store_name || s?.full_name || 'Seller';
      }
      return 'Tech Markaz Admin';
    }
    return c.guest_name || c.guest_email?.split('@')[0] || 'Guest';
  };
  const displayInitial = (c) => displayName(c).charAt(0).toUpperCase();

  const handleDelete = async () => {
    if (!active) return;
    if (!confirm('Delete this entire conversation? All messages will be removed permanently.')) return;
    try {
      await deleteConversation(active.id);
      toast('Conversation deleted', 'ok');
      setActive(null); setMessages([]); loadConversations();
    } catch (e) { toast(e.message || 'Delete failed', 'err'); }
  };

  const startAdminChat = async () => {
    try {
      const conv = await getOrCreateAdminSellerConversation(user.id);
      toast('Support chat ready', 'ok');
      await loadConversations();
      setTimeout(() => setActive(conv), 200);
    } catch (e) { toast(e.message || 'Failed', 'err'); }
  };

  const sendText = async () => {
    const t = msg.trim();
    if (!t || !active || sending) return;
    setSending(true);
    try {
      await sendChatMessage({ conversationId: active.id, senderType: 'seller', senderId: user.id, body: t });
      setMsg(''); loadConversations();
    } catch (err) { toast(err.message || 'Send failed', 'err'); }
    finally { setSending(false); }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file || !active) return;
    if (file.size > 5 * 1024 * 1024) return toast('Image must be under 5 MB', 'warn');
    setSending(true);
    try {
      const url = await uploadChatMedia(file, 'image');
      await sendChatMessage({ conversationId: active.id, senderType: 'seller', senderId: user.id, imageUrl: url });
      loadConversations();
    } catch (err) { toast(err.message || 'Upload failed', 'err'); }
    finally { setSending(false); }
  };

  const startRecording = async () => {
    if (!active) return;
    const mime = pickMime();
    if (mime === null) return toast('Recording not supported here', 'warn');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data?.size) audioChunksRef.current.push(ev.data); };
      mr.onstop = async () => {
        const chunks = audioChunksRef.current.slice();
        stream.getTracks().forEach((t) => t.stop());
        const duration = durationRef.current;
        clearInterval(recTimerRef.current);
        setRecording(false); setRecSeconds(0); durationRef.current = 0;
        if (!chunks.length) return;
        const baseMime = (mr.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type: baseMime });
        const ext = baseMime.includes('mp4') ? 'm4a' : baseMime.includes('ogg') ? 'ogg' : 'webm';
        setSending(true);
        try {
          const url = await uploadChatMedia(new File([blob], `voice.${ext}`, { type: baseMime }), 'audio');
          await sendChatMessage({ conversationId: active.id, senderType: 'seller', senderId: user.id, audioUrl: url, durationSeconds: duration });
          loadConversations();
        } catch (err) { toast(err.message || 'Upload failed', 'err'); }
        finally { setSending(false); }
      };
      mr.start();
      setRecording(true); setRecSeconds(0); durationRef.current = 0;
      recTimerRef.current = setInterval(() => { durationRef.current += 1; setRecSeconds(durationRef.current); }, 1000);
    } catch { toast('Microphone access denied', 'err'); }
  };
  const stopRecording = () => { if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop(); };
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
    }
    clearInterval(recTimerRef.current);
    setRecording(false); setRecSeconds(0); durationRef.current = 0; audioChunksRef.current = [];
  };

  const isMine = (m) => { if (!user) return false; if (m.sender_id && m.sender_id === user.id) return true; return false; };
  const tabIcon = (t) => ({ sellers: 'users', viewAll: 'eye', support: 'headphone', customers: 'user', admin: 'shield' }[t] || 'message');

  const tabs = isAdmin
    ? [{ id: 'sellers', label: 'Sellers' }, { id: 'support', label: 'Support' }, { id: 'viewAll', label: 'All Chats' }]
    : [{ id: 'customers', label: 'Customers' }, { id: 'admin', label: 'Admin Support' }];

  const renderTabBadge = (tabId) => {
    const count = unreadByTab[tabId] || 0;
    if (!count) return null;
    return (
      <span className={`ml-1 min-w-[16px] h-4 px-1 rounded-full text-[9.5px] font-extrabold flex items-center justify-center shrink-0 ${tab === tabId ? 'bg-white text-brand' : 'bg-bad text-white'}`}>
        {count}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-3 md:gap-4 h-[calc(100vh-140px)]">
      <div className={`glass-tile-flat rounded-2xl overflow-hidden flex flex-col ${active ? 'hidden lg:flex' : 'flex'}`}>
        <div className="relative z-10 p-2 md:p-2.5 border-b border-line/60 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit shrink-0 py-2.5 px-2.5 md:px-3 rounded-xl text-[11px] md:text-[11.5px] font-extrabold transition flex items-center justify-center gap-1 whitespace-nowrap ${
                tab === t.id ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name={tabIcon(t.id)} size={12} />
              {t.label}
              {renderTabBadge(t.id)}
            </button>
          ))}
        </div>

        <div className="relative z-10 px-4 py-2 border-b border-line/60">
          <p className="text-[11px] text-muted font-semibold">
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-2/60 animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-brand-light text-brand">
                <Icon name={tabIcon(tab)} size={20} />
              </div>
              <div className="text-[13px] font-extrabold text-ink mb-1">No chats yet</div>
              <div className="text-[11px] text-muted mb-3">Chats will appear here.</div>
              {!isAdmin && tab === 'admin' && (
                <button onClick={startAdminChat} className="btn-primary text-xs py-2 px-3.5 mx-auto">
                  <Icon name="message" size={12} color="white" /> Chat with Admin
                </button>
              )}
            </div>
          ) : (
            conversations.map((c) => {
              const adminChat = isAdminConversation(c);
              const supportChat = isSupportConversation(c);
              const sellerInfo = isAdmin && adminChat ? sellersMap[c.seller_id] : null;
              const isUnread = unreadIds.has(c.id);
              const isActive = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c)}
                  className={`relative z-10 w-full text-left px-4 py-3 border-b border-line/30 transition flex gap-3 ${
                    isActive ? 'bg-brand-light/60' : isUnread ? 'bg-brand-light/25 hover:bg-brand-light/40' : 'hover:bg-surface-2/50'
                  }`}
                >
                  {sellerInfo?.store_logo_url ? (
                    <img src={sellerInfo.store_logo_url} alt="" className="w-11 h-11 rounded-full object-cover border border-line shrink-0" />
                  ) : (
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-[14px] shrink-0 ${
                      adminChat || supportChat ? 'bg-gradient-to-br from-accent to-accent-dark text-ink' : 'bg-gradient-to-br from-brand to-brand-dark text-white'
                    }`}>
                      {displayInitial(c)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <div className={`text-[13px] truncate flex items-center gap-1.5 ${isUnread ? 'font-black text-ink' : 'font-extrabold text-ink-2'}`}>
                        {displayName(c)}
                        {adminChat && (
                          <span className="text-[9px] font-extrabold bg-accent text-ink px-1.5 py-0.5 rounded uppercase shrink-0">
                            {isAdmin ? 'Support' : 'Admin'}
                          </span>
                        )}
                        {supportChat && (
                          <span className="text-[9px] font-extrabold bg-brand text-white px-1.5 py-0.5 rounded uppercase shrink-0">Support</span>
                        )}
                      </div>
                      <div className={`text-[10px] shrink-0 ${isUnread ? 'text-brand font-extrabold' : 'text-muted font-semibold'}`}>
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`flex-1 text-[11.5px] truncate ${isUnread ? 'text-ink font-bold' : 'text-muted font-medium'}`}>
                        {c.last_message_preview || 'No messages yet'}
                      </div>
                      {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-brand shrink-0" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={`glass-tile-flat rounded-2xl overflow-hidden flex flex-col ${active ? 'flex' : 'hidden lg:flex'}`}>
        {!active ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-4">
                <Icon name="message" size={28} />
              </div>
              <div className="text-[15px] font-black mb-1.5">Select a conversation</div>
              <div className="text-[12.5px] text-muted">Choose a chat from the list.</div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 px-3 md:px-5 py-3 border-b border-line/60 flex items-center gap-2.5">
              <button onClick={() => setActive(null)} className="btn-glass w-9 h-9 p-0 shrink-0 lg:hidden">
                <Icon name="arrowLeft" size={15} />
              </button>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[14px] shrink-0 ${
                isAdminConversation(active) || isSupportConversation(active)
                  ? 'bg-gradient-to-br from-accent to-accent-dark text-ink'
                  : 'bg-gradient-to-br from-brand to-brand-dark text-white'
              }`}>
                {displayInitial(active)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-extrabold truncate flex items-center gap-2">
                  {displayName(active)}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {isSupportConversation(active) ? (active.guest_email || 'Customer') : isAdminConversation(active) ? (isAdmin ? 'Direct line to the seller' : 'Direct line to Tech Markaz') : (active.guest_email || 'Signed in customer')}
                </div>
              </div>
              <button onClick={handleDelete} className="btn-glass w-9 h-9 p-0 shrink-0 hover:!bg-bad/15 hover:!text-bad hover:!border-bad/40" title="Delete">
                <Icon name="trash" size={14} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-3">
              {loadingMsgs && (<div className="flex items-center justify-center h-full text-muted text-[13px]">Loading...</div>)}
              {!loadingMsgs && messages.length === 0 && (<div className="text-center py-10 text-[13px] text-muted">No messages yet.</div>)}
              {messages.map((m) => {
                const mine = isMine(m);
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl overflow-hidden shadow-sm border ${
                      mine ? 'bg-brand/95 border-brand text-white rounded-br-md' : 'bg-white/70 dark:bg-white/[0.08] border-white/80 dark:border-white/15 text-ink-2 rounded-bl-md backdrop-blur-md'
                    }`}>
                      {m.product_ref_title && (
                        <div className="bg-white/70 dark:bg-white/[0.06]">
                          <div className="flex gap-2.5 p-2.5 border-b border-line/60">
                            {m.product_ref_image && <img src={m.product_ref_image} alt="" className="w-14 h-14 rounded-lg object-contain bg-white p-1 border border-line/60 shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                            <div className="min-w-0 flex-1">
                              <div className="text-[12.5px] font-bold text-ink leading-tight line-clamp-2 mb-1">{m.product_ref_title}</div>
                              <div className="text-[13px] font-black text-brand">Rs. {Number(m.product_ref_price || 0).toLocaleString('en-PK')}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {m.image_url && <img src={m.image_url} alt="" className="w-full max-w-[260px] max-h-[280px] object-cover cursor-pointer" onClick={() => window.open(m.image_url, '_blank')} />}
                      {m.audio_url && (<div className="p-2"><audio controls preload="auto" src={m.audio_url} className="h-8 w-[210px]" /></div>)}
                      {m.body && <div className="px-3.5 py-2.5 text-[13px] leading-snug font-medium whitespace-pre-line">{m.body}</div>}
                      <div className={`px-3.5 pb-2 text-[10px] ${mine ? 'text-white/70' : 'text-muted'} ${!m.body && !m.audio_url ? 'pt-2' : ''}`}>
                        {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {m.audio_url && m.duration_seconds ? <span className="ml-2">{fmtDuration(m.duration_seconds)}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {sending && (<div className="flex justify-end"><div className="bg-brand/70 text-white/80 px-3 py-1.5 rounded-full text-[11px] font-semibold">Sending...</div></div>)}
            </div>

            <div className="relative z-10 pt-3 px-3 md:px-4 pb-4 border-t border-line/60">
              {recording ? (
                <div className="flex items-center gap-3 bg-bad/10 border border-bad/30 rounded-xl px-4 py-3">
                  <span className="w-3 h-3 rounded-full bg-bad animate-pulse" />
                  <span className="text-[13px] font-extrabold text-bad">Recording {fmtDuration(recSeconds)}</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={cancelRecording} className="text-[12px] font-extrabold text-muted px-3 py-1.5 rounded-lg hover:bg-surface-2">Cancel</button>
                    <button onClick={stopRecording} className="bg-bad text-white text-[12px] font-extrabold px-4 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Icon name="check" size={13} color="white" strokeWidth={3} /> Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="btn-glass w-10 h-10 p-0 shrink-0" disabled={sending}><Icon name="image" size={16} /></button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                  <button onClick={startRecording} className="btn-glass w-10 h-10 p-0 shrink-0" disabled={sending}><Icon name="mic" size={16} /></button>
                  <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                    placeholder="Type a reply..." className="form-input flex-1 mb-0" disabled={sending} />
                  <button onClick={sendText} disabled={!msg.trim() || sending} className="btn-primary px-4 shrink-0 disabled:opacity-50">
                    <Icon name="arrowRight" size={16} color="white" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
