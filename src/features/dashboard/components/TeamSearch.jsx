import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../../../components/Icon.jsx'
import { searchTeams } from '../metrics.js'

/** Não rouba a tecla "/" de quem está digitando em outro campo. */
function isTyping(element) {
  return element?.closest?.('input, textarea, select, [contenteditable="true"]')
}

/**
 * Campo de busca de equipe por número ou nome, com sugestões.
 *
 * Teclado: ↑ ↓ escolhem, Enter abre, Esc limpa.
 * Com shortcut=true, a tecla "/" em qualquer lugar da página foca o campo.
 *
 * onPick(team) decide o que fazer: abrir a ficha, adicionar na comparação...
 */
export default function TeamSearch({
  teams,
  onPick,
  label = 'Buscar equipe',
  placeholder = 'Buscar equipe por número ou nome',
  shortcut = false,
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const id = useId()
  const listId = `${id}-lista`

  const results = searchTeams(teams, query)
  const showList = open && query.trim() !== ''

  useEffect(() => {
    if (!shortcut) return undefined
    function onKey(event) {
      if (event.key === '/' && !isTyping(event.target)) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  function pick(team) {
    if (!team) return
    onPick(team)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      pick(results[active])
    } else if (event.key === 'Escape') {
      setQuery('')
      setOpen(false)
    }
  }

  return (
    <div className="team-search">
      <label htmlFor={`${id}-campo`} className="visually-hidden">
        {label}
      </label>
      <Icon name="search" size={20} className="team-search__icon" />
      <input
        ref={inputRef}
        id={`${id}-campo`}
        type="search"
        inputMode="search"
        autoComplete="off"
        enterKeyHint="go"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${id}-${active}` : undefined}
        placeholder={placeholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {shortcut && (
        <kbd className="team-search__key" aria-hidden="true">
          /
        </kbd>
      )}
      {showList && (
        <ul id={listId} role="listbox" className="team-search__list" aria-label={label}>
          {results.length === 0 && (
            <li className="team-search__empty" role="presentation">
              Nenhuma equipe com “{query.trim()}”
            </li>
          )}
          {results.map((team, index) => (
            <li
              key={team.teamNumber}
              id={`${id}-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'is-active' : ''}
              // mousedown + preventDefault: escolhe antes do campo perder o foco.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(team)}
              onMouseEnter={() => setActive(index)}
            >
              <strong>{team.teamNumber}</strong>
              <span>{team.teamName || 'Sem entrevista de pit'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
