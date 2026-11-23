import Counter from '../../../components/Counter.jsx'
import Toggle from '../../../components/Toggle.jsx'
import { LIMITS } from '../match-schema.js'

export default function AutoStep({ draft, updateSection }) {
  const auto = draft.auto
  const set = (patch) => updateSection('auto', patch)

  return (
    <div className="stack">
      <p className="step-hint">30 segundos sem piloto. Conte cada lançamento no CELL.</p>
      <Toggle
        label="Saiu da área inicial (LEAVE)?"
        value={auto.leave}
        onChange={(leave) => set({ leave })}
      />
      <div className="counter-pair">
        <Counter
          label="Acertou no CELL"
          tone="good"
          value={auto.made}
          max={LIMITS.maxCount}
          onChange={(made) => set({ made })}
        />
        <Counter
          label="Errou"
          tone="bad"
          value={auto.missed}
          max={LIMITS.maxCount}
          onChange={(missed) => set({ missed })}
        />
      </div>
      <Toggle
        label="Terminou estacionado (PARK)?"
        value={auto.park}
        onChange={(park) => set({ park })}
      />
    </div>
  )
}
