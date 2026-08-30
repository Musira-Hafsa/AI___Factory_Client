import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import { StatusBadge, PriorityBadge } from '../components/Badges.jsx';
import Conversation from '../components/Conversation.jsx';
import AiTriagePanel from '../components/AiTriagePanel.jsx';
import AgentControls from '../components/AgentControls.jsx';
import { fmtDate } from '../lib/constants.js';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);

  const isStaff = user.role === 'agent' || user.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Real-time wiring -----------------------------------------------------
  useEffect(() => {
    if (!socket) return;
    socket.emit('ticket:join', id);

    const onMessage = ({ ticketId, message }) => {
      if (ticketId !== id) return;
      setTicket((t) =>
        t && !t.messages.some((m) => m.id === message.id)
          ? { ...t, messages: [...t.messages, message] }
          : t
      );
    };
    const onUpdated = (fresh) => {
      if (fresh.id === id) setTicket(fresh);
    };
    const onTyping = ({ ticketId, user: who, isTyping }) => {
      if (ticketId !== id || who.id === user.id) return;
      setTypingUsers((list) => {
        const others = list.filter((u) => u.id !== who.id);
        return isTyping ? [...others, who] : others;
      });
    };

    socket.on('message:new', onMessage);
    socket.on('ticket:updated', onUpdated);
    socket.on('typing', onTyping);

    return () => {
      socket.emit('ticket:leave', id);
      socket.off('message:new', onMessage);
      socket.off('ticket:updated', onUpdated);
      socket.off('typing', onTyping);
    };
  }, [socket, id, user.id]);

  // clear stale typing indicators
  useEffect(() => {
    if (!typingUsers.length) return;
    const t = setTimeout(() => setTypingUsers([]), 4000);
    return () => clearTimeout(t);
  }, [typingUsers]);

  const emitTyping = (isTyping) => socket?.emit('typing', { ticketId: id, isTyping });

  const sendMessage = async (body) => {
    const res = await api.post(`/tickets/${id}/messages`, { body });
    setTicket(res.data.ticket);
  };

  const reopen = async () => {
    try {
      const res = await api.post(`/tickets/${id}/reopen`, { reason: 'Customer reopened the ticket' });
      setTicket(res.data.ticket);
      toast.success('Ticket reopened');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader label="Loading ticket…" />;
  if (error)
    return (
      <div className="page page--narrow">
        <div className="alert alert--error">{error}</div>
        <Link to="/" className="btn btn--ghost">← Back</Link>
      </div>
    );
  if (!ticket) return null;

  const resolved = ticket.status === 'Resolved';
  const conversationDisabled = resolved;
  const disabledReason = resolved
    ? 'This ticket is resolved. Reopen it to continue the conversation.'
    : '';

  return (
    <div className="page ticket-detail">
      <Link to={isStaff ? '/agent' : '/tickets'} className="back-link">
        ← Back to {isStaff ? 'dashboard' : 'my tickets'}
      </Link>

      <div className="ticket-header card">
        <div>
          <div className="ticket-header__top">
            <span className="mono ticket-number">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.reopenCount > 0 && (
              <span className="pill pill--muted">reopened ×{ticket.reopenCount}</span>
            )}
          </div>
          <h1>{ticket.subject}</h1>
          <p className="ticket-desc">{ticket.description}</p>
          <div className="ticket-meta muted">
            <span>From {ticket.customer?.name}</span>
            <span>·</span>
            <span>Opened {fmtDate(ticket.createdAt)}</span>
            <span>·</span>
            <span>Category: {ticket.category || ticket.requestedCategory || 'unset'}</span>
            {ticket.assignedAgent && (
              <>
                <span>·</span>
                <span>Agent: {ticket.assignedAgent.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ticket-grid">
        <div className="ticket-grid__main">
          <Conversation
            ticket={ticket}
            currentUserId={user.id}
            typingUsers={typingUsers}
            disabled={conversationDisabled}
            disabledReason={disabledReason}
            onSend={sendMessage}
            onType={emitTyping}
          />
        </div>

        <aside className="ticket-grid__side">
          {isStaff ? (
            <>
              <AiTriagePanel ticket={ticket} onUpdated={setTicket} />
              <AgentControls ticket={ticket} onUpdated={setTicket} />
            </>
          ) : (
            <div className="card">
              <h2>Status</h2>
              <p>
                Your ticket is <StatusBadge status={ticket.status} />.
              </p>
              {ticket.aiSuggestion?.finalized && ticket.aiSuggestion.summary && (
                <p className="muted">
                  <b>Agent summary:</b> {ticket.aiSuggestion.summary}
                </p>
              )}
              {resolved && (
                <>
                  {ticket.resolutionSummary && (
                    <p><b>Resolution:</b> {ticket.resolutionSummary}</p>
                  )}
                  <button className="btn btn--ghost btn--sm" onClick={reopen}>
                    Reopen ticket
                  </button>
                </>
              )}
            </div>
          )}

          <div className="card">
            <h2>History</h2>
            <ol className="timeline">
              {ticket.events.map((e) => (
                <li key={e.id}>
                  <span className="timeline__dot" />
                  <div>
                    <div>{e.message}</div>
                    <div className="muted timeline__time">
                      {e.byName} · {fmtDate(e.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
