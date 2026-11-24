import { useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { OWN_TEAM } from '../../config/team.js'
import OfficialStatus from '../official/OfficialStatus.jsx'
import { formatNumber, formatRate } from './analytics.js'
import RankedBars from './charts/RankedBars.jsx'
import RankTile from './components/RankTile.jsx'
import { METRICS, hasMetric, leaderMetricsFor, leadersOf, positionOf, rankBy } from './metrics.js'

/** Métricas que dá para ver no comparativo de barras. */
const CHART_METRICS = [
  'opr',
  'avgTotalHits',
  'accuracy',
  'avgCycleSeconds',
  'avgFlowerPieces',
  'avgLeaveParkPoints',
]

/** De cada categoria de líder, o atalho correspondente na aba Equipes. */
const PRESET_FOR = {
  avgTotalHits: 'cell',
  accuracy: 'precisao',
  avgCycleSeconds: 'ciclo',
  avgFlowerPieces: 'flower',
}

function teamsLink(key) {
  return PRESET_FOR[key] ? `equipes?atalho=${PRESET_FOR[key]}` : `equipes?ordem=${key}`
}

export default function OverviewPage() {
  const { summary, official, check } = useOutletContext()
  const { teams, overview } = summary
  // Categorias oficiais (OPR) só aparecem quando a API da FIRST está ligada e tem resultados.
  const leaderKeys = leaderMetricsFor(teams)
  const chartKeys = CHART_METRICS.filter((key) => !METRICS[key].official || hasMetric(teams, key))

  return (
    <div className="dashboard__body">
      <OfficialStatus official={official} />
      <DataCheck check={check} />

      {(overview.ignoredReports > 0 || overview.duplicates > 0) && (
        <p className="data-note muted">
          {overview.duplicates > 0 &&
            `${overview.duplicates} relatório(s) repetido(s) da mesma equipe na mesma partida: valeu o mais recente. `}
          {overview.ignoredReports > 0 &&
            `${overview.ignoredReports} relatório(s) de uma versão antiga do formulário ficaram de fora.`}
        </p>
      )}

      <OwnTeam teams={teams} metricKeys={leaderKeys} />

      <section aria-labelledby="lideres">
        <h2 id="lideres" className="section-heading">
          Líderes
        </h2>
        <div className="leader-grid">
          {leaderKeys.map((key) => (
            <LeaderCard key={key} metricKey={key} teams={teams} />
          ))}
        </div>
      </section>

      <Comparison teams={teams} metricKeys={chartKeys} />
    </div>
  )
}

/** Onde a Clusters está em cada categoria. Some se ainda não jogamos. */
function OwnTeam({ teams, metricKeys }) {
  const own = teams.find((t) => t.teamNumber === OWN_TEAM.number)
  if (!own || own.played === 0) return null

  return (
    <section className="panel own-team" aria-labelledby="nossa-equipe">
      <header className="own-team__header">
        <h2 id="nossa-equipe">
          {OWN_TEAM.name} {OWN_TEAM.number}
        </h2>
        <Link to={`equipe/${OWN_TEAM.number}`} className="text-link">
          Abrir ficha
        </Link>
      </header>
      <dl className="stat-row stat-row--3">
        {metricKeys.map((key) => (
          <RankTile
            key={key}
            label={METRICS[key].label}
            value={METRICS[key].format(own[key])}
            position={positionOf(teams, key, own.teamNumber)}
          />
        ))}
      </dl>
    </section>
  )
}

function LeaderCard({ metricKey, teams }) {
  const metric = METRICS[metricKey]
  const leaders = leadersOf(teams, metricKey)

  return (
    <article className="leader-card">
      <header>
        <h3>{metric.label}</h3>
        <p>{metric.hint}</p>
      </header>
      {leaders.length === 0 ? (
        <p className="muted">Sem dados ainda.</p>
      ) : (
        <ol className="leader-list">
          {leaders.map(({ team, value, rank, lowSample }) => (
            <li
              key={team.teamNumber}
              className={team.teamNumber === OWN_TEAM.number ? 'is-own' : ''}
            >
              <span className="leader-list__rank">{rank}º</span>
              <Link to={`equipe/${team.teamNumber}`} className="leader-list__team">
                <strong>{team.teamNumber}</strong>
                <span>
                  {team.teamName || 'Sem pit'}
                  {lowSample && <span className="tag tag--warn">poucos dados</span>}
                </span>
              </Link>
              <span className="leader-list__value">{metric.format(value)}</span>
            </li>
          ))}
        </ol>
      )}
      <Link to={teamsLink(metricKey)} className="text-link leader-card__more">
        Ver todas
      </Link>
    </article>
  )
}

/** Todas as equipes numa métrica, com troca rápida de métrica. */
function Comparison({ teams, metricKeys }) {
  const [key, setKey] = useState('avgTotalHits')
  const metric = METRICS[key]
  const ranking = rankBy(teams, key)

  return (
    <section className="panel">
      <header className="panel__header panel__header--split">
        <div>
          <h2>Todas as equipes</h2>
          <p className="muted">
            {metric.hint}.
            {metric.better === 'lower' && ' Menor é melhor: a primeira é a mais rápida.'}
          </p>
        </div>
        <div className="chip-switch" role="group" aria-label="Métrica do gráfico">
          {metricKeys.map((k) => (
            <button
              key={k}
              type="button"
              className={k === key ? 'is-selected' : ''}
              aria-pressed={k === key}
              onClick={() => setKey(k)}
            >
              {METRICS[k].short}
            </button>
          ))}
        </div>
      </header>
      <RankedBars
        ariaLabel={`${metric.label}, da melhor para a pior`}
        formatValue={metric.format}
        items={ranking.map(({ team, value }) => ({
          key: team.teamNumber,
          label: String(team.teamNumber),
          sublabel: team.teamName,
          value,
          highlight: team.teamNumber === OWN_TEAM.number,
          to: `equipe/${team.teamNumber}`,
          details: [
            ['acertos', formatNumber(team.avgTotalHits)],
            ['precisão', formatRate(team.accuracy)],
            ['partidas', team.played],
          ],
        }))}
      />
    </section>
  )
}

const ALLIANCE_NAME = { red: 'Vermelha', blue: 'Azul' }
const place = (w) => `Partida ${w.matchNumber}, ${ALLIANCE_NAME[w.alliance]} ${w.station}`

/**
 * Conferência com a tabela oficial: só aparece quando já há partidas oficiais jogadas.
 * Mostra quanto foi coberto e o que precisa de atenção.
 */
function DataCheck({ check }) {
  if (!check.total) return null
  const coverage = Math.round((check.covered / check.total) * 100)
  const fixed = check.wrongTeam.filter((w) => w.likelyTypo)
  const doubtful = check.wrongTeam.filter((w) => !w.likelyTypo)
  const fine = !check.wrongTeam.length && !check.missing.length

  return (
    <section className="panel data-check" aria-labelledby="conferencia">
      <header className="panel__header panel__header--split">
        <div>
          <h2 id="conferencia">Conferência com a tabela oficial</h2>
          <p className="muted">
            {check.covered} de {check.total} robôs das partidas já jogadas têm relatório ({coverage}
            %).
            {fine && ' Tudo confere.'}
          </p>
        </div>
        <span className="data-check__coverage" aria-hidden="true">
          <span style={{ width: `${coverage}%` }} />
        </span>
      </header>

      {doubtful.length > 0 && (
        <div className="data-check__group">
          <h3>Confira com o scouter</h3>
          <ul>
            {doubtful.map((w) => (
              <li key={w.reportId ?? place(w)}>
                {place(w)}: anotaram <strong>{w.reported}</strong>, a tabela diz{' '}
                <strong>{w.expected}</strong>
                {w.scouter && ` (${w.scouter})`}.
              </li>
            ))}
          </ul>
        </div>
      )}

      {fixed.length > 0 && (
        <div className="data-check__group">
          <h3>Corrigidos automaticamente</h3>
          <p className="muted">
            O número anotado não está inscrito no evento, então o relatório conta para a equipe da
            tabela.
          </p>
          <ul>
            {fixed.map((w) => (
              <li key={w.reportId}>
                {place(w)}: {w.reported} → <strong>{w.expected}</strong>
                {w.scouter && ` (${w.scouter})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {check.missing.length > 0 && (
        <div className="data-check__group">
          <h3>Sem relatório ({check.missing.length})</h3>
          <p className="data-check__missing">
            {check.missing.map((m) => `P${m.matchNumber} ${m.teamNumber}`).join(', ')}
          </p>
        </div>
      )}
    </section>
  )
}
