import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './Badges.jsx';
import { fmtDate } from '../lib/constants.js';

export default function TicketList({ tickets, showCustomer = false, emptyText = 'No tickets yet.' }) {
  if (!tickets.length) return <div className="empty">{emptyText}</div>;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Subject</th>
            {showCustomer && <th>Customer</th>}
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Agent</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>
                <Link to={`/tickets/${t.id}`} className="mono">
                  {t.ticketNumber}
                </Link>
              </td>
              <td className="cell-subject">
                <Link to={`/tickets/${t.id}`}>{t.subject}</Link>
                {t.aiSuggestion && !t.aiSuggestion.finalized && (
                  <span className="pill pill--ai">AI suggestion pending review</span>
                )}
              </td>
              {showCustomer && <td>{t.customer?.name || '—'}</td>}
              <td>{t.category || <span className="muted">unset</span>}</td>
              <td>
                <PriorityBadge priority={t.priority} />
              </td>
              <td>
                <StatusBadge status={t.status} />
              </td>
              <td>{t.assignedAgent?.name || <span className="muted">unassigned</span>}</td>
              <td className="muted">{fmtDate(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
