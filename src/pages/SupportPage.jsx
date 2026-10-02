import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getAIReply, hasAIKey, saveSupportTicket, saveChatSession, loadChatSessions, getLastAIError } from '../lib/aiBot';
import { QUICK_TOPICS, getBotReply } from '../lib/supportBot';
import { supabase } from '../lib/supabase';
import {
  getGuestId,
  getOrCreateSupportConversation,
  getSupportConversationForUser,
  fetchMessages,
  sendChatMessage,
  subscribeToMessages,
} from '../lib/chat';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/ui/Icon';

function RichText({ text }) {
  const paragraphs = (text || '').split('\n\n');
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className={i < paragraphs.length - 1 ? 'mb-2.5' : ''}>
          {p.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-black">{part.slice(2, -2)}</strong>;
            }
            return part.split('\n').flatMap((line, k, arr) =>
              k < arr.length - 1 ? [line, <br key={`br-${j}-${k}`} />] : [line]
            );
          })}
        </p>
      ))}
    </>
  );
}

const WELCOME = {
  role: 'bot',
  text: "Hi there! I'm the **Markaz Assistant** — here to help with orders, delivery, returns, payments, and anything else about Tech Markaz.\n\nWhat can I help you with today?",
  followups: [
    { label: 'Track my order', text: 'How do I track my order?' },
    { label: 'Delivery time', text: 'How long does delivery take?' },
    { label: 'Returns', text: 'What is your return policy?' },
    { label: 'Talk to agent', action: 'handoff' },
  ],
};

