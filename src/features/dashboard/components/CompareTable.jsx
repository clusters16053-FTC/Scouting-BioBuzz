import { Link } from 'react-router'
import { OWN_TEAM } from '../../../config/team.js'
import {
  DRIVETRAIN_OPTIONS,
  FLOWER_PIECE_OPTIONS,
  SHOOTER_SHAPE_OPTIONS,
} from '../../pit-scouting/pit-schema.js'
import { formatNumber } from '../analytics.js'
import { METRICS, bestIndexes, isLowSample } from '../metrics.js'
import StarButton from './StarButton.jsx'

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

/**
 * Equipes lado a lado, uma linha por métrica, com o melhor valor de cada linha destacado.
 * Usada na aba Comparar e na Simular partida (as 4 equipes do confronto).
 * alliances (opcional): { 16053: 'red', ... } pinta o número de cada equipe na cor da aliança.
 */
export default function CompareTable({ teams, watchlist, alliances = {} }) {
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
                  className={[
                    t.teamNumber === OWN_TEAM.number ? 'is-own' : '',
                    alliances[t.teamNumber] ? `is-${alliances[t.teamNumber]}` : '',
                  ].join(' ')}
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
