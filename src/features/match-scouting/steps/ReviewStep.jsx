import { DEFENSE_OPTIONS, INTAKE_OPTIONS, ISSUE_OPTIONS } from '../match-schema.js'
import { formatPercent, formatSeconds, summarizeCycles } from '../cycles/cycle-math.js'

const yesNo = (value) => (value ? 'Sim' : 'Não')
const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? value
const labelsOf = (options, values) =>
  values.length ? values.map((v) => labelOf(options, v)).join(', ') : 'Nenhum'

/** Resumo do relatório antes de salvar, agrupado por fase. */
export default function ReviewStep({ draft, errors }) {
  return (
    <div className="review">
      {errors.length > 0 && (
        <div className="form-error" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      {draft.noShow ? (
        <ReviewGroup title="Robô" rows={[['Situação', 'Não apareceu']]} />
      ) : (
        <>
          <ReviewGroup
            title="AUTO"
            cycles={draft.auto.timer.cycles}
            rows={[
              ['LEAVE', yesNo(draft.auto.leave)],
              ['PARK', yesNo(draft.auto.park)],
            ]}
          />
          <ReviewGroup
            title="TELEOP"
            cycles={draft.teleop.timer.cycles}
            rows={[['Pega POLLEN de', labelsOf(INTAKE_OPTIONS, draft.teleop.intake)]]}
          />
          <ReviewGroup
            title="Final"
            rows={[
              ['NECTAR na FLOWER', draft.endgame.nectarFlower],
              ['POLLEN na FLOWER', draft.endgame.pollenFlower],
              ['GARDEN', draft.endgame.garden],
              ['PARK', yesNo(draft.endgame.park)],
            ]}
          />
          <ReviewGroup
            title="Geral"
            rows={[
              ['Defesa feita', labelOf(DEFENSE_OPTIONS, draft.defensePlayed)],
              ['Defesa sofrida', labelOf(DEFENSE_OPTIONS, draft.defenseReceived)],
              ['Problemas', labelsOf(ISSUE_OPTIONS, draft.issues)],
              ['Pilotagem', draft.driverRating ? `${draft.driverRating} de 5` : 'Sem nota'],
            ]}
          />
        </>
      )}

      {draft.notes.trim() && (
        <section className="review-group">
          <h2>Observações</h2>
          <p className="review-notes">{draft.notes}</p>
        </section>
      )}
    </div>
  )
}

function ReviewGroup({ title, cycles, rows }) {
  return (
    <section className="review-group">
      <h2>{title}</h2>
      {cycles && <CycleStats cycles={cycles} />}
      <dl className="summary">
        {rows.map(([term, value]) => (
          <div key={term} className="summary__row">
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function CycleStats({ cycles }) {
  const s = summarizeCycles(cycles)
  return (
    <dl className="stat-cells">
      <div>
        <dt>Ciclos</dt>
        <dd>{s.totalCycles}</dd>
      </div>
      <div>
        <dt>Acertos</dt>
        <dd>
          {s.totalHits}
          <small>/{s.totalShots}</small>
        </dd>
      </div>
      <div>
        <dt>Precisão</dt>
        <dd>{formatPercent(s.accuracy)}</dd>
      </div>
      <div>
        <dt>Média</dt>
        <dd>{formatSeconds(s.avgCycleSeconds)}</dd>
      </div>
    </dl>
  )
}
