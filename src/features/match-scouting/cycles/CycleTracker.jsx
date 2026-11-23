import Segmented from '../../../components/Segmented.jsx'
import { useNow, vibrate } from '../../../lib/use-now.js'
import {
  cancelFired,
  closeCycle,
  currentCycleSeconds,
  formatPercent,
  formatSeconds,
  markFired,
  setCollected,
  startPhase,
  summarizeCycles,
  undoLastCycle,
} from './cycle-math.js'

const COLLECTED_OPTIONS = [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))

/**
 * Registro de ciclos de uma fase (AUTO ou TELEOP).
 *
 * Fluxo do scouter:
 *   "Começou" → [ATIROU → coletou/acertou] → [ATIROU → …] …
 *
 * timer/onChange: estado da fase (ver cycle-math.js), salvo no rascunho.
 */
export default function CycleTracker({ phaseLabel, timer, onChange, isPreloadPhase = false }) {
  const running = timer.startedAt !== null && !timer.pending
  const now = useNow(running)
  const summary = summarizeCycles(timer.cycles)
  const nextNumber = timer.cycles.length + 1

  if (timer.startedAt === null) {
    return (
      <div className="cycle-tracker">
        <button
          type="button"
          className="cycle-start"
          onClick={() => {
            vibrate()
            onChange(startPhase(timer, Date.now()))
          }}
        >
          ▶ Começou o {phaseLabel}
        </button>
        <p className="step-hint">
          Toque assim que o {phaseLabel} começar. O cronômetro mede quanto tempo o robô leva para
          ficar pronto para atirar.
        </p>
      </div>
    )
  }

  return (
    <div className="cycle-tracker">
      {timer.pending ? (
        <PendingCycle
          number={nextNumber}
          seconds={currentCycleSeconds(timer, now)}
          collected={timer.pending.collected}
          isPreload={isPreloadPhase && timer.cycles.length === 0}
          onCollected={(value) => onChange(setCollected(timer, value))}
          onHits={(hits) => {
            vibrate()
            onChange(closeCycle(timer, hits, Date.now(), { isPreloadPhase }))
          }}
          onCancel={() => onChange(cancelFired(timer))}
        />
      ) : (
        <>
          <div className="cycle-clock" aria-live="off">
            <span className="muted">Ciclo {nextNumber}</span>
            <strong>{formatClock(currentCycleSeconds(timer, now))}</strong>
          </div>
          <button
            type="button"
            className="cycle-fire"
            onClick={() => {
              vibrate()
              onChange(markFired(timer, Date.now()))
            }}
          >
            🎯 ATIROU
          </button>
        </>
      )}

      <CycleSummary summary={summary} />

      {timer.cycles.length > 0 && (
        <>
          <ol className="cycle-list" reversed>
            {[...timer.cycles].reverse().map((cycle, index) => (
              <CycleRow key={cycle.firedMs} cycle={cycle} number={timer.cycles.length - index} />
            ))}
          </ol>
          {!timer.pending && (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => onChange(undoLastCycle(timer))}
            >
              ↶ Desfazer ciclo {timer.cycles.length}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function PendingCycle({ number, seconds, collected, isPreload, onCollected, onHits, onCancel }) {
  return (
    <div className="cycle-pending card stack">
      <div className="cycle-pending__title">
        <strong>Ciclo {number}</strong>
        <span className="muted">
          {isPreload ? 'preload · ' : ''}
          {formatSeconds(seconds)}
        </span>
      </div>

      <Segmented
        label="Quantos POLLEN coletou?"
        value={collected}
        options={COLLECTED_OPTIONS}
        onChange={onCollected}
      />

      <fieldset>
        <legend className="field-label">Quantos acertou?</legend>
        <div className="hit-buttons" style={{ '--hit-count': collected + 1 }}>
          {Array.from({ length: collected + 1 }, (_, hits) => (
            <button key={hits} type="button" className="hit-button" onClick={() => onHits(hits)}>
              {hits}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="button" className="button button--ghost" onClick={onCancel}>
        Cancelar (não atirou)
      </button>
    </div>
  )
}

function CycleSummary({ summary }) {
  return (
    <dl className="cycle-summary">
      <div>
        <dt>Ciclos</dt>
        <dd>{summary.totalCycles}</dd>
      </div>
      <div>
        <dt>Acerto</dt>
        <dd>{formatPercent(summary.accuracy)}</dd>
      </div>
      <div>
        <dt>Tempo médio</dt>
        <dd>{formatSeconds(summary.avgCycleSeconds)}</dd>
      </div>
    </dl>
  )
}

function CycleRow({ cycle, number }) {
  return (
    <li className="cycle-row">
      <span className="cycle-row__number">#{number}</span>
      <span>{cycle.preload ? 'preload' : formatSeconds(cycle.seconds)}</span>
      <span className="cycle-row__dots" aria-hidden="true">
        {'●'.repeat(cycle.hits)}
        {'○'.repeat(cycle.collected - cycle.hits)}
      </span>
      <span className="cycle-row__score">
        {cycle.hits}/{cycle.collected}
      </span>
    </li>
  )
}

/** 75.4 → "01:15" */
function formatClock(totalSeconds) {
  const whole = Math.floor(totalSeconds)
  const minutes = String(Math.floor(whole / 60)).padStart(2, '0')
  const seconds = String(whole % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
