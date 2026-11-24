import { Link } from 'react-router'
import Icon from '../../components/Icon.jsx'
import { NAV_ITEMS } from '../../app/navigation.js'
import { SEASON } from '../../config/game.js'
import { useSession } from '../access/session-context.js'
import EventPicker from '../event/EventPicker.jsx'
import { currentEventStore } from '../event/event-store.js'
import OfficialStatus from '../official/OfficialStatus.jsx'
import { useOfficialData } from '../official/official-store.js'

export default function HomePage() {
  const { member } = useSession()
  const shortcuts = NAV_ITEMS.filter((item) => item.to !== '/')
  const eventId = currentEventStore.useValue()

  return (
    <section className="home">
      <header className="home__intro">
        <h1>Olá, {member?.name ?? 'scouter'}</h1>
        <p className="muted">
          Temporada {SEASON.name} {SEASON.year}
        </p>
      </header>

      <EventPicker />
      {/* key: troca de evento recomeça a busca dos dados oficiais do zero. */}
      {eventId && <HomeOfficial key={eventId} eventId={eventId} />}

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

/** Busca os dados oficiais assim que o evento é escolhido (com internet) e mostra o estado. */
function HomeOfficial({ eventId }) {
  const official = useOfficialData(eventId)
  return <OfficialStatus official={official} />
}
