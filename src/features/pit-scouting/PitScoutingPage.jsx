import { useEffect, useState } from 'react'
import ConfirmButton from '../../components/ConfirmButton.jsx'
import Icon from '../../components/Icon.jsx'
import NumberField from '../../components/NumberField.jsx'
import Segmented from '../../components/Segmented.jsx'
import TextArea from '../../components/TextArea.jsx'
import Toggle from '../../components/Toggle.jsx'
import { useSession } from '../access/session-context.js'
import RequireEvent from '../event/RequireEvent.jsx'
import FlowerScoringField from './FlowerScoringField.jsx'
import PhotoField from './PhotoField.jsx'
import {
  DRIVETRAIN_OPTIONS,
  PIT_DRAFT_VERSION,
  PIT_LIMITS,
  SHOOTER_SHAPE_OPTIONS,
  createEmptyPitDraft,
  validatePit,
} from './pit-schema.js'
import { savePitReport } from './pit-service.js'
import { lastPitStore, pitDraftStore } from './pit-store.js'

export default function PitScoutingPage() {
  return <RequireEvent>{(eventId) => <PitScouting eventId={eventId} />}</RequireEvent>
}

function PitScouting({ eventId }) {
  const draft = pitDraftStore.useValue()
  const last = lastPitStore.useValue()

  // Rascunho de uma versão antiga do formulário: descarta.
  const outdated = draft && draft.draftVersion !== PIT_DRAFT_VERSION

  useEffect(() => {
    if (outdated || (!draft && !last)) pitDraftStore.set(createEmptyPitDraft())
  }, [draft, last, outdated])

  if (outdated) return null

  if (!draft) {
    if (!last) return null
    return (
      <section className="saved">
        <span className="saved__icon">
          <Icon name="check" size={32} />
        </span>
        <h1>Entrevista salva</h1>
        <p className="muted">
          Equipe {last.teamNumber}. Ficou guardada no aparelho e sobe sozinha quando tiver internet.
        </p>
        <button
          type="button"
          className="button button--save"
          onClick={() => pitDraftStore.set(createEmptyPitDraft())}
        >
          Nova entrevista
        </button>
      </section>
    )
  }

  return <PitForm eventId={eventId} draft={draft} />
}

function PitForm({ eventId, draft }) {
  const { user, member } = useSession()
  const [showErrors, setShowErrors] = useState(false)
  // Revalida a cada mudança: o erro some assim que o campo é corrigido.
  const errors = showErrors ? validatePit(draft) : []

  const update = (patch) => pitDraftStore.set((current) => ({ ...current, ...patch }))

  function handleSave() {
    const found = validatePit(draft)
    setShowErrors(true)
    if (found.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    savePitReport(eventId, draft, { uid: user.uid, scouter: member.name })
    lastPitStore.set({ id: draft.id, teamNumber: draft.teamNumber, eventId })
    pitDraftStore.set(null)
    setShowErrors(false)
  }

  return (
    <section className="stack">
      <h1>Pit scouting</h1>

      {errors.length > 0 && (
        <div className="form-error" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <fieldset className="form-section">
        <legend className="section-title">Equipe</legend>
        <NumberField
          label="Número da equipe"
          value={draft.teamNumber}
          max={PIT_LIMITS.maxTeamNumber}
          placeholder="Ex.: 16053"
          onChange={(teamNumber) => update({ teamNumber })}
        />
        <label className="field">
          <span className="field-label">Nome da equipe</span>
          <input
            value={draft.teamName}
            maxLength={PIT_LIMITS.maxTeamName}
            onChange={(e) => update({ teamName: e.target.value })}
            placeholder="Ex.: Clusters"
          />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Robô</legend>
        <Segmented
          label="Tração"
          columns={2}
          value={draft.drivetrain}
          options={DRIVETRAIN_OPTIONS}
          onChange={(drivetrain) => update({ drivetrain })}
        />
        <Segmented
          label="Formato do shooter"
          value={draft.shooterShape}
          options={SHOOTER_SHAPE_OPTIONS}
          onChange={(shooterShape) => update({ shooterShape })}
        />
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">FLOWER</legend>
        <FlowerScoringField
          value={draft.flowerPlaces}
          onChange={(flowerPlaces) => update({ flowerPlaces })}
        />
        <Toggle
          label="Tira da FLOWER?"
          value={draft.removesFromFlower}
          onChange={(removesFromFlower) => update({ removesFromFlower })}
        />
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">AUTO</legend>
        <TextArea
          label="O que faz no autônomo"
          value={draft.autoNotes}
          maxLength={PIT_LIMITS.maxAutoNotes}
          placeholder="Ex.: sai da área, lança o preload e faz 2 ciclos pelo lado da HIVE"
          onChange={(autoNotes) => update({ autoNotes })}
        />
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Estratégia e foto</legend>
        <TextArea
          label="Estratégia / observações"
          value={draft.strategy}
          maxLength={PIT_LIMITS.maxStrategy}
          placeholder="Ex.: prefere jogar defesa, foca em TIPS"
          onChange={(strategy) => update({ strategy })}
        />
        <PhotoField value={draft.photo} onChange={(photo) => update({ photo })} />
      </fieldset>

      <div className="action-bar">
        <ConfirmButton
          onConfirm={() => {
            pitDraftStore.set(createEmptyPitDraft())
            setShowErrors(false)
          }}
        >
          Limpar
        </ConfirmButton>
        <button type="button" className="button button--save" onClick={handleSave}>
          Salvar entrevista
        </button>
      </div>
    </section>
  )
}
