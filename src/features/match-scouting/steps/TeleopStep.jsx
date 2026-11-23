import ChipGroup from '../../../components/ChipGroup.jsx'
import CycleTracker from '../cycles/CycleTracker.jsx'
import { INTAKE_OPTIONS } from '../match-schema.js'

export default function TeleopStep({ draft, updateSection }) {
  const teleop = draft.teleop
  const set = (patch) => updateSection('teleop', patch)

  return (
    <div className="stack">
      <CycleTracker phaseLabel="TELEOP" timer={teleop.timer} onChange={(timer) => set({ timer })} />
      <ChipGroup
        label="De onde ele pega as peças?"
        value={teleop.intake}
        options={INTAKE_OPTIONS}
        onChange={(intake) => set({ intake })}
      />
    </div>
  )
}
