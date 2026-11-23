import { Link } from 'react-router'
import Icon from '../../components/Icon.jsx'
import { NAV_ITEMS } from '../../app/navigation.js'
import { SEASON } from '../../config/game.js'
import { useSession } from '../access/session-context.js'
import EventPicker from '../event/EventPicker.jsx'

export default function HomePage() {
  const { member } = useSession()
  const shortcuts = NAV_ITEMS.filter((item) => item.to !== '/')

  return (
    <section className="home">
      <header className="home__intro">
        <h1>Olá, {member?.name ?? 'scouter'}</h1>
        <p className="muted">
          Temporada {SEASON.name} {SEASON.year}
        </p>
      </header>

      <EventPicker />

      <nav className="shortcut-list" aria-label="O que fazer agora">
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to} className="shortcut">
            <span className="shortcut__icon">
              <Icon name={item.icon} size={26} />
            </span>
            <span className="shortcut__text">
              <span className="shortcut__title">{item.label}</span>
              <span className="shortcut__desc">{item.description}</span>
            </span>
          </Link>
        ))}
      </nav>
    </section>
  )
}
