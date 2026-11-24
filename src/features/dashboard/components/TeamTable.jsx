import { Link } from 'react-router'
import { OWN_TEAM } from '../../../config/team.js'
import { METRICS, TABLE_COLUMNS, isLowSample } from '../metrics.js'
import StarButton from './StarButton.jsx'

const PLAYED = { short: 'Partidas', hint: 'Partidas jogadas (sem contar ausências)' }

/**
 * Tabela de equipes. Recebe as equipes JÁ filtradas e ordenadas pela página;
 * sort ({ key, direction } ou null) só marca a coluna ativa, e onSort(key) avisa o clique.
 */
export default function TeamTable({ teams, sort, onSort, watchlist, columns = TABLE_COLUMNS }) {
  return (
    <div className="table-scroll" role="region" aria-label="Tabela de equipes" tabIndex={0}>
      <table className="team-table">
        <thead>
          <tr>
            <th scope="col" className="team-table__team">
              Equipe
            </th>
            {columns.map((key) => (
              <SortHeader
                key={key}
                columnKey={key}
                meta={METRICS[key]}
                sort={sort}
                onSort={onSort}
              />
            ))}
            <SortHeader columnKey="played" meta={PLAYED} sort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr
              key={team.teamNumber}
              className={[
                team.teamNumber === OWN_TEAM.number ? 'is-own' : '',
                isLowSample(team) ? 'is-thin' : '',
              ].join(' ')}
            >
              <th scope="row" className="team-table__team">
                <div className="team-table__cell">
                  <StarButton teamNumber={team.teamNumber} watchlist={watchlist} compact />
                  <Link to={`/dashboard/equipe/${team.teamNumber}`}>
                    <strong>{team.teamNumber}</strong>
                    <span>{team.teamName || 'Sem pit'}</span>
                  </Link>
                </div>
              </th>
              {columns.map((key) => (
                <td key={key} className={sort?.key === key ? 'is-sorted' : undefined}>
                  {METRICS[key].format(team[key])}
                </td>
              ))}
              <td className={sort?.key === 'played' ? 'is-sorted' : undefined}>{team.played}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SortHeader({ columnKey, meta, sort, onSort }) {
  const active = sort?.key === columnKey
  return (
    <th
      scope="col"
      title={meta.hint}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        className={`sort-button ${active ? 'is-active' : ''}`}
        onClick={() => onSort(columnKey)}
      >
        {meta.short}
        <span className="sort-button__arrow" aria-hidden="true">
          {active ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    </th>
  )
}
