import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';
import { staffHome } from '../utils/staffNav';

// Staff pages whose second URL segment is the event id
const EVENT_PAGE = /^\/admin\/([^/]+)\/(\d+)(\/.*)?$/;
// Pages whose next id belongs to the old event (an event specialty): go home instead
const EVENT_BOUND_CHILD = new Set(['dilatation', 'stations']);

/**
 * A staff member (not the super admin) works on one event only: user.event_id.
 * When the super admin moves them to another event (training → real event), a
 * refresh or an old bookmark still carries the previous event id. Swap it for
 * the assigned event so they land on the same page of the new event.
 */
export default function StaleEventRedirect() {
  const { user } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role_id === 1) return;
    const match = location.pathname.match(EVENT_PAGE);
    if (!match) return;
    const [, page, eventId, rest = ''] = match;
    if (String(user.event_id ?? '') === eventId) return;

    if (!user.event_id || (rest && EVENT_BOUND_CHILD.has(page))) {
      navigate(staffHome(user), { replace: true });
      return;
    }
    navigate(`/admin/${page}/${user.event_id}${rest}${location.search}`, { replace: true });
  }, [user, location.pathname, location.search, navigate]);

  return null;
}
