import { createLocalStore } from '../../lib/local-store.js'

/**
 * Rascunho da partida em andamento, salvo no aparelho a cada toque.
 * Se a página recarregar ou o celular travar, o scouter continua de onde parou.
 */
export const matchDraftStore = createLocalStore('scouting:match-draft', null)

/** Resumo do último relatório salvo, para a tela de sucesso. */
export const lastMatchStore = createLocalStore('scouting:match-last', null)
