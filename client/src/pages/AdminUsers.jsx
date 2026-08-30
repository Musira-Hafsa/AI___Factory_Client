import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import { ROLES, fmtDate } from '../lib/constants.js';

const ROLE_CLASS = {
  customer: 'badge badge--muted',
  agent: 'badge badge--assigned',
  admin: 'badge badge--high',
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh: another admin changing a role updates this table too.
  useEffect(() => {
    if (!socket) return;
    const onUpdated = (updated) =>
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    socket.on('user:updated', onUpdated);
    return () => socket.off('user:updated', onUpdated);
  }, [socket]);

  const changeRole = async (id, role) => {
    const prev = users;
    setSavingId(id);
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      const res = await api.patch(`/users/${id}/role`, { role });
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...res.data.user } : u)));
      toast.success(`${res.data.user.name} is now ${role}`);
    } catch (err) {
      setUsers(prev); // roll back the optimistic change
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Loader label="Loading users…" />;
  if (error)
    return (
      <div className="page">
        <div className="alert alert--error">
          {error} <button className="btn btn--sm btn--ghost" onClick={load}>Retry</button>
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="page__head">
        <h1>User management</h1>
        <span className="muted">{users.length} registered {users.length === 1 ? 'user' : 'users'}</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Date Joined</th>
              <th>Update Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id}>
                  <td>{u.name}{isSelf && <span className="muted"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td><span className={ROLE_CLASS[u.role] || 'badge'}>{u.role}</span></td>
                  <td className="muted">{fmtDate(u.createdAt)}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={savingId === u.id || isSelf}
                      title={isSelf ? 'You cannot change your own role' : undefined}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
