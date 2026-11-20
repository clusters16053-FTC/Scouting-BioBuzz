import { Link, NavLink, Outlet } from 'react-router'
import { NAV_ITEMS } from './navigation.js'

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>
            Scouting <strong>BIOBUZZ</strong>
          </span>
        </Link>
        <span className="team-tag">Clusters #16053</span>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className="bottom-nav__link">
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
