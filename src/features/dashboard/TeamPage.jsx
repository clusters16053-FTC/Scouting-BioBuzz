import { Link, useOutletContext, useParams } from 'react-router'
import Icon from '../../components/Icon.jsx'
import { OWN_TEAM } from '../../config/team.js'
import { INTAKE_OPTIONS, ISSUE_OPTIONS } from '../match-scouting/match-schema.js'
import {
  DRIVETRAIN_OPTIONS,
  FLOWER_PIECE_OPTIONS,
  SHOOTER_SHAPE_OPTIONS,
} from '../pit-scouting/pit-schema.js'
import { formatNumber, formatRate } from './analytics.js'
import MatchColumns from './charts/MatchColumns.jsx'
import MeterList from './charts/MeterList.jsx'
import RankTile from './components/RankTile.jsx'
import StarButton from './components/StarButton.jsx'
import { METRICS, RELIABLE_MATCHES, isLowSample, positionOf } from './metrics.js'
import { usePitPhoto } from './use-pit-photo.js'

/** Números do topo da ficha, cada um com a posição no evento. */
const KEY_METRICS = [
  'avgTotalHits',
  'accuracy',
  'avgCycleSeconds',
  'avgTeleopCycles',
  'avgLeaveParkPoints',
  'avgFlowerPieces',
]

/** Índice da ficha: pula direto para a seção. */
const SECTIONS = [
  ['desempenho', 'Desempenho'],
  ['consistencia', 'Consistência'],
  ['comportamento', 'Comportamento'],
  ['pit', 'Pit'],
  ['observacoes', 'Observações'],
  ['partidas', 'Partidas'],
]

const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? '—'

/** Tendência: as últimas 3 partidas comparadas com a média geral. */
function describeTrend(trend) {
  if (trend === null) return 'Ainda sem partidas suficientes para ver tendência'
  if (Math.abs(trend) < 0.25) return 'Últimas 3 partidas no mesmo nível da média'
  return trend > 0
    ? `Últimas 3 partidas: ${formatNumber(trend)} acertos acima da média geral`
    : `Últimas 3 partidas: ${formatNumber(-trend)} acertos abaixo da média geral`
}

