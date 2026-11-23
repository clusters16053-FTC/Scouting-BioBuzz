import { useState } from 'react'
import { MIN_EVENT_CODE_LENGTH, currentEventStore, normalizeEventCode } from './event-store.js'

/**
 * Mostra o evento atual e permite trocar.
 * Abre já no modo edição quando ainda não há evento definido.
 */
export default function EventPicker() {
  const currentEvent = currentEventStore.useValue()
  const [editing, setEditing] = useState(!currentEvent)
  const [draft, setDraft] = useState(currentEvent)

  const valid = draft.length >= MIN_EVENT_CODE_LENGTH

  function handleSubmit(event) {
    event.preventDefault()
    if (!valid) return
    currentEventStore.set(draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="event-picker">
        <div>
          <span className="event-picker__label">Evento atual</span>
          <strong className="event-picker__code">{currentEvent}</strong>
        </div>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            setDraft(currentEvent)
            setEditing(true)
          }}
        >
          Trocar
        </button>
      </div>
    )
  }

  return (
    <form className="event-picker event-picker--editing form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Código do evento</span>
        <input
          value={draft}
          onChange={(e) => setDraft(normalizeEventCode(e.target.value))}
          placeholder="Ex.: BRCEFOR"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <span className="muted field-hint">
          Use o mesmo código em todos os celulares da equipe. Os relatórios ficam separados por
          evento.
        </span>
      </label>
      <button className="button" type="submit" disabled={!valid}>
        Salvar evento
      </button>
    </form>
  )
}
