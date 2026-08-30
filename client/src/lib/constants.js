export const ROLES = ['customer', 'agent', 'admin'];

export const CATEGORIES = [
  'Billing',
  'Technical',
  'Account',
  'Shipping',
  'Product',
  'General',
];

export const PRIORITIES = ['Low', 'Medium', 'High'];

export const STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved'];

export function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
