import { useState } from 'react'
import { Link } from 'react-router'
import { OWN_TEAM } from '../../../config/team.js'
import { formatNumber, formatRate } from '../analytics.js'

/**
 * Colunas da tabela de ranking.
 * lowerIsBetter: o primeiro toque ordena do menor para o maior (ex.: tempo de ciclo).
 */
const COLUMNS = [
  { key: 'played', label: 'Partidas', format: (v) => v },
  { key: 'avgTotalHits', label: 'Acertos', format: formatNumber },
  { key: 'accuracy', label: 'Precisão', format: formatRate },
  { key: 'avgTeleopCycles', label: 'Ciclos', format: formatNumber },
  { key: 'avgCycleSeconds', label: 'Ciclo (s)', format: formatNumber, lowerIsBetter: true },
  { key: 'avgLeaveParkPoints', label: 'LEAVE+PARK', format: formatNumber },
  { key: 'avgFlowerPieces', label: 'FLOWER', format: formatNumber },
  { key: 'avgGarden', label: 'GARDEN', format: formatNumber },
  { key: 'issueRate', label: 'Problemas', format: formatRate, lowerIsBetter: true },
  { key: 'avgDriverRating', label: 'Piloto', format: formatNumber },
]

/** Ordena com valores vazios sempre no fim, em qualquer direção. */
function sortTeams(teams, key, direction) {
  return [...teams].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (va === null || va === undefined) return 1
    if (vb === null || vb === undefined) return -1
    return direction === 'asc' ? va - vb : vb - va
  })
}

export default function TeamTable({ teams }) {
  const [sort, setSort] = useState({ key: 'avgTotalHits', direction: 'desc' })
  const sorted = sortTeams(teams, sort.key, sort.direction)

  function toggle(column) {
    setSort((current) =>
      current.key === column.key
        ? { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key: column.key, direction: column.lowerIsBetter ? 'asc' : 'desc' },
    )
  }

  return (
    <div className="table-scroll" role="region" aria-label="Tabela de equipes" tabIndex={0}>
      <table className="team-table">
        <thead>
          <tr>
            <th scope="col" className="team-table__team">
              Equipe
            </th>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  <button
                    type="button"
                    className={`sort-button ${active ? 'is-active' : ''}`}
                    onClick={() => toggle(column)}
                  >
                    {column.label}
                    <span className="sort-button__arrow" aria-hidden="true">
                      {active ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((team) => (
            <tr
              key={team.teamNumber}
              className={[
                team.teamNumber === OWN_TEAM.number ? 'is-own' : '',
                team.played < 2 ? 'is-thin' : '',
              ].join(' ')}
            >
              <th scope="row" className="team-table__team">
                <Link to={`equipe/${team.teamNumber}`}>
                  <strong>{team.teamNumber}</strong>
                  <span>{team.teamName || 'Sem pit'}</span>
                </Link>
              </th>
              {COLUMNS.map((column) => (
                <td key={column.key}>{column.format(team[column.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
