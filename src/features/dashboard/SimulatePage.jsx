import { Link, useOutletContext } from 'react-router'
import Icon from '../../components/Icon.jsx'
import { OWN_TEAM } from '../../config/team.js'
import { createLocalStore } from '../../lib/local-store.js'
import { nextMatchOf } from '../official/official-data.js'
import { matchupKey } from '../strategy/board-model.js'
import { allianceOf } from '../strategy/field-layout.js'
import StrategyBoard from '../strategy/StrategyBoard.jsx'
import { formatNumber, formatRate, projectAlliance } from './analytics.js'
import CompareTable from './components/CompareTable.jsx'

/** As 4 equipes escolhidas ficam salvas no aparelho entre uma visita e outra. */
const prepStore = createLocalStore('scouting:match-prep', { red: [null, null], blue: [null, null] })

const ALLIANCES = [
  { key: 'red', label: 'Aliança vermelha' },
  { key: 'blue', label: 'Aliança azul' },
]

/**
 * Simular partida: escolhe as 4 equipes (ou a nossa próxima partida oficial), compara as
 * alianças e rabisca a estratégia no quadro da arena.
 */
export default function SimulatePage() {
  const { eventId, summary, watchlist, official } = useOutletContext()
  const slots = prepStore.useValue()
  const byNumber = new Map(summary.teams.map((t) => [t.teamNumber, t]))
  const options = [...summary.teams].sort((a, b) => a.teamNumber - b.teamNumber)
  // Favoritas aparecem primeiro na lista: é onde costuma estar quem interessa.
  const favorites = options.filter((t) => watchlist.teams.has(t.teamNumber))
  const chosen = [...slots.red, ...slots.blue].filter(Boolean)
  // Próxima partida da nossa equipe pela tabela oficial (se a API da FIRST estiver ligada).
  const ownNext = nextMatchOf(official?.matches ?? [], OWN_TEAM.number)

  function fillOwnNext() {
    const byAlliance = (alliance) =>
      ownNext.match.teams
        .filter((t) => t.alliance === alliance)
        .sort((a, b) => a.station - b.station)
        .map((t) => t.teamNumber)
    const pad = (list) => [list[0] ?? null, list[1] ?? null]
    prepStore.set({ red: pad(byAlliance('red')), blue: pad(byAlliance('blue')) })
  }

  const projections = Object.fromEntries(
    ALLIANCES.map(({ key }) => [key, projectAlliance(slots[key].map((n) => byNumber.get(n)))]),
  )
  const bothFilled = ALLIANCES.every(({ key }) => projections[key].teams.length > 0)
  const hitDiff = projections.red.expectedHits - projections.blue.expectedHits
  const score = estimatedScore(slots, byNumber)
  const chosenTeams = [...slots.red, ...slots.blue]
    .filter(Boolean)
    .map((n) => byNumber.get(n))
    .filter(Boolean)
  const boardTitle = simulationTitle(slots, ownNext)

  function choose(alliance, index, value) {
    prepStore.set((current) => {
      const next = { ...current, [alliance]: [...current[alliance]] }
      next[alliance][index] = value ? Number(value) : null
      return next
    })
  }

  return (
    <div className="dashboard__body">
      <p className="muted prep-intro">
        Escolha os 4 robôs, compare as alianças e desenhe a estratégia no quadro. As projeções somam
        as médias de cada equipe: são uma estimativa, não uma garantia.
      </p>

      {ownNext && (
        <button type="button" className="button prep-own-next" onClick={fillOwnNext}>
          Preencher com nossa próxima partida:{' '}
          {ownNext.match.level === 'qual' ? `Q${ownNext.match.number}` : ownNext.match.description}
          {ownNext.match.startTime &&
            `, ${new Date(ownNext.match.startTime).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`}
        </button>
      )}

      {score && (
        <div className="score-estimate" aria-label="Placar estimado pelo OPR">
          <span className="score-estimate__label">Placar estimado (OPR)</span>
          <span className="score-estimate__value">
            <span className="is-red">{Math.round(score.red)}</span>
            <span aria-hidden="true">×</span>
            <span className="is-blue">{Math.round(score.blue)}</span>
          </span>
          <span className="score-estimate__verdict">
            {Math.abs(score.red - score.blue) < 5
              ? 'Partida parelha: qualquer uma pode vencer.'
              : `Aliança ${score.red > score.blue ? 'vermelha' : 'azul'} na frente por ${Math.round(
                  Math.abs(score.red - score.blue),
                )} pontos, se as médias se repetirem.`}
          </span>
        </div>
      )}

      {bothFilled && (
        <p className="prep-verdict">
          {Math.abs(hitDiff) < 1
            ? 'Partida equilibrada em acertos no CELL.'
            : `A aliança ${hitDiff > 0 ? 'vermelha' : 'azul'} deve acertar ${formatNumber(
                Math.abs(hitDiff),
              )} POLLEN a mais por partida.`}
        </p>
      )}

      <div className="prep-grid">
        {ALLIANCES.map(({ key, label }) => (
          <AlliancePanel
            key={key}
            alliance={key}
            label={label}
            slots={slots[key]}
            options={options}
            favorites={favorites}
            projection={projections[key]}
            onChoose={(index, value) => choose(key, index, value)}
          />
        ))}
      </div>

      {chosenTeams.length >= 2 && (
        <details className="panel simulate-compare">
          <summary>
            <h2>As {chosenTeams.length} equipes lado a lado</h2>
          </summary>
          <CompareTable teams={chosenTeams} watchlist={watchlist} alliances={allianceOf(slots)} />
        </details>
      )}

      {/* key: cada confronto tem o próprio quadro (trocar uma equipe abre outro). */}
      <StrategyBoard key={matchupKey(slots)} eventId={eventId} slots={slots} title={boardTitle} />

      <div className="prep-actions">
        {chosen.length >= 2 && (
          <Link
            to={`/dashboard/comparar?equipes=${chosen.join(',')}`}
            className="button button--ghost"
          >
            <Icon name="compare" size={18} />
            Comparar estas equipes
          </Link>
        )}
        <button
          type="button"
          className="button button--ghost"
          onClick={() => prepStore.set({ red: [null, null], blue: [null, null] })}
        >
          Limpar escolhas
        </button>
      </div>
    </div>
  )
}

