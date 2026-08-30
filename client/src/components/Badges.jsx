const STATUS_CLASS = {
  New: 'badge badge--new',
  Assigned: 'badge badge--assigned',
  'In Progress': 'badge badge--progress',
  Resolved: 'badge badge--resolved',
};

const PRIORITY_CLASS = {
  Low: 'badge badge--low',
  Medium: 'badge badge--medium',
  High: 'badge badge--high',
};

export function StatusBadge({ status }) {
  return <span className={STATUS_CLASS[status] || 'badge'}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  if (!priority) return <span className="badge badge--muted">—</span>;
  return <span className={PRIORITY_CLASS[priority] || 'badge'}>{priority}</span>;
}
