import { useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Legal forward transitions, mirrored from the server for a tidy UI.
const NEXT = {
  New: ['Assigned', 'In Progress'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
};

export default function AgentControls({ ticket, onUpdated }) {
  const toast = useToast();
  const { user } = useAuth();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState(ticket.resolutionSummary || '');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const mineOrAdmin =
    user.role === 'admin' ||
    (ticket.assignedAgent && ticket.assignedAgent.id === user.id);

  const call = async (label, fn) => {
    setBusy(label);
    setError('');
    try {
      const res = await fn();
      if (res?.data?.ticket) onUpdated(res.data.ticket);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy('');
    }
  };

  const claim = () =>
    call('claim', () => api.patch(`/tickets/${ticket.id}/assign`, { agentId: user.id })).then(() =>
      toast.success('Ticket assigned to you')
    );

  const setStatus = (status) => {
    if (status === 'Resolved') {
      setResolveOpen(true);
      return;
    }
    call('status', () => api.patch(`/tickets/${ticket.id}/status`, { status })).then(() =>
      toast.success(`Status → ${status}`)
    );
  };

  const suggestSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.post(`/tickets/${ticket.id}/resolution-summary`);
      setResolutionSummary(res.data.summary);
      toast.info(res.data.source === 'claude' ? 'AI summary drafted' : `Fallback summary (${res.data.source})`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const confirmResolve = async () => {
    if (!resolutionNote.trim()) {
      setError('A resolution note is required to resolve a ticket.');
      return;
    }
    await call('resolve', () =>
      api.patch(`/tickets/${ticket.id}/status`, {
        status: 'Resolved',
        resolutionNote: resolutionNote.trim(),
        resolutionSummary: resolutionSummary.trim() || undefined,
      })
    );
    toast.success('Ticket resolved');
    setResolveOpen(false);
    setResolutionNote('');
  };

  const reopen = () =>
    call('reopen', () => api.post(`/tickets/${ticket.id}/reopen`, { reason: 'Reopened by agent' })).then(
      () => toast.success('Ticket reopened')
    );

  return (
    <div className="card agent-controls">
      <h2>Agent controls</h2>

      {!ticket.assignedAgent && (
        <button className="btn btn--primary" onClick={claim} disabled={busy === 'claim'}>
          {busy === 'claim' ? 'Claiming…' : 'Claim this ticket'}
        </button>
      )}

      {ticket.assignedAgent && (
        <p className="muted">
          Assigned to <b>{ticket.assignedAgent.name}</b>
          {ticket.assignedAgent.id === user.id ? ' (you)' : ''}
        </p>
      )}

      {!mineOrAdmin && ticket.assignedAgent && (
        <div className="alert alert--info">
          This ticket is assigned to another agent. Only its assignee or an admin can change it.
        </div>
      )}

      {mineOrAdmin && ticket.status !== 'Resolved' && (
        <div className="control-group">
          <span className="muted">Move to:</span>
          {NEXT[ticket.status].map((st) => (
            <button
              key={st}
              className={st === 'Resolved' ? 'btn btn--success btn--sm' : 'btn btn--ghost btn--sm'}
              onClick={() => setStatus(st)}
              disabled={busy === 'status'}
            >
              {st}
            </button>
          ))}
          {NEXT[ticket.status].length === 0 && <span className="muted">no further steps</span>}
        </div>
      )}

      {mineOrAdmin && ticket.status === 'Resolved' && (
        <button className="btn btn--ghost btn--sm" onClick={reopen} disabled={busy === 'reopen'}>
          {busy === 'reopen' ? 'Reopening…' : 'Reopen ticket'}
        </button>
      )}

      {error && <div className="alert alert--error">{error}</div>}

      {resolveOpen && (
        <div className="resolve-form">
          <h3>Resolve ticket</h3>
          <label>
            Resolution note to the customer <span className="req">*</span>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              placeholder="Explain how the issue was resolved…"
            />
          </label>
          <label>
            Internal resolution summary <span className="muted">(optional)</span>
            <textarea
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              rows={2}
            />
          </label>
          <div className="form__actions">
            <button className="btn btn--ghost btn--sm" onClick={suggestSummary} disabled={summaryLoading}>
              {summaryLoading ? 'Drafting…' : '✨ Draft summary with AI'}
            </button>
            <div className="spacer" />
            <button className="btn btn--ghost" onClick={() => setResolveOpen(false)}>
              Cancel
            </button>
            <button className="btn btn--success" onClick={confirmResolve} disabled={busy === 'resolve'}>
              {busy === 'resolve' ? 'Resolving…' : 'Confirm resolve'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
