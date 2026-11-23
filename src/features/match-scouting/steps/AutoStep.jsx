import Toggle from '../../../components/Toggle.jsx'
import CycleTracker from '../cycles/CycleTracker.jsx'

export default function AutoStep({ draft, updateSection }) {
  const auto = draft.auto
  const set = (patch) => updateSection('auto', patch)

  return (
    <div className="stack">
      <CycleTracker
        phaseLabel="AUTO"
        timer={auto.timer}
        isPreloadPhase
        onChange={(timer) => set({ timer })}
      />
      <Toggle
        label="Saiu da área inicial (LEAVE)?"
        value={auto.leave}
        onChange={(leave) => set({ leave })}
      />
      <Toggle
        label="Terminou estacionado (PARK)?"
        value={auto.park}
        onChange={(park) => set({ park })}
      />
    </div>
  )
}
