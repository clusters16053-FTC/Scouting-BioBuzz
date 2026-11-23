import { DEFENSE_OPTIONS, INTAKE_OPTIONS, ISSUE_OPTIONS } from '../match-schema.js'
import { formatPercent, formatSeconds, summarizeCycles } from '../cycles/cycle-math.js'

const yesNo = (value) => (value ? 'Sim' : 'Não')
const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? value
const labelsOf = (options, values) =>
  values.length ? values.map((v) => labelOf(options, v)).join(', ') : '—'

/** "3 ciclos · 9/12 (75%) · 11,0 s" */
function describeCycles(timer) {
  const s = summarizeCycles(timer.cycles)
  if (!s.totalCycles) return 'Nenhum ciclo'
  const label = s.totalCycles === 1 ? 'ciclo' : 'ciclos'
  return `${s.totalCycles} ${label} · ${s.totalHits}/${s.totalShots} (${formatPercent(
    s.accuracy,
  )}) · média ${formatSeconds(s.avgCycleSeconds)}`
}

/** Resumo do relatório antes de salvar. */
export default function ReviewStep({ draft, errors }) {
  const rows = draft.noShow
    ? [['Robô', 'Não apareceu']]
    : [
        ['AUTO · Ciclos', describeCycles(draft.auto.timer)],
        ['AUTO · LEAVE', yesNo(draft.auto.leave)],
        ['AUTO · PARK', yesNo(draft.auto.park)],
        ['TELEOP · Ciclos', describeCycles(draft.teleop.timer)],
        ['TELEOP · Coleta', labelsOf(INTAKE_OPTIONS, draft.teleop.intake)],
        ['Final · NECTAR', draft.endgame.nectarFlower],
        ['Final · POLLEN', draft.endgame.pollenFlower],
        ['Final · GARDEN', draft.endgame.garden],
        ['Final · PARK', yesNo(draft.endgame.park)],
        ['Defesa feita', labelOf(DEFENSE_OPTIONS, draft.defensePlayed)],
        ['Defesa sofrida', labelOf(DEFENSE_OPTIONS, draft.defenseReceived)],
        ['Problemas', labelsOf(ISSUE_OPTIONS, draft.issues)],
        ['Pilotagem', draft.driverRating || '—'],
      ]

  return (
    <div className="stack">
      {errors.length > 0 && (
        <div className="form-error" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <dl className="summary">
        {rows.map(([term, value]) => (
          <div key={term} className="summary__row">
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {draft.notes.trim() && (
        <div className="card">
          <span className="field-label">Observações</span>
          <p>{draft.notes}</p>
        </div>
      )}
    </div>
  )
}
