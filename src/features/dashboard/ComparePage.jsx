import { Link, useOutletContext, useSearchParams } from 'react-router'
import Icon from '../../components/Icon.jsx'
import { OWN_TEAM } from '../../config/team.js'
import {
  DRIVETRAIN_OPTIONS,
  FLOWER_PIECE_OPTIONS,
  SHOOTER_SHAPE_OPTIONS,
} from '../pit-scouting/pit-schema.js'
import { formatNumber } from './analytics.js'
import StarButton from './components/StarButton.jsx'
import TeamSearch from './components/TeamSearch.jsx'
import { METRICS, bestIndexes, isLowSample } from './metrics.js'

const MAX_TEAMS = 4

const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? '—'
const formatInteger = (value) => (value === null || value === undefined ? '—' : String(value))

/** Linha numérica a partir de METRICS (mesmo nome, formato e direção do resto da dashboard). */
const fromMetric = (key, label) => ({
  key,
  label: label ?? METRICS[key].label,
  format: METRICS[key].format,
  better: METRICS[key].better,
})

/**
 * Linhas da comparação, em grupos.
 * better: 'higher' | 'lower' | null — define qual valor da linha ganha destaque.
 * text: linha descritiva (pit), sem destaque.
 */
const GROUPS = [
  {
    // Só aparece com a API da FIRST ligada e partidas jogadas.
    title: 'Oficial (FIRST)',
    official: true,
    rows: [
      fromMetric('officialRank'),
      {
        key: 'rankingScore',
        label: 'RS (pontuação de ranking)',
        format: formatNumber,
        better: 'higher',
      },
      fromMetric('opr'),
      fromMetric('autoOpr'),
    ],
  },
  {
    title: 'CELL',
    rows: [
      fromMetric('avgTotalHits', 'Acertos por partida'),
      { key: 'avgAutoHits', label: 'Acertos no AUTO', format: formatNumber, better: 'higher' },
      { key: 'avgTeleopHits', label: 'Acertos no TELEOP', format: formatNumber, better: 'higher' },
      fromMetric('accuracy'),
      fromMetric('avgCycleSeconds'),
      fromMetric('avgTeleopCycles'),
    ],
  },
  {
    title: 'Consistência',
    rows: [
      fromMetric('minHits'),
      { key: 'maxHits', label: 'Melhor partida', format: formatInteger, better: 'higher' },
      {
        key: 'hitsStdDev',
        label: 'Variação',
        format: (v) => (v === null || v === undefined ? '—' : `±${formatNumber(v)}`),
        better: 'lower',
      },
    ],
  },
  {
    title: 'Outros pontos',
    rows: [
      fromMetric('avgLeaveParkPoints'),
      fromMetric('avgFlowerPieces'),
      fromMetric('avgGarden'),
    ],
  },
  {
    title: 'Comportamento',
    rows: [fromMetric('defensePlayedRate'), fromMetric('issueRate'), fromMetric('avgDriverRating')],
  },
  {
    title: 'Pit',
    rows: [
      {
        key: 'drivetrain',
        label: 'Tração',
        text: (t) => labelOf(DRIVETRAIN_OPTIONS, t.pit?.drivetrain),
      },
      {
        key: 'shooter',
        label: 'Shooter',
        text: (t) => labelOf(SHOOTER_SHAPE_OPTIONS, t.pit?.shooterShape),
      },
      {
        key: 'flower',
        label: 'Pontua na FLOWER',
        text: (t) =>
          !t.pit
            ? '—'
            : t.pit.flowerPlaces?.length
              ? t.pit.flowerPlaces.map((v) => labelOf(FLOWER_PIECE_OPTIONS, v)).join(' e ')
              : 'Não',
      },
      {
        key: 'removes',
        label: 'Tira da FLOWER',
        text: (t) => (!t.pit ? '—' : t.pit.removesFromFlower ? 'Sim' : 'Não'),
      },
    ],
  },
]

