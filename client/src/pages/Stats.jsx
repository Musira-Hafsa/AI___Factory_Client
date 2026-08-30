import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import Loader from '../components/Loader.jsx';
import { STATUSES, PRIORITIES } from '../lib/constants.js';

function Bar({ label, value, max, tone }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-row__label">{label}</span>
      <div className="bar-row__track">
        <div className={`bar-row__fill bar-row__fill--${tone || 'default'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="bar-row__value">{value}</span>
    </div>
  );
}

export default function Stats() {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh: any ticket change anywhere re-pulls the numbers.
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('ticket:new', refresh);
    socket.on('ticket:updated', refresh);
    return () => {
      socket.off('ticket:new', refresh);
      socket.off('ticket:updated', refresh);
    };
  }, [socket, load]);

  if (loading) return <Loader label="Crunching numbers…" />;
  if (error)
    return (
      <div className="page">
        <div className="alert alert--error">
          {error} <button className="btn btn--sm btn--ghost" onClick={load}>Retry</button>
        </div>
      </div>
    );

  const statusMax = Math.max(1, ...STATUSES.map((s) => stats.byStatus[s] || 0));
  const catEntries = Object.entries(stats.byCategory);
  const catMax = Math.max(1, ...catEntries.map(([, v]) => v));

  return (
    <div className="page">
      <div className="page__head">
        <h1>Statistics</h1>
        <span className="muted">
          {stats.scope === 'customer' ? 'Your tickets' : stats.scope === 'agent' ? 'Tickets assigned to you' : 'All tickets'}
        </span>
      </div>

      <div className="kpi-grid">
        <div className="kpi"><b>{stats.total}</b><span>Total</span></div>
        <div className="kpi"><b>{stats.open}</b><span>Open</span></div>
        <div className="kpi"><b>{stats.resolved}</b><span>Resolved</span></div>
        <div className="kpi"><b>{stats.awaitingTriage}</b><span>Awaiting triage</span></div>
        <div className="kpi">
          <b>{stats.avgResolutionHours ?? '—'}{stats.avgResolutionHours != null ? 'h' : ''}</b>
          <span>Avg. resolution</span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="card">
          <h2>By status</h2>
          {STATUSES.map((s) => (
            <Bar key={s} label={s} value={stats.byStatus[s] || 0} max={statusMax}
              tone={s === 'Resolved' ? 'ok' : s === 'New' ? 'warn' : 'default'} />
          ))}
        </div>

        <div className="card">
          <h2>By priority</h2>
          {PRIORITIES.map((p) => (
            <Bar key={p} label={p} value={stats.byPriority[p] || 0}
              max={Math.max(1, ...PRIORITIES.map((x) => stats.byPriority[x] || 0))}
              tone={p === 'High' ? 'danger' : p === 'Low' ? 'ok' : 'default'} />
          ))}
        </div>

        <div className="card">
          <h2>By category</h2>
          {catEntries.every(([, v]) => v === 0) ? (
            <p className="muted">No categorised tickets yet.</p>
          ) : (
            catEntries.map(([c, v]) => <Bar key={c} label={c} value={v} max={catMax} />)
          )}
        </div>
      </div>
    </div>
  );
}
