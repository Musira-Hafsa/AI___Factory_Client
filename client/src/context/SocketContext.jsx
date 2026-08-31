import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(import.meta.env.BACKEND_API_URL || '/', {
      auth: { token: getAuthToken() },
      transports: ['websocket', 'polling'],
    });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
