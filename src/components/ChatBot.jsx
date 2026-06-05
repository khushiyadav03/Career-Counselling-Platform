import { useCallback, useEffect, useRef, useState } from 'react';
import { useCareerGoals } from '../context/CareerGoalsContext';
import { useProfile } from '../context/ProfileContext';

const welcomeCopy = {
  '/': 'Hi! I am CareerBot. Ask about your learning path, resume bullets, or how to read a job post.',
  '/learn':
    'You are on Learning Path. Ask how to sequence modules, build portfolio proof, or estimate study time.',
  '/get-started':
    'Welcome to Get Started. Ask about first steps, skills to build, or how to explore roles.',
  '/set-goals':
    'You are on Career Goals. Tell me your target role and I will suggest focused next steps.',
  '/job-search':
    'You are on Job Search. After you open a board, ask me to tighten your pitch or decode a job posting.',
};

function ChatBot({ pageKey }) {
  const { careerGoals } = useCareerGoals();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const welcome = welcomeCopy[pageKey] || welcomeCopy['/'];

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [{ id: 'w', role: 'bot', text: welcome }];
    });
  }, [open, welcome]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const clearChat = useCallback(() => {
    setMessages([{ id: 'w2', role: 'bot', text: 'Chat cleared. What would you like to work on?' }]);
  }, []);

  const send = useCallback(async () => {
    const raw = input.trim();
    if (!raw || sending) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: raw };
    const thinkingId = `t-${Date.now()}`;
    setInput('');
    setMessages((prev) => [...prev, userMsg, { id: thinkingId, role: 'bot', typing: true }]);
    setSending(true);

    try {
      const userProfile = profile
        ? {
            skills: profile.skills,
            proficiency: profile.proficiency,
            careerGoal: profile.careerGoal,
            targetTrack: profile.targetTrack,
            experienceLevel: profile.experienceLevel,
            lastLearningPath: profile.lastLearningPath
              ? {
                  title: profile.lastLearningPath.title,
                  weeklyEstimate: profile.lastLearningPath.weeklyEstimate,
                  sources: profile.lastLearningPath.sources,
                }
              : null,
          }
        : undefined;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: raw, careerGoals, userProfile }),
      });
      const data = await res.json();
      const reply =
        typeof data.reply === 'string'
          ? data.reply
          : 'Something went wrong. Please try again.';
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: `b-${Date.now()}`,
            role: 'bot',
            text: reply,
            usedMock: data.usedMock,
          })
      );
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: `b-${Date.now()}`,
            role: 'bot',
            text: 'Network error. Check your connection and try again.',
          })
      );
    } finally {
      setSending(false);
    }
  }, [input, sending, careerGoals, profile]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const headerLabel =
    pageKey === '/learn'
      ? 'Learning Path'
      : pageKey === '/get-started'
        ? 'Get Started'
        : pageKey === '/set-goals'
          ? 'Career Goals'
          : pageKey === '/job-search'
            ? 'Job Search'
            : 'Dashboard';

  return (
    <div className="chatbot-root">
      <button
        type="button"
        className="chatbot-fab"
        aria-expanded={open}
        aria-controls="careerbot-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fas fa-comment-dots" />
        <span className="chatbot-fab-tooltip">Chat with CareerBot</span>
      </button>

      {open && (
        <div id="careerbot-panel" className="chatbot-panel" role="dialog" aria-label="CareerBot chat">
          <div className="chatbot-panel-header">
            <div>
              <h2 className="chatbot-panel-title">CareerBot</h2>
              <p className="chatbot-panel-sub">{headerLabel}</p>
            </div>
            <div className="chatbot-panel-actions">
              <button type="button" className="btn-ghost-header" onClick={clearChat}>
                Clear
              </button>
              <button
                type="button"
                className="btn-icon-header"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((m) =>
              m.typing ? (
                <div key={m.id} className="chat-row bot">
                  <div className="bubble bot typing-bubble">
                    <div className="typing-indicator" aria-hidden="true">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={m.id} className={`chat-row ${m.role}`}>
                  <div className={`bubble ${m.role}`}>
                    <div className="bubble-text">{m.text}</div>
                    {m.usedMock && <span className="mock-badge">Demo mode</span>}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="chatbot-composer">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your career…"
              maxLength={4000}
              disabled={sending}
              aria-label="Message CareerBot"
            />
            <button type="button" className="btn-send" onClick={send} disabled={sending || !input.trim()}>
              <i className="fas fa-paper-plane" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
