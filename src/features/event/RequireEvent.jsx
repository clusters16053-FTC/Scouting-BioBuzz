import EventPicker from './EventPicker.jsx'
import { currentEventStore } from './event-store.js'

/**
 * Só mostra o conteúdo (children) quando há um evento definido.
 * O children recebe o código do evento como função: {(eventId) => ...}
 */
export default function RequireEvent({ children }) {
  const eventId = currentEventStore.useValue()

  if (!eventId) {
    return (
      <section className="stack">
        <h1>Qual é o evento?</h1>
        <p className="muted">Defina o evento antes de começar o scouting.</p>
        <EventPicker />
      </section>
    )
  }

  return children(eventId)
}
