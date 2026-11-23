/**
 * Formato do relatório de partida: opções dos campos, rascunho vazio,
 * validação e conversão para o documento salvo no Firestore.
 *
 * Se mudar algum campo aqui, atualize também:
 *   - firestore.rules (validMatchReport)
 *   - tests/firestore.rules.test.js
 *   - docs/modelo-de-dados.md
 * e aumente MATCH_SCHEMA_VERSION se o significado de um campo mudar.
 */
import { createId } from '../../lib/ids.js'

export const MATCH_SCHEMA_VERSION = 1

export const LIMITS = Object.freeze({
  maxMatchNumber: 999,
  maxTeamNumber: 99999,
  maxCount: 99,
  maxNotes: 500,
})

export const INTAKE_OPTIONS = [
  { value: 'floor', label: 'Chão' },
  { value: 'flower', label: 'FLOWER' },
  { value: 'garden', label: 'GARDEN' },
]

export const DEFENSE_OPTIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'low', label: 'Pouca' },
  { value: 'high', label: 'Muita' },
]

export const ISSUE_OPTIONS = [
  { value: 'stopped', label: 'Parou' },
  { value: 'tipped', label: 'Tombou' },
  { value: 'disconnected', label: 'Desconectou' },
]

export const RATING_OPTIONS = [
  { value: 0, label: '—' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
]

export const ALLIANCE_OPTIONS = [
  { value: 'red', label: 'Vermelha', tone: 'red' },
  { value: 'blue', label: 'Azul', tone: 'blue' },
]

export const STATION_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
]

/** Fases do formulário, na ordem em que aparecem. */
export const STEPS = [
  { id: 'pre', label: 'Pré' },
  { id: 'auto', label: 'AUTO' },
  { id: 'teleop', label: 'TELEOP' },
  { id: 'endgame', label: 'Final' },
  { id: 'general', label: 'Geral' },
  { id: 'review', label: 'Revisar' },
]

/** Fases que não fazem sentido quando o robô não apareceu. */
const NO_SHOW_SKIPPED = new Set(['auto', 'teleop', 'endgame', 'general'])

export function isStepAvailable(stepId, draft) {
  return !(draft.noShow && NO_SHOW_SKIPPED.has(stepId))
}

const emptyAuto = () => ({ leave: false, made: 0, missed: 0, park: false })
const emptyTeleop = () => ({ made: 0, missed: 0, intake: [] })
const emptyEndgame = () => ({ nectarFlower: 0, pollenFlower: 0, garden: 0, park: false })

/**
 * Rascunho novo. Aliança e posição podem vir da partida anterior,
 * porque o scouter normalmente acompanha a mesma estação o evento todo.
 */
export function createEmptyMatchDraft({ matchNumber = 0, alliance = null, station = null } = {}) {
  return {
    id: createId(),
    step: 'pre',
    matchNumber,
    alliance,
    station,
    teamNumber: 0,
    noShow: false,
    auto: emptyAuto(),
    teleop: emptyTeleop(),
    endgame: emptyEndgame(),
    defensePlayed: 'none',
    defenseReceived: 'none',
    issues: [],
    driverRating: 0,
    notes: '',
  }
}

/** Erros da fase "Pré". Retorna lista vazia quando está tudo certo. */
export function validatePreMatch(draft) {
  const errors = []
  if (!draft.matchNumber) errors.push('Informe o número da partida.')
  if (!draft.alliance) errors.push('Escolha a aliança.')
  if (!draft.station) errors.push('Escolha a posição (1 ou 2).')
  if (!draft.teamNumber) errors.push('Informe o número da equipe.')
  return errors
}

/** Converte o rascunho no documento do Firestore (formato de docs/modelo-de-dados.md). */
export function toMatchDocument(draft, { uid, scouter, syncedAt }) {
  const noShow = draft.noShow
  return {
    schemaVersion: MATCH_SCHEMA_VERSION,
    matchNumber: draft.matchNumber,
    alliance: draft.alliance,
    station: draft.station,
    teamNumber: draft.teamNumber,
    scouter,
    noShow,
    // Robô ausente: zera as fases para não sujar as médias com dados esquecidos.
    auto: noShow ? emptyAuto() : draft.auto,
    teleop: noShow ? emptyTeleop() : draft.teleop,
    endgame: noShow ? emptyEndgame() : draft.endgame,
    defensePlayed: noShow ? 'none' : draft.defensePlayed,
    defenseReceived: noShow ? 'none' : draft.defenseReceived,
    issues: noShow ? [] : draft.issues,
    driverRating: noShow ? 0 : draft.driverRating,
    notes: draft.notes.trim(),
    createdAt: new Date(),
    createdBy: uid,
    syncedAt,
  }
}
