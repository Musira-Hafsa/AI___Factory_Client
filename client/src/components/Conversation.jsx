import { useEffect, useRef, useState } from 'react';
import { fmtDate } from '../lib/constants.js';

export default function Conversation({
  ticket,
  currentUserId,
  typingUsers,
  disabled,
  disabledReason,
  onSend,
  onType,
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket.messages.length, typingUsers.length]);

  const handleChange = (e) => {
    setBody(e.target.value);
    onType?.(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onType?.(false), 1500);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await onSend(body.trim());
      setBody('');
      onType?.(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card conversation">
      <h2>Conversation</h2>

      <div className="messages">
        {ticket.messages.length === 0 && (
          <p className="muted">No messages yet. Start the conversation below.</p>
        )}
        {ticket.messages.map((m) => {
          const mine = String(m.author) === String(currentUserId);
          return (
            <div
              key={m.id}
              className={`msg ${mine ? 'msg--mine' : ''} ${
                m.isResolutionNote ? 'msg--resolution' : ''
              }`}
            >
              <div className="msg__meta">
                <span className="msg__author">{m.authorName}</span>
                <span className="msg__role">{m.authorRole}</span>
                {m.isResolutionNote && <span className="pill pill--ok">resolution note</span>}
                <span className="msg__time">{fmtDate(m.createdAt)}</span>
              </div>
              <div className="msg__body">{m.body}</div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="typing">
            <span className="typing__dots"><i /><i /><i /></span>
            {typingUsers.map((u) => u.name).join(', ')}{' '}
            {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {disabled ? (
        <div className="alert alert--info">{disabledReason}</div>
      ) : (
        <form onSubmit={submit} className="reply-box">
          <textarea
            value={body}
            onChange={handleChange}
            rows={3}
            placeholder="Write a reply…"
          />
          <button className="btn btn--primary" disabled={sending || !body.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </div>
  );
}
