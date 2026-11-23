import { Link, NavLink, Outlet } from 'react-router'
import Icon from '../components/Icon.jsx'
import { currentEventStore } from '../features/event/event-store.js'
import { NAV_ITEMS } from './navigation.js'

export default function Layout() {
  const eventId = currentEventStore.useValue()

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <img src="/clusters-logo.png" alt="" width="32" height="32" />
          <span>Scouting</span>
        </Link>
        {eventId && (
          <Link to="/" className="event-chip" title="Evento atual">
            {eventId}
          </Link>
        )}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="bottom-nav__link">
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
