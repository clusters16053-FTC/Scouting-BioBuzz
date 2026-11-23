import Counter from '../../../components/Counter.jsx'
import NumberField from '../../../components/NumberField.jsx'
import Segmented from '../../../components/Segmented.jsx'
import Toggle from '../../../components/Toggle.jsx'
import { ALLIANCE_OPTIONS, LIMITS, STATION_OPTIONS } from '../match-schema.js'

export default function PreMatchStep({ draft, update }) {
  return (
    <div className="stack">
      <Counter
        label="Partida"
        value={draft.matchNumber}
        min={0}
        max={LIMITS.maxMatchNumber}
        onChange={(matchNumber) => update({ matchNumber })}
      />
      <Segmented
        label="Aliança"
        value={draft.alliance}
        options={ALLIANCE_OPTIONS}
        onChange={(alliance) => update({ alliance })}
      />
      <Segmented
        label="Posição"
        value={draft.station}
        options={STATION_OPTIONS}
        onChange={(station) => update({ station })}
      />
      <NumberField
        label="Número da equipe"
        value={draft.teamNumber}
        max={LIMITS.maxTeamNumber}
        placeholder="Ex.: 16053"
        onChange={(teamNumber) => update({ teamNumber })}
      />
      <Toggle
        label="Robô não apareceu?"
        value={draft.noShow}
        onChange={(noShow) => update({ noShow })}
      />
    </div>
  )
}
