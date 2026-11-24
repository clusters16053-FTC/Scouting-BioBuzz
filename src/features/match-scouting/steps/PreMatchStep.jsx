import Counter from '../../../components/Counter.jsx'
import Icon from '../../../components/Icon.jsx'
import NumberField from '../../../components/NumberField.jsx'
import Segmented from '../../../components/Segmented.jsx'
import Toggle from '../../../components/Toggle.jsx'
import { teamAtStation } from '../../official/official-data.js'
import { ALLIANCE_OPTIONS, LIMITS, STATION_OPTIONS } from '../match-schema.js'

/**
 * Fase "Pré". Com a tabela oficial da FIRST guardada no aparelho, a equipe é preenchida
 * sozinha a partir de partida + aliança + posição, e o app confere o que foi digitado.
 */
export default function PreMatchStep({ draft, update, official }) {
  const matches = official?.matches ?? []
  const names = new Map((official?.teams ?? []).map((t) => [t.teamNumber, t.name]))
  const expected = teamAtStation(matches, draft.matchNumber, draft.alliance, draft.station)

  /**
   * Muda partida/aliança/posição e, se der, já põe a equipe da tabela.
   * Só sobrescreve se o campo estava vazio ou com a equipe que a própria tabela tinha posto:
   * nunca apaga um número que o scouter digitou de propósito.
   */
  function updatePlace(patch) {
    const next = { ...draft, ...patch }
    const before = teamAtStation(matches, draft.matchNumber, draft.alliance, draft.station)
    const after = teamAtStation(matches, next.matchNumber, next.alliance, next.station)
    const untouched = !draft.teamNumber || draft.teamNumber === before
    update(after && untouched ? { ...patch, teamNumber: after } : patch)
  }

  return (
    <div className="stack">
      <Counter
        label="Partida"
        value={draft.matchNumber}
        min={0}
        max={LIMITS.maxMatchNumber}
        onChange={(matchNumber) => updatePlace({ matchNumber })}
      />
      <Segmented
        label="Aliança"
        value={draft.alliance}
        options={ALLIANCE_OPTIONS}
        onChange={(alliance) => updatePlace({ alliance })}
      />
      <Segmented
        label="Posição"
        value={draft.station}
        options={STATION_OPTIONS}
        onChange={(station) => updatePlace({ station })}
      />
      <div>
        <NumberField
          label="Número da equipe"
          value={draft.teamNumber}
          max={LIMITS.maxTeamNumber}
          placeholder="Ex.: 16053"
          onChange={(teamNumber) => update({ teamNumber })}
        />
        <TeamCheck
          teamNumber={draft.teamNumber}
          expected={expected}
          names={names}
          hasOfficialTeams={names.size > 0}
          onUse={() => update({ teamNumber: expected })}
        />
      </div>
      {/* A pergunta é positiva, mas o dado guardado continua sendo "noShow". */}
      <Toggle
        label="Robô apareceu?"
        value={!draft.noShow}
        onChange={(appeared) => update({ noShow: !appeared })}
      />
    </div>
  )
}

/** Linha abaixo do número: confirma, avisa ou sugere a equipe da tabela oficial. */
function TeamCheck({ teamNumber, expected, names, hasOfficialTeams, onUse }) {
  const label = (n) => `${n}${names.get(n) ? ` ${names.get(n)}` : ''}`

  if (expected && teamNumber === expected) {
    return (
      <p className="team-check team-check--ok">
        <Icon name="check" size={18} />
        {label(expected)}, confere com a tabela oficial
      </p>
    )
  }
  if (expected) {
    return (
      <div className="team-check team-check--warn" role="alert">
        <p>
          {teamNumber
            ? `A tabela oficial diz ${label(expected)} nesta posição.`
            : `Tabela oficial: ${label(expected)}.`}
        </p>
        <button type="button" className="button button--ghost button--small" onClick={onUse}>
          Usar {expected}
        </button>
      </div>
    )
  }
  if (teamNumber && hasOfficialTeams) {
    return names.has(teamNumber) ? (
      <p className="team-check">{label(teamNumber)}</p>
    ) : (
      <p className="team-check team-check--warn" role="alert">
        A equipe {teamNumber} não está inscrita neste evento. Confira o número.
      </p>
    )
  }
  return null
}
