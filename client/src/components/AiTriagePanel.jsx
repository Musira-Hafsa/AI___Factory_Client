import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES, PRIORITIES, fmtDate } from '../lib/constants.js';

// Agent-facing: run AI triage, then review/edit the suggestion before saving.
export default function AiTriagePanel({ ticket, onUpdated }) {
  const toast = useToast();
  const s = ticket.aiSuggestion;

  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    category: ticket.category || s?.category || '',
    priority: ticket.priority || s?.priority || 'Medium',
    summary: s?.summary || '',
  });

  // Keep the editable draft in step with new suggestions arriving (incl. via socket).
  useEffect(() => {
    setDraft({
      category: ticket.category || ticket.aiSuggestion?.category || '',
      priority: ticket.priority || ticket.aiSuggestion?.priority || 'Medium',
      summary: ticket.aiSuggestion?.summary || '',
    });
  }, [ticket.aiSuggestion?.generatedAt, ticket.aiSuggestion?.summary, ticket.category, ticket.priority]);

  const runTriage = async () => {
    setRunning(true);
    setError('');
    try {
      const res = await api.post(`/tickets/${ticket.id}/triage`);
      onUpdated(res.data.ticket);
      const src = res.data.suggestion.source;
      if (src === 'claude') toast.success('AI triage complete — review below');
      else toast.info(`AI unavailable — showing a fallback suggestion (${src})`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/tickets/${ticket.id}/triage/finalize`, draft);
      onUpdated(res.data.ticket);
      toast.success(
        res.data.assignmentNote
          ? `Triage saved — ${res.data.assignmentNote}`
          : 'Triage saved'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="card ai-panel">
      <div className="ai-panel__head">
        <h2>AI triage</h2>
        {s?.finalized && <span className="pill pill--ok">finalized</span>}
      </div>

      {!s && (
        <>
          <p className="muted">
            Run AI triage to get a suggested category, priority, and summary. You review and
            edit it before it is applied.
          </p>
          <button className="btn btn--primary" onClick={runTriage} disabled={running}>
            {running ? 'Analyzing…' : 'Run AI triage'}
          </button>
        </>
      )}

      {s && (
        <>
          <div className="ai-suggestion">
            <div className="ai-suggestion__tag">
              Source: <b>{s.source}</b>
              {s.model ? ` · ${s.model}` : ''} · {fmtDate(s.generatedAt)}
              {typeof s.latencyMs === 'number' ? ` · ${s.latencyMs}ms` : ''}
            </div>
            {s.error && (
              <div className="alert alert--warn">
                AI service issue: {s.error}. The values below are a safe fallback — edit as needed.
              </div>
            )}
            <div className="ai-suggestion__raw">
              <span>Suggested category: <b>{s.category}</b></span>
              <span>Suggested priority: <b>{s.priority}</b></span>
              <span>Summary: <i>{s.summary}</i></span>
            </div>
          </div>

          <div className="form">
            <div className="form__row">
              <label>
                Category
                <select value={draft.category} onChange={update('category')}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select value={draft.priority} onChange={update('priority')}>
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Summary for the record
              <textarea value={draft.summary} onChange={update('summary')} rows={3} />
            </label>

            {error && <div className="alert alert--error">{error}</div>}

            <div className="form__actions">
              <button className="btn btn--ghost btn--sm" onClick={runTriage} disabled={running}>
                {running ? 'Re-running…' : 'Re-run AI'}
              </button>
              <button className="btn btn--primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : s.finalized ? 'Update triage' : 'Save & apply'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