function newSessionId() {
  return 'sc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export default function SupportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState('assistant');

  const [botMessages, setBotMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [handoffMode, setHandoffMode] = useState('off');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketError, setTicketError] = useState('');

  const [supportConv, setSupportConv] = useState(null);
  const [supportMsgs, setSupportMsgs] = useState([]);
  const [supportInput, setSupportInput] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  const scrollRef = useRef(null);
  const supportScrollRef = useRef(null);
  const inputRef = useRef(null);
  const supportInputRef = useRef(null);
  const unsubRef = useRef(null);

  // Load bot history
  useEffect(() => {
    const stored = localStorage.getItem('tm_chat_session_id');
    if (stored) setSessionId(stored);
    else {
      const sid = newSessionId();
      localStorage.setItem('tm_chat_session_id', sid);
      setSessionId(sid);
    }

    try {
      const local = JSON.parse(localStorage.getItem('tm_support_chat_v2') || 'null');
      if (local && local.length) {
        setBotMessages(local);
        return;
      }
    } catch {}
    setBotMessages([{ id: 'welcome-' + Date.now(), ...WELCOME, time: Date.now() }]);
  }, []);

  useEffect(() => {
    if (botMessages.length) {
      try { localStorage.setItem('tm_support_chat_v2', JSON.stringify(botMessages.slice(-60))); } catch {}
    }
  }, [botMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [botMessages, typing]);

  // Persist to server
  useEffect(() => {
    if (!sessionId || !botMessages.length) return;
    const t = setTimeout(() => {
      saveChatSession({
        sessionId,
        customerId: user?.id,
        guestEmail: user?.email,
        messages: botMessages.slice(-60),
      });
    }, 800);
    return () => clearTimeout(t);
  }, [botMessages, sessionId, user]);

  // Load support conversation
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSupport(true);
      try {
        const guestId = getGuestId();
        const conv = await getSupportConversationForUser(user?.id || null, user ? null : guestId);
        if (!cancelled && conv) {
          setSupportConv(conv);
          const msgs = await fetchMessages(conv.id);
          if (!cancelled) setSupportMsgs(msgs);
          await supabase
            .from('chat_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conv.id)
            .eq('sender_type', 'seller')
            .is('read_at', null);
        }
      } catch (e) {
        console.warn('[support]', e);
      } finally {
        if (!cancelled) setLoadingSupport(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!supportConv) return;
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeToMessages(supportConv.id, (newMsg) => {
      setSupportMsgs((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [supportConv?.id]);

  useEffect(() => {
    const el = supportScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [supportMsgs]);

  useEffect(() => {
    if (searchParams.get('tab') === 'team') setTab('team');
  }, [searchParams]);

  const pushBot = (msg) => {
    setBotMessages((prev) => [...prev, { id: 'b-' + Date.now() + Math.random(), role: 'bot', time: Date.now(), ...msg }]);
  };

  const sendBot = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || typing) return;

    const userMsg = { id: 'u-' + Date.now() + Math.random(), role: 'user', text, time: Date.now() };
    const nextHistory = [...botMessages, userMsg];
    setBotMessages(nextHistory);
    setInput('');
    setTyping(true);

    const finish = (reply) => {
      if (!reply || !reply.text) {
        pushBot({ text: "Sorry, I didn't catch that. Could you try again?", followups: [] });
      } else if (reply.handoff || reply.type === 'handoff') {
        pushBot({ text: reply.text, isHandoff: true, followups: [] });
        setHandoffMode('form');
      } else {
        pushBot({ text: reply.text, followups: reply.followups || [] });
      }
    };

    try {
      if (hasAIKey()) {
        try {
          const reply = await getAIReply(nextHistory, user?.email);
          setAiError(null);
          finish(reply);
          return;
        } catch (aiErr) {
          const errMsg = getLastAIError() || aiErr.message;
          console.error('[support] AI failed:', errMsg);
          setAiError(errMsg);
        }
      }
      // Rule fallback — but flag it visibly
      const ruleReply = await getBotReply(text, nextHistory, supabase);
      finish({ ...ruleReply, isRuleFallback: true });
    } catch (err) {
      console.error(err);
      pushBot({
        text: "Something went wrong. Please try again, or contact us at 0300-TECHMARKAZ.",
        followups: [{ label: 'Talk to agent', action: 'handoff' }],
      });
    } finally {
      setTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const submitTicket = async () => {
    if (!form.message.trim()) return setTicketError('Please describe your issue.');
    if (!form.email.trim() && !form.phone.trim()) return setTicketError('Please provide an email or phone.');
    setTicketError('');
    setTicketBusy(true);

    try {
      const guestId = getGuestId();
      const customerId = user?.id || null;
      const guestEmail = user ? null : (form.email || guestId);

      const conv = await getOrCreateSupportConversation({
        customerId,
        guestEmail,
        guestName: form.name || user?.email?.split('@')[0] || 'Customer',
      });
      setSupportConv(conv);

      const composedMessage = form.name
        ? `${form.name}${form.phone ? ' · ' + form.phone : ''}${form.email ? ' · ' + form.email : ''}\n\n${form.message}`
        : form.message;

      await sendChatMessage({
        conversationId: conv.id,
        senderType: 'customer',
        senderId: customerId,
        body: composedMessage,
      });

      const orderRef = (form.message.match(/TM-[A-Z0-9]{4,}/i) || [])[0] || '';
      await saveSupportTicket({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        orderRef,
      });

      const msgs = await fetchMessages(conv.id);
      setSupportMsgs(msgs);

      setHandoffMode('off');
      setTab('team');
      setTicketBusy(false);
      setForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => supportInputRef.current?.focus(), 200);
    } catch (err) {
      setTicketBusy(false);
      setTicketError(err.message || 'Failed to send. Please try again.');
    }
  };

  const sendSupport = async () => {
    const text = supportInput.trim();
    if (!text || !supportConv || supportSending) return;
    setSupportSending(true);
    try {
      await sendChatMessage({
        conversationId: supportConv.id,
        senderType: 'customer',
        senderId: user?.id || null,
        body: text,
      });
      setSupportInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setSupportSending(false);
    }
  };

  const showQuickTopics = botMessages.filter((m) => m.role === 'user').length === 0;

  return (
    <div className="max-w-[900px] mx-auto px-[4%] md:px-[5%] py-6 md:py-8">
      <div className="glass-tile-flat rounded-3xl overflow-hidden flex flex-col" style={{ height: 'min(720px, calc(100vh - 160px))' }}>
        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-line/60 flex items-center gap-3 shrink-0">
          <button onClick={() => navigate('/')} className="btn-glass w-9 h-9 p-0 shrink-0">
            <Icon name="arrowLeft" size={15} />
          </button>
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center shrink-0 shadow-md">
            <Icon name={tab === 'team' ? 'headphone' : 'message'} size={18} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-black flex items-center gap-2">
              {tab === 'team' ? 'Tech Markaz Support' : 'Markaz Assistant'}
              <span className={`w-2 h-2 rounded-full ${aiError ? 'bg-warn' : 'bg-ok'} animate-pulse`} />
            </div>
            <div className="text-[11.5px] text-muted font-semibold">
              {tab === 'team'
                ? 'Our team replies within a few hours'
                : aiError
                ? 'Offline mode · Basic replies'
                : hasAIKey()
                ? 'AI-powered · Instant replies'
                : 'Basic mode · Instant replies'}
            </div>
          </div>
          {supportConv && (
            <button onClick={() => setTab(tab === 'team' ? 'assistant' : 'team')} className="btn-glass">
              {tab === 'team' ? 'Assistant' : 'Support Team'}
            </button>
          )}
        </div>

        {/* AI error banner */}
        {aiError && tab === 'assistant' && (
          <div className="relative z-10 px-5 py-3 bg-warn/15 border-b border-warn/30 shrink-0">
            <div className="flex items-start gap-2.5">
              <Icon name="sparkle" size={14} className="text-warn shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-[11.5px]">
                <div className="font-black text-warn mb-0.5">AI is not connected</div>
                <div className="text-ink-2 font-medium break-all">{aiError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {supportConv && (
          <div className="relative z-10 p-2.5 border-b border-line/60 flex gap-1.5 shrink-0">
            <button
              onClick={() => setTab('assistant')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold transition flex items-center justify-center gap-1.5 ${
                tab === 'assistant' ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name="message" size={13} />
              Assistant
            </button>
            <button
              onClick={() => setTab('team')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold transition flex items-center justify-center gap-1.5 ${
                tab === 'team' ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon name="headphone" size={13} />
              Support Team
              {supportMsgs.length > 0 && supportMsgs[supportMsgs.length - 1].sender_type === 'seller' && (
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* ═══ ASSISTANT TAB ═══ */}
        {tab === 'assistant' && (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-5 py-5 space-y-4">
              {botMessages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Icon name="message" size={14} color="white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${isUser ? '' : 'flex-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed border ${
                          isUser
                            ? 'bg-brand text-white border-brand rounded-br-md font-medium'
                            : m.isHandoff
                            ? 'bg-accent/15 border-accent/40 text-ink rounded-bl-md backdrop-blur-md'
                            : 'bg-white/70 dark:bg-white/[0.08] border-white/80 dark:border-white/15 text-ink-2 rounded-bl-md backdrop-blur-md'
                        }`}
                      >
                        <RichText text={m.text} />
                      </div>
                      <div className={`text-[10px] text-muted font-medium mt-1 ${isUser ? 'text-right' : ''}`}>
                        {new Date(m.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {!isUser && m.followups && m.followups.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.followups.map((f, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (f.action === 'handoff') setHandoffMode('form');
                                else if (f.text) sendBot(f.text);
                              }}
                              className="text-[11.5px] font-extrabold px-3 py-1.5 rounded-full border border-brand/30 text-brand bg-brand-light/50 hover:bg-brand hover:text-white hover:border-brand transition"
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {showQuickTopics && (
                <div className="pt-2">
                  <div className="text-[10.5px] uppercase tracking-wider font-extrabold text-muted mb-2.5">Quick topics</div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TOPICS.slice(0, 7).map((t, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (t.action === 'handoff') setHandoffMode('form');
                          else sendBot(t.text);
                        }}
                        className="glass-tile !transform-none rounded-full px-4 py-2 text-[12.5px] font-extrabold text-ink"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {typing && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center shrink-0">
                    <Icon name="message" size={14} color="white" />
                  </div>
                  <div className="bg-white/70 dark:bg-white/[0.08] border border-white/80 dark:border-white/15 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 backdrop-blur-md">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand" style={{ animation: `typingDot 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {handoffMode === 'form' && (
              <div className="relative z-10 px-5 py-4 border-t border-line/60 bg-brand-light/40 shrink-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-8 h-8 rounded-full bg-accent/25 text-accent-dark flex items-center justify-center">
                    <Icon name="headphone" size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-black">Contact our support team</div>
                    <div className="text-[11px] text-muted font-semibold">A real person will reply within a few hours</div>
                  </div>
                  <button onClick={() => setHandoffMode('off')} className="btn-glass">
                    <Icon name="x" size={13} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input mb-0" />
                    <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="form-input mb-0" />
                  </div>
                  <input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="form-input mb-0" />
                  <textarea rows={3} placeholder="Describe your issue..." value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="form-input mb-0 resize-vertical font-[inherit]" />
                  {ticketError && <div className="text-[11.5px] text-bad font-semibold">{ticketError}</div>}
                  <button onClick={submitTicket} disabled={ticketBusy} className="btn-primary w-full">
                    {ticketBusy ? 'Sending...' : 'Send to Support Team'}
                    {!ticketBusy && <Icon name="arrowRight" size={14} color="white" strokeWidth={2.6} />}
                  </button>
                </div>
              </div>
            )}

            {handoffMode !== 'form' && (
              <div className="relative z-10 px-4 py-3 border-t border-line/60 shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBot(); } }}
                    disabled={typing}
                    className="form-input flex-1 mb-0"
                  />
                  <button onClick={() => sendBot()} disabled={!input.trim() || typing} className="btn-primary px-4 shrink-0 disabled:opacity-50">
                    <Icon name="arrowRight" size={16} color="white" strokeWidth={2.4} />
                  </button>
                </div>
                <div className="text-[10.5px] text-muted text-center mt-2 font-medium">
                  Need a human? Type <b>agent</b> or tap <b>Talk to agent</b>.
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ SUPPORT TEAM TAB ═══ */}
        {tab === 'team' && (
          <>
            {!supportConv ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-[420px]">
                  <div className="w-16 h-16 rounded-full bg-accent/20 text-accent-dark flex items-center justify-center mx-auto mb-4">
                    <Icon name="headphone" size={28} />
                  </div>
                  <h3 className="text-[16px] font-black mb-2">No support conversation yet</h3>
                  <p className="text-[13px] text-muted leading-relaxed mb-5">
                    Ask the Assistant a question, and if it can't help, you can escalate to our team.
                  </p>
                  <button onClick={() => setTab('assistant')} className="btn-primary mx-auto">
                    <Icon name="message" size={14} color="white" />
                    Ask the Assistant
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div ref={supportScrollRef} className="flex-1 overflow-y-auto px-4 md:px-5 py-5 space-y-3">
                  {loadingSupport && (
                    <div className="flex items-center justify-center h-full text-muted text-[13px]">Loading conversation...</div>
                  )}
                  {!loadingSupport && supportMsgs.length === 0 && (
                    <div className="text-center py-10 text-[13px] text-muted">No messages yet.</div>
                  )}
                  {supportMsgs.map((m) => {
                    const isCustomer = m.sender_type === 'customer';
                    return (
                      <div key={m.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                        {!isCustomer && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark text-ink flex items-center justify-center shrink-0 mr-2.5 shadow-sm">
                            <Icon name="headphone" size={14} />
                          </div>
                        )}
                        <div className="max-w-[78%]">
                          <div className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed border whitespace-pre-line ${
                            isCustomer
                              ? 'bg-brand text-white border-brand rounded-br-md font-medium'
                              : 'bg-white/70 dark:bg-white/[0.08] border-white/80 dark:border-white/15 text-ink-2 rounded-bl-md backdrop-blur-md'
                          }`}>
                            {m.body}
                          </div>
                          <div className={`text-[10px] text-muted font-medium mt-1 ${isCustomer ? 'text-right' : ''}`}>
                            {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="relative z-10 px-4 py-3 border-t border-line/60 shrink-0">
                  <div className="flex gap-2">
                    <input
                      ref={supportInputRef}
                      type="text"
                      placeholder="Type a reply to the support team..."
                      value={supportInput}
                      onChange={(e) => setSupportInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupport(); } }}
                      disabled={supportSending}
                      className="form-input flex-1 mb-0"
                    />
                    <button onClick={sendSupport} disabled={!supportInput.trim() || supportSending} className="btn-primary px-4 shrink-0 disabled:opacity-50">
                      <Icon name="arrowRight" size={16} color="white" strokeWidth={2.4} />
                    </button>
                  </div>
                  <div className="text-[10.5px] text-muted text-center mt-2 font-medium">
                    Your chat with the Tech Markaz team · Saved automatically
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="text-center text-[11px] text-muted mt-4 font-medium">
        <Link to="/shop" className="text-brand font-extrabold hover:underline">Back to shop</Link>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

