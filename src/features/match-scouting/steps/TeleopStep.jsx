import ChipGroup from '../../../components/ChipGroup.jsx'
import Counter from '../../../components/Counter.jsx'
import { INTAKE_OPTIONS, LIMITS } from '../match-schema.js'

export default function TeleopStep({ draft, updateSection }) {
  const teleop = draft.teleop
  const set = (patch) => updateSection('teleop', patch)

  return (
    <div className="stack">
      <p className="step-hint">2 minutos com piloto. Conte cada lançamento no CELL.</p>
      <div className="counter-pair">
        <Counter
          label="Acertou no CELL"
          tone="good"
          value={teleop.made}
          max={LIMITS.maxCount}
          onChange={(made) => set({ made })}
        />
        <Counter
          label="Errou"
          tone="bad"
          value={teleop.missed}
          max={LIMITS.maxCount}
          onChange={(missed) => set({ missed })}
        />
      </div>
      <ChipGroup
        label="De onde ele pega as peças?"
        value={teleop.intake}
        options={INTAKE_OPTIONS}
        onChange={(intake) => set({ intake })}
      />
    </div>
  )
}
