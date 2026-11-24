import { Link, useOutletContext, useSearchParams } from 'react-router'
import Icon from '../../components/Icon.jsx'
import TeamTable from './components/TeamTable.jsx'
import {
  TABLE_COLUMNS,
  hasMetric,
  METRICS,
  PRESETS,
  RELIABLE_MATCHES,
  applyPreset,
  defaultDirection,
  sortTeams,
} from './metrics.js'

/**
 * Todas as equipes, com atalhos de um toque (filtro + ordenação).
 *
 * O atalho e a ordenação ficam no endereço (?atalho=ciclo&ordem=accuracy&dir=asc):
 * o "voltar" do celular funciona e dá para mandar o link para alguém.
 */
export default function TeamsPage() {
  const { summary, watchlist } = useOutletContext()
  const [params, setParams] = useSearchParams()

  const presetId = PRESETS.some((p) => p.id === params.get('atalho'))
    ? params.get('atalho')
    : 'todas'
  // Ordenação escolhida tocando numa coluna; sem ela, vale a ordem do atalho.
  const orderKey = params.get('ordem')
  const dir = params.get('dir')
  const sort =
    orderKey && (METRICS[orderKey] || orderKey === 'played')
      ? {
          key: orderKey,
          direction: dir === 'asc' || dir === 'desc' ? dir : defaultDirection(orderKey),
        }
      : null

  const context = { watchlist: watchlist.teams }
  const presetTeams = applyPreset(summary.teams, presetId, context)
  const shown = sort ? sortTeams(presetTeams, sort.key, sort.direction) : presetTeams
  const counts = Object.fromEntries(
    PRESETS.map((p) => [p.id, summary.teams.filter((t) => p.filter(t, context)).length]),
  )

  function choosePreset(id) {
    setParams(id === 'todas' ? {} : { atalho: id }, { replace: true })
  }

  function chooseSort(key) {
    // Segundo toque na mesma coluna inverte; coluna nova começa do melhor para o pior.
    const flipped = sort?.direction === 'asc' ? 'desc' : 'asc'
    const direction = sort?.key === key ? flipped : defaultDirection(key)
    const next = { ordem: key, dir: direction }
    if (presetId !== 'todas') next.atalho = presetId
    setParams(next, { replace: true })
  }

  const favorites = presetId === 'favoritas' ? shown.slice(0, 4) : []
  // Ranking oficial e OPR entram na frente quando a API da FIRST trouxe resultados.
  const columns = [
    ...['officialRank', 'opr'].filter((key) => hasMetric(summary.teams, key)),
    ...TABLE_COLUMNS,
  ]

  return (
    <div className="dashboard__body">
      <div className="preset-bar" role="group" aria-label="Atalhos">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset ${preset.id === presetId ? 'is-selected' : ''}`}
            aria-pressed={preset.id === presetId}
            onClick={() => choosePreset(preset.id)}
          >
            {preset.label}
            <span className="preset__count">{counts[preset.id]}</span>
          </button>
        ))}
      </div>

      <section className="panel">
        <header className="panel__header panel__header--split">
          <div>
            <h2>{PRESETS.find((p) => p.id === presetId).label}</h2>
            <p className="muted">
              Médias por partida. Toque na coluna para ordenar e na estrela para favoritar (vale
              para todos). Apagadas: menos de {RELIABLE_MATCHES} partidas.
            </p>
          </div>
          {favorites.length >= 2 && (
            <Link
              to={`/dashboard/comparar?equipes=${favorites.map((t) => t.teamNumber).join(',')}`}
              className="button button--ghost button--small"
            >
              <Icon name="compare" size={18} />
              Comparar favoritas
            </Link>
          )}
        </header>

        {shown.length === 0 ? (
          <p className="muted empty-inline">
            {presetId === 'favoritas'
              ? 'Nenhuma favorita ainda. Toque na estrela de uma equipe para ela aparecer aqui.'
              : 'Nenhuma equipe neste atalho por enquanto.'}
          </p>
        ) : (
          <TeamTable
            teams={shown}
            sort={sort}
            onSort={chooseSort}
            watchlist={watchlist}
            columns={columns}
          />
        )}
      </section>
    </div>
  )
}
