import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { getLocalReply } from '../services/localAssistant';

const SUGGESTIONS = ['His projects', 'Skills & stack', 'How to contact', 'Certifications'];

const GREETING = {
  role: 'assistant',
  content: "Welcome — I'm Luminara. Ask me about his work, skills, or how to reach him.",
};

/** Only the last few turns are sent, which keeps requests small and cheap. */
const HISTORY_LIMIT = 10;

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(null);

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);
  const abortRef = useRef(null);

  /* Keep the transcript pinned to the newest message. */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* Escape closes; focus returns to the button that opened it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* Drop any in-flight request when the component goes away. */
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text) => {
      const q = (text ?? input).trim();
      if (!q || pending) return;

      setInput('');
      setNotice(null);
      const next = [...messages, { role: 'user', content: q }];
      setMessages(next);
      setPending(true);

      // No backend configured — answer locally, with a beat so it reads naturally.
      if (!api.isConfigured()) {
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
        setPending(false);
        setMessages((m) => [...m, { role: 'assistant', content: getLocalReply(q) }]);
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const history = next.filter((m) => m !== GREETING).slice(-HISTORY_LIMIT);
        const { reply } = await api.sendMessage(history, { signal: controller.signal });
        setMessages((m) => [...m, { role: 'assistant', content: reply }]);
      } catch (err) {
        if (controller.signal.aborted) return;
        // The assistant still answers — it just says where the answer came from.
        setNotice(`${err.message} Answering from the built-in guide instead.`);
        setMessages((m) => [...m, { role: 'assistant', content: getLocalReply(q) }]);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setPending(false);
      }
    },
    [input, messages, pending]
  );

  return (
    <div className="chat-fab-wrap">
      {open && (
        <div className="chat-panel" ref={panelRef} role="dialog" aria-modal="false" aria-label="Portfolio assistant">
          <div className="chat-head">
            <div>
              <div className="chat-head-title">Luminara</div>
              <div className="chat-head-sub">Ask about Lin&rsquo;s work</div>
            </div>
            <button
              type="button"
              className="chat-close"
              onClick={() => {
                setOpen(false);
                fabRef.current?.focus();
              }}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div ref={bodyRef} className="chat-body" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`}>
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="chat-typing" aria-label="Assistant is typing">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>

          {notice && <div className="chat-notice">{notice}</div>}

          {messages.length <= 2 && (
            <div className="chat-suggest">
              {SUGGESTIONS.map((s) => (
                <button type="button" key={s} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              placeholder="Ask something…"
              aria-label="Message"
              disabled={pending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button type="button" className="chat-send" onClick={() => send()} disabled={pending || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        className={`fab chat-fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        <span className="fab-glyph">
          <svg className="fab-chat-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.2-.6L3 21l1.7-4.6A8.3 8.3 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          <svg className="fab-close-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
