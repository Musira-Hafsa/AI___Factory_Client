import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';

// Loads a ticket list and keeps it in sync via Socket.IO:
//   - ticket:new      → prepend (agents)
//   - ticket:updated  → replace in place, or refetch if it's newly in scope
export function useLiveTickets(query = '') {
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/tickets${query}`);
      setTickets(res.data.tickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;

    const upsert = (incoming) =>
      setTickets((list) => {
        const idx = list.findIndex((t) => t.id === incoming.id);
        if (idx === -1) return list;
        const next = [...list];
        next[idx] = incoming;
        return next;
      });

    const onNew = (t) => setTickets((list) => (list.some((x) => x.id === t.id) ? list : [t, ...list]));
    const onUpdated = (t) => upsert(t);

    socket.on('ticket:new', onNew);
    socket.on('ticket:updated', onUpdated);
    socket.on('ticket:assigned', onNew);

    return () => {
      socket.off('ticket:new', onNew);
      socket.off('ticket:updated', onUpdated);
      socket.off('ticket:assigned', onNew);
    };
  }, [socket]);

  return { tickets, loading, error, reload: load, setTickets };
}
