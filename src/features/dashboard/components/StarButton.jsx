import Icon from '../../../components/Icon.jsx'

/**
 * Estrela de favorita. A lista é compartilhada: marcar aqui aparece para todo mundo.
 * compact: só o ícone (tabela); senão, ícone + texto (ficha da equipe).
 */
export default function StarButton({ teamNumber, watchlist, compact = false }) {
  const on = watchlist.teams.has(teamNumber)
  const text = on ? 'Favorita' : 'Favoritar'
  const label = on ? `Tirar ${teamNumber} das favoritas` : `Favoritar ${teamNumber}`

  return (
    <button
      type="button"
      className={`star-button ${compact ? 'star-button--compact' : ''} ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      aria-label={compact ? label : undefined}
      title={label}
      onClick={() => watchlist.toggle(teamNumber)}
    >
      <Icon name="star" size={compact ? 20 : 18} />
      {!compact && text}
    </button>
  )
}