/**
 * Placar estimado: soma do OPR (pontos sem faltas) das equipes de cada aliança.
 * Só aparece com as 4 equipes escolhidas e todas com OPR (dados oficiais ligados).
 */
function estimatedScore(slots, byNumber) {
  const sum = (list) => {
    const teams = list.map((n) => (n ? byNumber.get(n) : null))
    if (teams.some((t) => t?.opr === null || t?.opr === undefined)) return null
    return teams.reduce((total, t) => total + t.opr, 0)
  }
  const red = sum(slots.red)
  const blue = sum(slots.blue)
  return red === null || blue === null ? null : { red, blue }
}

/** Título do quadro e da imagem: "Q34: 16053 + 8743 × 18002 + 11234". */
function simulationTitle(slots, ownNext) {
  const side = (list) => list.filter(Boolean).join(' + ') || '?'
  const teams = `${side(slots.red)} × ${side(slots.blue)}`
  const isOwnNext =
    ownNext &&
    [...slots.red, ...slots.blue].every((n) => ownNext.match.teams.some((t) => t.teamNumber === n))
  return isOwnNext && ownNext.match.level === 'qual' ? `Q${ownNext.match.number}: ${teams}` : teams
}

/** Texto de uma opção da lista: "8743 Abelhas Mecânicas (nós)". */
function optionLabel(team) {
  return `${team.teamNumber}${team.teamName ? ` ${team.teamName}` : ''}${
    team.teamNumber === OWN_TEAM.number ? ' (nós)' : ''
  }`
}

