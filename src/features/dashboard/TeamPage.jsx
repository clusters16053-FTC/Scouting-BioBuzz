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
import StatTile from './components/StatTile.jsx'
import { usePitPhoto } from './use-pit-photo.js'

const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? '—'

/** "+1,2 acima da média" / "0,8 abaixo da média" */
function describeTrend(trend) {
  if (trend === null) return 'Ainda sem partidas suficientes para tendência'
  if (Math.abs(trend) < 0.25) return 'Estável em relação à média'
  return trend > 0
    ? `${formatNumber(trend)} acima da média geral`
    : `${formatNumber(-trend)} abaixo da média geral`
}

export default function TeamPage() {
  const { teamNumber } = useParams()
  const { eventId, summary } = useOutletContext()
  const team = summary.teams.find((t) => t.teamNumber === Number(teamNumber))

  if (!team) {
    return (
      <div className="empty-state">
        <h2>Equipe {teamNumber} sem relatórios neste evento</h2>
        <Link to="/dashboard" className="button button--ghost">
          Voltar ao ranking
        </Link>
      </div>
    )
  }

  const ranked = summary.teams
    .filter((t) => t.played > 0)
    .sort((a, b) => b.avgTotalHits - a.avgTotalHits)
  const position = ranked.findIndex((t) => t.teamNumber === team.teamNumber) + 1

  return (
    <article className="dashboard__body team-page">
      <header className="team-hero">
        <Link to="/dashboard" className="back-link">
          <Icon name="back" size={20} />
          Ranking
        </Link>
        <div className="team-hero__title">
          <h2 className="team-hero__number">{team.teamNumber}</h2>
          <div>
            <p className="team-hero__name">{team.teamName || 'Sem entrevista de pit'}</p>
            <p className="muted">
              {team.played} {team.played === 1 ? 'partida jogada' : 'partidas jogadas'}
              {team.noShows > 0 && `, ${team.noShows} sem aparecer`}
              {position > 0 && `. ${position}º de ${ranked.length} em acertos`}
            </p>
          </div>
          {team.teamNumber === OWN_TEAM.number && <span className="tag">Nossa equipe</span>}
        </div>
      </header>

      {team.played > 0 && (
        <>
          <dl className="stat-row">
            <StatTile
              label="Acertos por partida"
              value={formatNumber(team.avgTotalHits)}
              detail={`AUTO ${formatNumber(team.avgAutoHits)} e TELEOP ${formatNumber(team.avgTeleopHits)}`}
              emphasis
            />
            <StatTile
              label="Precisão"
              value={formatRate(team.accuracy)}
              detail={`AUTO ${formatRate(team.autoAccuracy)} e TELEOP ${formatRate(team.teleopAccuracy)}`}
            />
            <StatTile
              label="Tempo de ciclo"
              value={`${formatNumber(team.avgCycleSeconds)} s`}
              detail="Coletar e ficar pronto para atirar, no TELEOP"
            />
            <StatTile
              label="Ciclos por partida"
              value={formatNumber(team.avgTeleopCycles)}
              detail="No TELEOP"
            />
          </dl>

          <section className="panel">
            <header className="panel__header">
              <h2>Partida a partida</h2>
              <p className="muted">
                Pior partida {team.minHits}, melhor {team.maxHits}. Últimas 3:{' '}
                {formatNumber(team.recentHits)} ({describeTrend(team.trend)}).
              </p>
            </header>
            <MatchColumns matches={matchesForChart(team)} />
          </section>

          <div className="panel-grid">
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
        <section className="panel">
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
        <section className="panel">
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
      <section className="panel">
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
    <section className="panel pit-panel">
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
