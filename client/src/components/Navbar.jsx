import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="navbar__logo">◆</span> AI Support Desk
      </Link>

      {user && (
        <nav className="navbar__links">
          {user.role === 'customer' && (
            <>
              <NavLink to="/tickets">My Tickets</NavLink>
              <NavLink to="/tickets/new">New Ticket</NavLink>
            </>
          )}
          {(user.role === 'agent' || user.role === 'admin') && (
            <>
              <NavLink to="/agent">Dashboard</NavLink>
              <NavLink to="/stats">Statistics</NavLink>
            </>
          )}
          {user.role === 'admin' && <NavLink to="/admin/users">Users</NavLink>}
          {user.role === 'customer' && <NavLink to="/stats">Statistics</NavLink>}
        </nav>
      )}

      <div className="navbar__right">
        {user && (
          <>
            <span
              className={`conn-dot ${connected ? 'conn-dot--on' : 'conn-dot--off'}`}
              title={connected ? 'Real-time connected' : 'Real-time offline'}
            />
            <span className="navbar__user">
              {user.name} <em>· {user.role}</em>
            </span>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Log out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
