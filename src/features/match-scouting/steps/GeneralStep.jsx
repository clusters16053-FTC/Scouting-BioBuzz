import ChipGroup from '../../../components/ChipGroup.jsx'
import Segmented from '../../../components/Segmented.jsx'
import TextArea from '../../../components/TextArea.jsx'
import { DEFENSE_OPTIONS, ISSUE_OPTIONS, LIMITS, RATING_OPTIONS } from '../match-schema.js'

export default function GeneralStep({ draft, update }) {
  return (
    <div className="stack">
      <Segmented
        label="Defesa que ELE fez"
        value={draft.defensePlayed}
        options={DEFENSE_OPTIONS}
        onChange={(defensePlayed) => update({ defensePlayed })}
      />
      <Segmented
        label="Defesa que ele SOFREU"
        value={draft.defenseReceived}
        options={DEFENSE_OPTIONS}
        onChange={(defenseReceived) => update({ defenseReceived })}
      />
      <ChipGroup
        label="Teve algum problema?"
        value={draft.issues}
        options={ISSUE_OPTIONS}
        onChange={(issues) => update({ issues })}
      />
      <Segmented
        label="Nota da pilotagem"
        value={draft.driverRating}
        options={RATING_OPTIONS}
        onChange={(driverRating) => update({ driverRating })}
      />
      <TextArea
        label="Observações"
        value={draft.notes}
        maxLength={LIMITS.maxNotes}
        placeholder="Ex.: ciclo rápido, erra de longe, travou no fim"
        onChange={(notes) => update({ notes })}
      />
    </div>
  )
}
