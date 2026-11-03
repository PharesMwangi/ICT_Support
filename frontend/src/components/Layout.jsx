import { useState, useEffect } from "react";
import {Link, NavLink, Outlet, useLocation} from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx"; 
import {roleLabel} from "../lib/labels.js";
import {Alert} from "./ui.jsx";
import { NotificationsProvider, useNotifications } from '../notifications/NotificationContext.jsx';

const STAFF_NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tickets', label: 'My tickets' },
  { to: '/kb', label: 'Knowledge base' },
  { to: '/notifications', label: 'Notifications', bell: true },
];
const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tickets', label: 'Ticket queue' },
  { to: '/kb', label: 'Knowledge base' },
  { to: '/users', label: 'Users' },
  { to: '/reports', label: 'Reports' },
  { to: '/notifications', label: 'Notifications', bell: true },
];

function NavItems({ items }) {
  const { count } = useNotifications();
  return items.map((item) => (
    <NavLink key={item.to} to={item.to} end={item.end} className="nav__link">
      {item.label}
      {item.bell && count > 0 && (
        <span className="nav__badge" aria-label={`, ${count} unread`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  ));
}

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu after moving to another page.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
      <NotificationsProvider>
      <div className="app">
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        <aside className="sidebar">
          <div className="sidebar__bar">
            <Link className="brand" to="/">
              <span className="brand__org">Ushuru Sacco</span>
              <span className="brand__name">ICT Support</span>
            </Link>
            <button
              type="button"
              className="sidebar__toggle"
              aria-expanded={open}
              aria-controls="sidebar-panel"
              onClick={() => setOpen((o) => !o)}
            >
              Menu
            </button>
          </div>
          <div className="sidebar__panel" id="sidebar-panel" data-open={open}>
            <nav className="nav" aria-label="Main">
              <NavItems items={isAdmin ? ADMIN_NAV : STAFF_NAV} />
              {!isAdmin && (
                <Link className="btn nav__action" to="/tickets/new">
                  New ticket
                </Link>
              )}
            </nav>
            <div className="userbox">
              <div className="userbox__name">{user.name}</div>
              <div className="userbox__meta">
                {user.department}, {roleLabel(user.role)}
              </div>
              <button type="button" className="btn btn--quiet btn--small" onClick={logout}>
                Log out
              </button>
            </div>
          </div>
        </aside>
        <main className="main" id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      </NotificationsProvider>
    );

}

export function SessionEndedNotice() {
  const { sessionEnded } = useAuth();
  if (!sessionEnded) return null;
  return <Alert>Your session ended. Log in again to continue.</Alert>;
}