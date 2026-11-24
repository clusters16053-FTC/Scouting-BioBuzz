/**
 * Formato do relatório de pit.
 *
 * Se mudar algum campo aqui, atualize também:
 *   - firestore.rules (validPitReport)
 *   - tests/rules/firestore.rules.test.js
 *   - docs/modelo-de-dados.md
 */
import { createId } from '../../lib/ids.js'

/**
 * Versão do formato salvo no banco.
 * v1: lança no CELL, alcance, coleta, ações do AUTO em caixinhas
 * v2: formato do shooter, o que coloca/tira da FLOWER, AUTO em texto livre
 */
export const PIT_SCHEMA_VERSION = 2

/** Versão do rascunho local. Rascunhos antigos são descartados ao abrir o formulário. */
export const PIT_DRAFT_VERSION = 2

export const PIT_LIMITS = Object.freeze({
  maxTeamNumber: 99999,
  maxTeamName: 60,
  maxAutoNotes: 500,
  maxStrategy: 500,
})

export const DRIVETRAIN_OPTIONS = [
  { value: 'mecanum', label: 'Mecanum' },
  { value: 'tank', label: 'Tank' },
  { value: 'swerve', label: 'Swerve' },
  { value: 'other', label: 'Outra' },
]

export const SHOOTER_SHAPE_OPTIONS = [
  { value: 'c', label: 'C' },
  { value: 's', label: 'S' },
  { value: 'turret', label: 'Turret' },
  { value: 'other', label: 'Outro' },
  { value: 'none', label: 'Sem shooter' },
]

export const FLOWER_PIECE_OPTIONS = [
  { value: 'nectar', label: 'NECTAR' },
  { value: 'pollen', label: 'POLLEN' },
]

export function createEmptyPitDraft() {
  return {
    id: createId(),
    draftVersion: PIT_DRAFT_VERSION,
    teamNumber: 0,
    teamName: '',
    drivetrain: null,
    shooterShape: null,
    flowerPlaces: [],
    removesFromFlower: false,
    autoNotes: '',
    strategy: '',
    photo: null,
  }
}

export function validatePit(draft) {
  const errors = []
  if (!draft.teamNumber) errors.push('Informe o número da equipe.')
  if (!draft.drivetrain) errors.push('Escolha o tipo de tração.')
  if (!draft.shooterShape) errors.push('Escolha o formato do shooter.')
  return errors
}

export function toPitDocument(draft, { uid, scouter, syncedAt }) {
  return {
    schemaVersion: PIT_SCHEMA_VERSION,
    teamNumber: draft.teamNumber,
    teamName: draft.teamName.trim(),
    drivetrain: draft.drivetrain,
    shooterShape: draft.shooterShape,
    flowerPlaces: draft.flowerPlaces,
    removesFromFlower: draft.removesFromFlower,
    autoNotes: draft.autoNotes.trim(),
    strategy: draft.strategy.trim(),
    hasPhoto: Boolean(draft.photo),
    scouter,
    createdAt: new Date(),
    createdBy: uid,
    syncedAt,
  }
}
