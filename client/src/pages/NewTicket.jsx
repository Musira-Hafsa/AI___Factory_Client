import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES } from '../lib/constants.js';

export default function NewTicket() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ subject: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/tickets', {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category || undefined,
      });
      toast.success(`Ticket ${res.data.ticket.ticketNumber} submitted`);
      navigate(`/tickets/${res.data.ticket.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--narrow">
      <h1>Submit a ticket</h1>
      <p className="muted">
        Describe your issue. Our AI assistant will triage it and route it to the right agent.
      </p>

      <form onSubmit={submit} className="form card">
        <label>
          Subject
          <input
            value={form.subject}
            onChange={update('subject')}
            maxLength={140}
            placeholder="Short summary of the problem"
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={form.description}
            onChange={update('description')}
            rows={7}
            placeholder="Include order numbers, dates, error messages — anything that helps."
            required
          />
        </label>

        <label>
          Category <span className="muted">(optional — the agent confirms this)</span>
          <select value={form.category} onChange={update('category')}>
            <option value="">Let the AI decide</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/tickets')}>
            Cancel
          </button>
          <button className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
