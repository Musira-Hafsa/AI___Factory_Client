import { useMemo, useState } from 'react';
import { useLiveTickets } from '../hooks/useLiveTickets.js';
import TicketList from '../components/TicketList.jsx';
import Loader from '../components/Loader.jsx';
import { STATUSES, PRIORITIES } from '../lib/constants.js';

const SCOPES = [
  ['', 'All'],
  ['?scope=mine', 'Assigned to me'],
  ['?scope=unassigned', 'Unassigned'],
];

export default function AgentDashboard() {
  const [scope, setScope] = useState('');
  const { tickets, loading, error, reload } = useLiveTickets(scope);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filtered = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (!statusFilter || t.status === statusFilter) &&
          (!priorityFilter || t.priority === priorityFilter)
      ),
    [tickets, statusFilter, priorityFilter]
  );

  const counts = useMemo(() => {
    const c = { total: tickets.length, awaitingTriage: 0, open: 0, high: 0 };
    for (const t of tickets) {
      if (!t.aiSuggestion || !t.aiSuggestion.finalized) c.awaitingTriage += 1;
      if (t.status !== 'Resolved') c.open += 1;
      if (t.priority === 'High' && t.status !== 'Resolved') c.high += 1;
    }
    return c;
  }, [tickets]);

  return (
    <div className="page">
      <div className="page__head">
        <h1>Agent dashboard</h1>
      </div>

      <div className="stat-row">
        <div className="stat-chip"><b>{counts.total}</b> in view</div>
        <div className="stat-chip"><b>{counts.open}</b> open</div>
        <div className="stat-chip stat-chip--warn"><b>{counts.awaitingTriage}</b> awaiting triage</div>
        <div className="stat-chip stat-chip--danger"><b>{counts.high}</b> high priority open</div>
      </div>

      <div className="toolbar">
        <div className="segmented">
          {SCOPES.map(([val, label]) => (
            <button
              key={val}
              className={scope === val ? 'seg seg--active' : 'seg'}
              onClick={() => setScope(val)}
            >
              {label}
            </button>
          ))}
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button className="btn btn--ghost btn--sm" onClick={reload}>
          Refresh
        </button>
      </div>

      {loading && <Loader label="Loading tickets…" />}
      {error && (
        <div className="alert alert--error">
          {error} <button className="btn btn--sm btn--ghost" onClick={reload}>Retry</button>
        </div>
      )}
      {!loading && !error && (
        <TicketList tickets={filtered} showCustomer emptyText="No tickets match this view." />
      )}
    </div>
  );
}
