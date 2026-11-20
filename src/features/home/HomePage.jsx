import { Link } from 'react-router'
import { NAV_ITEMS } from '../../app/navigation.js'
import { SEASON } from '../../config/game.js'

export default function HomePage() {
  const shortcuts = NAV_ITEMS.filter((item) => item.to !== '/')

  return (
    <section className="home">
      <h1>
        {SEASON.name} <span className="muted">{SEASON.year}</span>
      </h1>
      <p className="muted">O que você vai fazer agora?</p>

      <div className="shortcut-grid">
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to} className="shortcut-card">
            <span className="shortcut-card__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="shortcut-card__title">{item.label}</span>
            <span className="shortcut-card__desc">{item.description}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
