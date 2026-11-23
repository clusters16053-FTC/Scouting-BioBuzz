import { createLocalStore } from '../../lib/local-store.js'

/** Rascunho da entrevista em andamento (inclui a foto já comprimida). */
export const pitDraftStore = createLocalStore('scouting:pit-draft', null)

/** Resumo da última entrevista salva, para a tela de sucesso. */
export const lastPitStore = createLocalStore('scouting:pit-last', null)