export default function TeamPage() {
  const { teamNumber } = useParams()
  const { eventId, summary, watchlist } = useOutletContext()
  const team = summary.teams.find((t) => t.teamNumber === Number(teamNumber))

  if (!team) {
    return (
      <div className="empty-state">
        <h2>Equipe {teamNumber} sem relatórios neste evento</h2>
        <Link to="/dashboard/equipes" className="button button--ghost">
          Ver todas as equipes
        </Link>
      </div>
    )
  }

  const position = (key) => positionOf(summary.teams, key, team.teamNumber)
  const detail = {
    avgTotalHits: `AUTO ${formatNumber(team.avgAutoHits)} e TELEOP ${formatNumber(team.avgTeleopHits)}`,
    accuracy: `AUTO ${formatRate(team.autoAccuracy)} e TELEOP ${formatRate(team.teleopAccuracy)}`,
    avgCycleSeconds: 'No TELEOP, sem o preload',
    avgTeleopCycles: 'Por partida, no TELEOP',
    avgLeaveParkPoints: 'Pontos por partida',
    avgFlowerPieces: 'NECTAR + POLLEN por partida',
  }
  const sections = SECTIONS.filter(([id]) => {
    if (id === 'observacoes') return team.notes.length > 0
    if (id === 'pit') return true
    return team.played > 0
  })

  return (
    <article className="dashboard__body team-page">
      <header className="team-hero">
        <Link to="/dashboard/equipes" className="back-link">
          <Icon name="back" size={20} />
          Equipes
        </Link>
        <div className="team-hero__title">
          <h2 className="team-hero__number">{team.teamNumber}</h2>
          <div>
            <p className="team-hero__name">{team.teamName || 'Sem entrevista de pit'}</p>
            <p className="muted">
              {team.played} {team.played === 1 ? 'partida jogada' : 'partidas jogadas'}
              {team.noShows > 0 && `, ${team.noShows} sem aparecer`}
            </p>
          </div>
          <div className="team-hero__tags">
            {team.teamNumber === OWN_TEAM.number && <span className="tag">Nossa equipe</span>}
            {team.played > 0 && isLowSample(team) && (
              <span
                className="tag tag--warn"
                title={`Menos de ${RELIABLE_MATCHES} partidas: as médias ainda mudam bastante`}
              >
                poucos dados
              </span>
            )}
          </div>
        </div>
        <div className="team-hero__actions">
          <StarButton teamNumber={team.teamNumber} watchlist={watchlist} />
          <Link
            to={`/dashboard/comparar?equipes=${team.teamNumber}`}
            className="button button--ghost button--small"
          >
            <Icon name="compare" size={18} />
            Comparar
          </Link>
        </div>
      </header>

      <nav className="section-index" aria-label="Seções da ficha">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      {team.played > 0 && (
        <>
          <dl id="desempenho" className="stat-row stat-row--3 anchor-target">
            {KEY_METRICS.map((key, index) => (
              <RankTile
                key={key}
                label={METRICS[key].label}
                value={METRICS[key].format(team[key])}
                detail={detail[key]}
                position={position(key)}
                emphasis={index === 0}
              />
            ))}
          </dl>

          <section id="consistencia" className="panel anchor-target">
            <header className="panel__header">
              <h2>Consistência</h2>
              <p className="muted">
                Acertos no CELL em cada partida. Quanto menor a variação, mais dá para contar com a
                média.
              </p>
            </header>
            <dl className="stat-cells">
              <div>
                <dt>Pior partida</dt>
                <dd>{team.minHits}</dd>
              </div>
              <div>
                <dt>Melhor partida</dt>
                <dd>{team.maxHits}</dd>
              </div>
              <div>
                <dt>Variação</dt>
                <dd>{team.hitsStdDev === null ? '—' : `±${formatNumber(team.hitsStdDev)}`}</dd>
              </div>
              <div>
                <dt>Últimas 3</dt>
                <dd>{formatNumber(team.recentHits)}</dd>
              </div>
            </dl>
            <p className="muted consistency-trend">{describeTrend(team.trend)}.</p>
            <MatchColumns matches={matchesForChart(team)} />
          </section>

          <div id="comportamento" className="panel-grid anchor-target">
            <section className="panel">
              <header className="panel__header">
                <h2>LEAVE, PARK e comportamento</h2>
                <p className="muted">
                  {formatNumber(team.avgLeaveParkPoints)} pontos de LEAVE+PARK por partida (o SWARM
                  pede 16 da aliança).
                </p>
              </header>
              <MeterList
                rows={[
                  { label: 'LEAVE', value: team.leaveRate },
                  { label: 'PARK no AUTO', value: team.autoParkRate },
                  { label: 'PARK no final', value: team.endParkRate },
                  { label: 'Jogou defesa', value: team.defensePlayedRate },
                  { label: 'Sofreu defesa', value: team.defenseReceivedRate },
                  { label: 'Teve problema', value: team.issueRate },
                ]}
              />
            </section>

            <section className="panel">
              <header className="panel__header">
                <h2>FLOWER e GARDEN</h2>
                <p className="muted">Médias por partida, no último minuto.</p>
              </header>
              <dl className="stat-cells stat-cells--3">
                <div>
                  <dt>NECTAR</dt>
                  <dd>{formatNumber(team.avgNectarFlower)}</dd>
                </div>
                <div>
                  <dt>POLLEN</dt>
                  <dd>{formatNumber(team.avgPollenFlower)}</dd>
                </div>
                <div>
                  <dt>GARDEN</dt>
                  <dd>{formatNumber(team.avgGarden)}</dd>
                </div>
              </dl>
              <dl className="fact-list">
                <div>
                  <dt>Pega POLLEN de</dt>
                  <dd>{describeCounts(team.intakeCounts, INTAKE_OPTIONS, team.played)}</dd>
                </div>
                <div>
                  <dt>Problemas</dt>
                  <dd>{describeCounts(team.issueCounts, ISSUE_OPTIONS, team.played)}</dd>
                </div>
                <div>
                  <dt>Nota da pilotagem</dt>
                  <dd>
                    {team.avgDriverRating === null
                      ? 'Sem nota'
                      : `${formatNumber(team.avgDriverRating)} de 5`}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </>
      )}

      <PitPanel eventId={eventId} pit={team.pit} />

      {team.notes.length > 0 && (
        <section id="observacoes" className="panel anchor-target">
          <header className="panel__header">
            <h2>Observações dos scouters</h2>
          </header>
          <ul className="notes">
            {team.notes.map((note) => (
              <li key={`${note.matchNumber}-${note.text}`}>
                <span className="notes__match">Partida {note.matchNumber}</span>
                <p>{note.text}</p>
                {note.scouter && <span className="muted">{note.scouter}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {team.perMatch.length > 0 && (
        <section id="partidas" className="panel anchor-target">
          <header className="panel__header">
            <h2>Tabela partida a partida</h2>
          </header>
          <MatchTable team={team} />
        </section>
      )}
    </article>
  )
}

/** Junta as partidas jogadas com as ausências, em ordem. */
function matchesForChart(team) {
  return [...team.perMatch, ...team.absentMatches].sort((a, b) => a.matchNumber - b.matchNumber)
}

/** { floor: 3, flower: 1 } → "Chão em 3, FLOWER em 1 (de 4 partidas)" */
function describeCounts(counts, options, played) {
  const entries = Object.entries(counts)
  if (!entries.length) return 'Nenhum registro'
  const parts = entries
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `${options.find((o) => o.value === key)?.label ?? key} em ${count}`)
  return `${parts.join(', ')} (de ${played} ${played === 1 ? 'partida' : 'partidas'})`
}

function PitPanel({ eventId, pit }) {
  const photo = usePitPhoto(eventId, pit)

  if (!pit) {
    return (
      <section id="pit" className="panel anchor-target">
        <header className="panel__header">
          <h2>Pit</h2>
          <p className="muted">Ninguém entrevistou essa equipe ainda.</p>
        </header>
      </section>
    )
  }

  const flower = pit.flowerPlaces?.length
    ? pit.flowerPlaces.map((v) => labelOf(FLOWER_PIECE_OPTIONS, v)).join(' e ')
    : 'Não pontua'

  return (
    <section id="pit" className="panel pit-panel anchor-target">
      <header className="panel__header">
        <h2>Pit</h2>
        {pit.scouter && <p className="muted">Entrevista feita por {pit.scouter}</p>}
      </header>
      <div className="pit-panel__body">
        {pit.hasPhoto && (
          <figure className="pit-photo">
            {photo === undefined ? (
              <span className="pit-photo__loading">Carregando foto…</span>
            ) : photo ? (
              <img src={photo} alt={`Robô da equipe ${pit.teamNumber}`} />
            ) : (
              <span className="pit-photo__loading">Foto indisponível</span>
            )}
          </figure>
        )}
        <dl className="fact-list">
          <div>
            <dt>Tração</dt>
            <dd>{labelOf(DRIVETRAIN_OPTIONS, pit.drivetrain)}</dd>
          </div>
          <div>
            <dt>Shooter</dt>
            <dd>{labelOf(SHOOTER_SHAPE_OPTIONS, pit.shooterShape)}</dd>
          </div>
          <div>
            <dt>Pontua na FLOWER</dt>
            <dd>{flower}</dd>
          </div>
          <div>
            <dt>Tira da FLOWER</dt>
            <dd>{pit.removesFromFlower ? 'Sim' : 'Não'}</dd>
          </div>
          {pit.autoNotes && (
            <div className="fact-list__wide">
              <dt>AUTO</dt>
              <dd>{pit.autoNotes}</dd>
            </div>
          )}
          {pit.strategy && (
            <div className="fact-list__wide">
              <dt>Estratégia</dt>
              <dd>{pit.strategy}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

function MatchTable({ team }) {
  return (
    <div className="table-scroll" role="region" aria-label="Partidas da equipe" tabIndex={0}>
      <table className="team-table team-table--compact">
        <thead>
          <tr>
            <th scope="col">Partida</th>
            <th scope="col">AUTO</th>
            <th scope="col">TELEOP</th>
            <th scope="col">Precisão</th>
            <th scope="col">Ciclos</th>
            <th scope="col">Ciclo (s)</th>
            <th scope="col">LEAVE+PARK</th>
          </tr>
        </thead>
        <tbody>
          {team.perMatch.map((m) => {
            const avgCycle = m.cycleSeconds.length
              ? m.cycleSeconds.reduce((a, b) => a + b, 0) / m.cycleSeconds.length
              : null
            return (
              <tr key={m.matchNumber}>
                <th scope="row">{m.matchNumber}</th>
                <td>
                  {m.autoHits}/{m.autoShots}
                </td>
                <td>
                  {m.teleopHits}/{m.teleopShots}
                </td>
                <td>{formatRate(m.totalShots ? m.totalHits / m.totalShots : null)}</td>
                <td>{m.teleopCycles}</td>
                <td>{formatNumber(avgCycle)}</td>
                <td>{m.leaveParkPoints}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
