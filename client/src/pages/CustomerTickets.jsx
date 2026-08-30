import { Link } from 'react-router-dom';
import { useLiveTickets } from '../hooks/useLiveTickets.js';
import TicketList from '../components/TicketList.jsx';
import Loader from '../components/Loader.jsx';

export default function CustomerTickets() {
  const { tickets, loading, error, reload } = useLiveTickets();

  return (
    <div className="page">
      <div className="page__head">
        <h1>My tickets</h1>
        <Link to="/tickets/new" className="btn btn--primary">
          + New ticket
        </Link>
      </div>

      {loading && <Loader label="Loading your tickets…" />}
      {error && (
        <div className="alert alert--error">
          {error} <button className="btn btn--sm btn--ghost" onClick={reload}>Retry</button>
        </div>
      )}
      {!loading && !error && (
        <TicketList
          tickets={tickets}
          emptyText="You have not submitted any tickets yet."
        />
      )}
    </div>
  );
}
