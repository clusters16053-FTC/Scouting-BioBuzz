/**
 * Regras do BIOBUZZ (FTC 2026-2027) que o sistema usa para calcular métricas.
 *
 * Fonte: Competition Manual, versão Team Update 09 — seção 10.5 (Tabelas 10-2 e 10-3).
 * Se um Team Update mudar algum valor, altere SOMENTE este arquivo:
 * o resto do código lê daqui, nunca usa o número direto.
 */

export const SEASON = Object.freeze({ name: 'BIOBUZZ', year: '2026-2027' })

export const MATCH_TIMING = Object.freeze({
  autoSeconds: 30,
  transitionSeconds: 8,
  teleopSeconds: 120,
  /** FLOWERS só pontuam quando falta 1 minuto (seção 10.5.2). */
  flowerUnlockRemainingSeconds: 60,
})

export const POINTS = Object.freeze({
  auto: Object.freeze({ leave: 3, park: 5, hiveTip: 20 }),
  teleop: Object.freeze({
    park: 5,
    hiveTip: 20,
    /** Por peça que sobra no CELL virado pra cima no fim da partida. */
    cellRemaining: 2,
    bottomNectarBonus: 5,
    /** Por peça dentro de uma FLOWER que a aliança possui. */
    ownedFlowerPiece: 2,
    gardenPiece: 1,
  }),
  fouls: Object.freeze({ minor: 5, major: 20 }),
})

/** Limiares de RP para eventos comuns (Championship ainda TBA). */
export const RANKING = Object.freeze({
  win: 3,
  tie: 1,
  swarmThreshold: 16,
  pollinator1Tips: 4,
  pollinator2Tips: 7,
})

export const ROBOT_LIMITS = Object.freeze({
  maxControlledElements: 4,
  preloadPollen: 4,
})