/** "16053,8743" → [16053, 8743], sem repetidos e no máximo 4. */
function parseTeams(value) {
  const numbers = (value ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
  return [...new Set(numbers)].slice(0, MAX_TEAMS)
}

/**
 * Duas a quatro equipes lado a lado, com o melhor valor de cada linha destacado.
 * As equipes ficam no endereço (?equipes=16053,8743): dá para mandar o link.
 */
export default function ComparePage() {
  const { summary, watchlist } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const byNumber = new Map(summary.teams.map((t) => [t.teamNumber, t]))
  const chosen = parseTeams(params.get('equipes')).filter((n) => byNumber.has(n))
  const teams = chosen.map((n) => byNumber.get(n))

  function setTeams(numbers) {
    setParams(numbers.length ? { equipes: numbers.join(',') } : {}, { replace: true })
  }

  const available = summary.teams.filter((t) => !chosen.includes(t.teamNumber))
  const favorites = [...watchlist.teams].filter((n) => byNumber.has(n)).slice(0, MAX_TEAMS)

  return (
    <div className="dashboard__body">
      <section className="panel compare-picker">
        <header className="panel__header">
          <h2>Comparar equipes</h2>
          <p className="muted">
            Escolha de 2 a {MAX_TEAMS} equipes. Em cada linha, o melhor valor fica destacado.
          </p>
        </header>

        {chosen.length > 0 && (
          <ul className="compare-chips" aria-label="Equipes escolhidas">
            {teams.map((t) => (
              <li key={t.teamNumber}>
                <span>
                  <strong>{t.teamNumber}</strong> {t.teamName}
                </span>
                <button
                  type="button"
                  aria-label={`Tirar ${t.teamNumber} da comparação`}
                  onClick={() => setTeams(chosen.filter((n) => n !== t.teamNumber))}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="compare-picker__actions">
          {chosen.length < MAX_TEAMS && (
            <TeamSearch
              teams={available}
              label="Adicionar equipe à comparação"
              placeholder="Adicionar equipe"
              onPick={(team) => setTeams([...chosen, team.teamNumber])}
            />
          )}
          {favorites.length >= 2 && (
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setTeams(favorites)}
            >
              <Icon name="star" size={18} />
              Usar favoritas
            </button>
          )}
          {chosen.length > 0 && (
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setTeams([])}
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {teams.length < 2 ? (
        <p className="muted empty-inline">
          {teams.length === 0
            ? 'Busque uma equipe acima, use as favoritas ou toque em "Comparar" na ficha de uma equipe.'
            : 'Adicione mais uma equipe para comparar.'}
        </p>
      ) : (
        <CompareTable teams={teams} watchlist={watchlist} />
      )}
    </div>
  )
}

function CompareTable({ teams, watchlist }) {
  return (
    <div className="panel">
      <div className="table-scroll" role="region" aria-label="Comparação" tabIndex={0}>
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col" className="compare-table__label">
                <span className="visually-hidden">Métrica</span>
              </th>
              {teams.map((t) => (
                <th
                  key={t.teamNumber}
                  scope="col"
                  className={t.teamNumber === OWN_TEAM.number ? 'is-own' : ''}
                >
                  <div className="compare-table__team">
                    <Link to={`/dashboard/equipe/${t.teamNumber}`}>
                      <strong>{t.teamNumber}</strong>
                      <span>{t.teamName || 'Sem pit'}</span>
                    </Link>
                    <StarButton teamNumber={t.teamNumber} watchlist={watchlist} compact />
                  </div>
                  <span className="compare-table__played">
                    {t.played} {t.played === 1 ? 'partida' : 'partidas'}
                    {t.played > 0 && isLowSample(t) && (
                      <span className="tag tag--warn">poucos dados</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {GROUPS.filter(
            (group) =>
              !group.official ||
              teams.some((t) =>
                group.rows.some((row) => t[row.key] !== null && t[row.key] !== undefined),
              ),
          ).map((group) => (
            <tbody key={group.title}>
              <tr className="compare-table__group">
                <th scope="rowgroup" colSpan={teams.length + 1}>
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => {
                const values = teams.map((t) => (row.text ? null : t[row.key]))
                const best = row.text ? new Set() : bestIndexes(values, row.better)
                return (
                  <tr key={row.key}>
                    <th scope="row" className="compare-table__label">
                      {row.label}
                    </th>
                    {teams.map((t, i) => (
                      <td key={t.teamNumber} className={best.has(i) ? 'is-best' : undefined}>
                        {row.text ? row.text(t) : row.format(values[i])}
                        {best.has(i) && <span className="visually-hidden"> (melhor)</span>}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  )
}
