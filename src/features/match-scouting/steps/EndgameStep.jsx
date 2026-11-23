import Counter from '../../../components/Counter.jsx'
import Toggle from '../../../components/Toggle.jsx'
import { LIMITS } from '../match-schema.js'

export default function EndgameStep({ draft, updateSection }) {
  const endgame = draft.endgame
  const set = (patch) => updateSection('endgame', patch)

  return (
    <div className="stack">
      <p className="step-hint">Último minuto: as FLOWERS liberam. Conte o que ele colocou.</p>
      <Counter
        label="NECTAR na FLOWER"
        value={endgame.nectarFlower}
        max={LIMITS.maxCount}
        onChange={(nectarFlower) => set({ nectarFlower })}
      />
      <Counter
        label="POLLEN na FLOWER"
        value={endgame.pollenFlower}
        max={LIMITS.maxCount}
        onChange={(pollenFlower) => set({ pollenFlower })}
      />
      <Counter
        label="POLLEN e NECTAR no GARDEN"
        value={endgame.garden}
        max={LIMITS.maxCount}
        onChange={(garden) => set({ garden })}
      />
      <Toggle
        label="Terminou estacionado (PARK)?"
        value={endgame.park}
        onChange={(park) => set({ park })}
      />
    </div>
  )
}
