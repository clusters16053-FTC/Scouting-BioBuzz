/**
 * Formato do relatório de pit.
 *
 * Se mudar algum campo aqui, atualize também:
 *   - firestore.rules (validPitReport)
 *   - tests/rules/firestore.rules.test.js
 *   - docs/modelo-de-dados.md
 */
import { createId } from '../../lib/ids.js'

export const PIT_SCHEMA_VERSION = 1

export const PIT_LIMITS = Object.freeze({
  maxTeamNumber: 99999,
  maxTeamName: 60,
  maxStartSide: 40,
  maxStrategy: 500,
  maxCycles: 20,
})

export const DRIVETRAIN_OPTIONS = [
  { value: 'mecanum', label: 'Mecanum' },
  { value: 'tank', label: 'Tank' },
  { value: 'swerve', label: 'Swerve' },
  { value: 'other', label: 'Outra' },
]

export const LAUNCH_RANGE_OPTIONS = [
  { value: 'close', label: 'Perto' },
  { value: 'far', label: 'Longe' },
  { value: 'both', label: 'Os dois' },
]

export const PIT_INTAKE_OPTIONS = [
  { value: 'floor', label: 'Chão' },
  { value: 'flower', label: 'FLOWER' },
  { value: 'garden', label: 'GARDEN' },
]

export const AUTO_ACTION_OPTIONS = [
  { value: 'leave', label: 'LEAVE' },
  { value: 'preload', label: 'Lança o preload' },
  { value: 'cycles', label: 'Faz ciclos' },
  { value: 'park', label: 'PARK' },
]

export function createEmptyPitDraft() {
  return {
    id: createId(),
    teamNumber: 0,
    teamName: '',
    drivetrain: null,
    launchesCell: false,
    launchRange: 'close',
    placesNectar: false,
    intake: [],
    auto: { actions: [], cycles: 0, startSide: '' },
    strategy: '',
    photo: null,
  }
}

export function validatePit(draft) {
  const errors = []
  if (!draft.teamNumber) errors.push('Informe o número da equipe.')
  if (!draft.drivetrain) errors.push('Escolha o tipo de tração.')
  return errors
}

export function toPitDocument(draft, { uid, scouter, syncedAt }) {
  return {
    schemaVersion: PIT_SCHEMA_VERSION,
    teamNumber: draft.teamNumber,
    teamName: draft.teamName.trim(),
    drivetrain: draft.drivetrain,
    launchesCell: draft.launchesCell,
    // Quem não lança no CELL não tem alcance.
    launchRange: draft.launchesCell ? draft.launchRange : 'none',
    placesNectar: draft.placesNectar,
    intake: draft.intake,
    auto: {
      actions: draft.auto.actions,
      cycles: draft.auto.actions.includes('cycles') ? draft.auto.cycles : 0,
      startSide: draft.auto.startSide.trim(),
    },
    strategy: draft.strategy.trim(),
    hasPhoto: Boolean(draft.photo),
    scouter,
    createdAt: new Date(),
    createdBy: uid,
    syncedAt,
  }
}
