import { useState } from 'react'
import { useOfficialEvents } from '../official/official-store.js'
import { MIN_EVENT_CODE_LENGTH, currentEventStore, normalizeEventCode } from './event-store.js'

/** "2026-11-21T00:00:00" → "21/11" */
function shortDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : ''
}

/**
 * Mostra o evento atual e permite trocar.
 * Abre já no modo edição quando ainda não há evento definido.
 *
 * Ao trocar, lista os eventos oficiais do Brasil (API da FIRST): tocar num deles usa o
 * código oficial, e o app passa a puxar equipes e tabela de partidas sozinho.
 * Para scrimmage ou evento fora da FIRST, dá para digitar um código próprio.
 */
export default function EventPicker() {
  const currentEvent = currentEventStore.useValue()
  const [editing, setEditing] = useState(!currentEvent)
  const [draft, setDraft] = useState(currentEvent)
  const official = useOfficialEvents(editing)

  const valid = draft.length >= MIN_EVENT_CODE_LENGTH
  const query = draft.toLowerCase()
  const suggestions = official.events
    .filter(
      (e) => !query || e.code.toLowerCase().includes(query) || e.name.toLowerCase().includes(query),
    )
    .slice(0, 8)

  function choose(code) {
    currentEventStore.set(code)
    setDraft(code)
    setEditing(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (valid) choose(draft)
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
          placeholder="Ex.: BRFOQ"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <span className="muted field-hint">
          Use o mesmo código em todos os celulares da equipe. Os relatórios ficam separados por
          evento.
        </span>
      </label>

      {suggestions.length > 0 && (
        <div className="event-options">
          <p className="event-options__title">Eventos oficiais do Brasil</p>
          <ul>
            {suggestions.map((e) => (
              <li key={e.code}>
                <button type="button" onClick={() => choose(e.code)}>
                  <strong>{e.code}</strong>
                  <span>{e.name}</span>
                  <small>{[shortDate(e.dateStart), e.city].filter(Boolean).join(' em ')}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {official.loading && <p className="muted field-hint">Buscando eventos oficiais…</p>}

      <button className="button" type="submit" disabled={!valid}>
        Salvar evento
      </button>
    </form>
  )
}
