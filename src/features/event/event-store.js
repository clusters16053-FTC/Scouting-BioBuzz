import { createLocalStore } from '../../lib/local-store.js'

/**
 * Código do evento atual (ex.: "BRCEFOR"), salvo no aparelho.
 * Todo relatório vai para events/{código}/...
 */
export const currentEventStore = createLocalStore('scouting:event', '')

/** Letras e números, maiúsculo, até 20 caracteres. */
export function normalizeEventCode(raw) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20)
}

export const MIN_EVENT_CODE_LENGTH = 3
