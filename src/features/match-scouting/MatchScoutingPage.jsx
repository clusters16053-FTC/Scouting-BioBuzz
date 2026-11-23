import { useEffect, useState } from 'react'
import ConfirmButton from '../../components/ConfirmButton.jsx'
import RequireEvent from '../event/RequireEvent.jsx'
import { useSession } from '../access/session-context.js'
import { STEPS, createEmptyMatchDraft, isStepAvailable, validatePreMatch } from './match-schema.js'
import { lastMatchStore, matchDraftStore } from './match-store.js'
import { saveMatchReport } from './match-service.js'
import PreMatchStep from './steps/PreMatchStep.jsx'
import AutoStep from './steps/AutoStep.jsx'
import TeleopStep from './steps/TeleopStep.jsx'
import EndgameStep from './steps/EndgameStep.jsx'
import GeneralStep from './steps/GeneralStep.jsx'
import ReviewStep from './steps/ReviewStep.jsx'
import MatchSaved from './MatchSaved.jsx'

const STEP_COMPONENTS = {
  pre: PreMatchStep,
  auto: AutoStep,
  teleop: TeleopStep,
  endgame: EndgameStep,
  general: GeneralStep,
  review: ReviewStep,
}

export default function MatchScoutingPage() {
  return <RequireEvent>{(eventId) => <MatchScouting eventId={eventId} />}</RequireEvent>
}

function MatchScouting({ eventId }) {
  const draft = matchDraftStore.useValue()
  const last = lastMatchStore.useValue()

  // Primeira visita: sem rascunho e sem relatório anterior → começa um rascunho novo.
  useEffect(() => {
    if (!draft && !last) matchDraftStore.set(createEmptyMatchDraft())
  }, [draft, last])

  if (!draft) {
    if (!last) return null
    return (
      <MatchSaved
        last={last}
        onNext={() => {
          matchDraftStore.set(
            createEmptyMatchDraft({
              matchNumber: last.matchNumber + 1,
              alliance: last.alliance,
              station: last.station,
            }),
          )
        }}
      />
    )
  }

  return <MatchForm eventId={eventId} draft={draft} />
}

function MatchForm({ eventId, draft }) {
  const { user, member } = useSession()
  const [showErrors, setShowErrors] = useState(false)
  // Os erros só dizem respeito à fase "Pré" e somem assim que o campo é corrigido.
  const errors = showErrors ? validatePreMatch(draft) : []

  const steps = STEPS.filter((step) => isStepAvailable(step.id, draft))
  const stepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === draft.step),
  )
  const step = steps[stepIndex]
  const StepComponent = STEP_COMPONENTS[step.id]
  const isLast = stepIndex === steps.length - 1

  const update = (patch) => matchDraftStore.set((current) => ({ ...current, ...patch }))
  const updateSection = (section, patch) =>
    matchDraftStore.set((current) => ({
      ...current,
      [section]: { ...current[section], ...patch },
    }))

  // Volta ao topo a cada troca de fase.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step.id])

  function goTo(stepId) {
    // Só sai da fase "Pré" para frente se ela estiver completa.
    if (draft.step === 'pre' && stepId !== 'pre' && validatePreMatch(draft).length) {
      setShowErrors(true)
      return
    }
    update({ step: stepId })
  }

  function handleSave() {
    if (validatePreMatch(draft).length) {
      setShowErrors(true)
      update({ step: 'pre' })
      return
    }
    saveMatchReport(eventId, draft, { uid: user.uid, scouter: member.name })
    lastMatchStore.set({
      id: draft.id,
      eventId,
      matchNumber: draft.matchNumber,
      teamNumber: draft.teamNumber,
      alliance: draft.alliance,
      station: draft.station,
      savedAt: new Date().toISOString(),
    })
    matchDraftStore.set(null)
    setShowErrors(false)
  }

  function handleDiscard() {
    matchDraftStore.set(createEmptyMatchDraft({ alliance: draft.alliance, station: draft.station }))
    setShowErrors(false)
  }

  return (
    <section className="match-form">
      <header className="match-form__header">
        <div className="match-form__context">
          <span className="muted">{eventId}</span>
          {draft.matchNumber > 0 && <span className="pill">Partida {draft.matchNumber}</span>}
          {draft.teamNumber > 0 && (
            <span className={`pill pill--${draft.alliance ?? 'neutral'}`}>
              {draft.teamNumber}
              {draft.station ? ` · ${draft.station}` : ''}
            </span>
          )}
        </div>

        <nav className="step-tabs" aria-label="Fases da partida">
          {steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`step-tabs__tab ${item.id === step.id ? 'is-active' : ''} ${
                index < stepIndex ? 'is-done' : ''
              }`}
              aria-current={item.id === step.id ? 'step' : undefined}
              onClick={() => goTo(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {step.id !== 'review' && errors.length > 0 && (
        <div className="form-error" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <StepComponent draft={draft} update={update} updateSection={updateSection} errors={errors} />

      <div className="action-bar">
        {stepIndex > 0 ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => goTo(steps[stepIndex - 1].id)}
          >
            ← Voltar
          </button>
        ) : (
          <ConfirmButton onConfirm={handleDiscard}>Limpar</ConfirmButton>
        )}

        {isLast ? (
          <button type="button" className="button button--save" onClick={handleSave}>
            Salvar relatório
          </button>
        ) : (
          <button type="button" className="button" onClick={() => goTo(steps[stepIndex + 1].id)}>
            Próximo →
          </button>
        )}
      </div>
    </section>
  )
}