function AlliancePanel({ alliance, label, slots, options, favorites, projection, onChoose }) {
  const filled = projection.teams.length > 0
  const swarmShare = Math.min(projection.expectedLeavePark / projection.swarmThreshold, 1)

  return (
    <section className={`alliance alliance--${alliance}`} aria-label={label}>
      <h2>{label}</h2>

      <div className="alliance__pickers">
        {slots.map((value, index) => (
          <label key={index} className="field">
            <span className="field-label">Robô {index + 1}</span>
            <select value={value ?? ''} onChange={(e) => onChoose(index, e.target.value)}>
              <option value="">Escolher equipe</option>
              {favorites.length > 0 && (
                <optgroup label="★ Favoritas">
                  {favorites.map((t) => (
                    <option key={`fav-${t.teamNumber}`} value={t.teamNumber}>
                      {optionLabel(t)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Todas as equipes">
                {options.map((t) => (
                  <option key={t.teamNumber} value={t.teamNumber}>
                    {optionLabel(t)}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        ))}
      </div>

      {filled && (
        <>
          <dl className="alliance__numbers">
            <div>
              <dt>Acertos esperados</dt>
              <dd>{formatNumber(projection.expectedHits)}</dd>
            </div>
            <div>
              <dt>FLOWER esperado</dt>
              <dd>{formatNumber(projection.expectedFlowerPieces)}</dd>
            </div>
          </dl>

          <div className="swarm">
            <div className="swarm__label">
              <span>LEAVE+PARK esperado</span>
              <strong>
                {formatNumber(projection.expectedLeavePark)} de {projection.swarmThreshold}
              </strong>
            </div>
            <span className="swarm__track" aria-hidden="true">
              <span
                className={`swarm__fill ${projection.swarmLikely ? 'is-met' : ''}`}
                style={{ width: `${swarmShare * 100}%` }}
              />
            </span>
            <p className={projection.swarmLikely ? 'swarm__verdict is-met' : 'swarm__verdict'}>
              {projection.swarmLikely
                ? 'Costuma garantir o SWARM RP.'
                : `Faltam ${formatNumber(
                    projection.swarmThreshold - projection.expectedLeavePark,
                  )} pontos para o SWARM RP na média.`}
            </p>
          </div>

          <ul className="alliance__teams">
            {projection.teams.map((t) => (
              <li key={t.teamNumber}>
                <Link to={`/dashboard/equipe/${t.teamNumber}`} className="alliance__team">
                  <strong>{t.teamNumber}</strong>
                  <span className="muted">{t.teamName}</span>
                </Link>
                <dl className="alliance__stats">
                  <div>
                    <dt>Acertos</dt>
                    <dd>{formatNumber(t.avgTotalHits)}</dd>
                  </div>
                  <div>
                    <dt>Precisão</dt>
                    <dd>{formatRate(t.accuracy)}</dd>
                  </div>
                  <div>
                    <dt>Ciclo</dt>
                    <dd>
                      {t.avgCycleSeconds === null ? '—' : `${formatNumber(t.avgCycleSeconds)} s`}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <Alerts projection={projection} />
        </>
      )}
    </section>
  )
}

/** Pontos de atenção para a estratégia, em frases curtas. */
function Alerts({ projection }) {
  const items = []
  const names = (teams) => teams.map((t) => t.teamNumber).join(' e ')

  if (projection.missingData.length)
    items.push(['alert', `${names(projection.missingData)}: sem partidas registradas ainda.`])
  if (projection.risky.length)
    items.push([
      'alert',
      `${names(projection.risky)}: teve problema em 1 a cada 3 partidas ou mais.`,
    ])
  if (projection.defenders.length)
    items.push(['pit', `${names(projection.defenders)}: costuma jogar defesa.`])
  if (projection.flowerRemovers.length)
    items.push(['pit', `${names(projection.flowerRemovers)}: tira POLLEN/NECTAR da FLOWER.`])
  if (!projection.flowerScorers.length)
    items.push(['pit', 'Ninguém aqui costuma pontuar na FLOWER.'])

  if (!items.length) return null
  return (
    <ul className="alerts">
      {items.map(([icon, text]) => (
        <li key={text}>
          <Icon name={icon} size={18} />
          {text}
        </li>
      ))}
    </ul>
  )
}
