/**
 * Testes da lógica de ciclos. Não precisam de emulador nem de navegador:
 *   npm run test:unit
 */
import { describe, expect, it } from 'vitest'
import {
  MAX_CYCLES,
  cancelFired,
  closeCycle,
  createPhaseTimer,
  currentCycleSeconds,
  formatPercent,
  formatSeconds,
  markFired,
  setCollected,
  startPhase,
  summarizeCycles,
  toStoredCycle,
  undoLastCycle,
} from '../../src/features/match-scouting/cycles/cycle-math.js'

// Simula o relógio: os testes passam o "agora" em milissegundos.
const s = (seconds) => seconds * 1000

/** Atalho: fecha um ciclo completo (ATIROU em `firedAt`, acertos em `closedAt`). */
function cycle(timer, { firedAt, closedAt, hits, collected = 4, preload = false }) {
  let t = markFired(timer, s(firedAt))
  t = setCollected(t, collected)
  return closeCycle(t, hits, s(closedAt), { isPreloadPhase: preload })
}

describe('cronômetro da fase', () => {
  it('só marca ATIROU depois do "Começou"', () => {
    const timer = createPhaseTimer()
    expect(markFired(timer, s(5)).pending).toBeNull()
  })

  it('mede do "Começou" até o ATIROU no primeiro ciclo', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 8, closedAt: 10, hits: 3 })
    expect(t.cycles[0]).toMatchObject({ at: 8, seconds: 8, collected: 4, hits: 3 })
  })

  it('o próximo ciclo conta a partir de quando os acertos foram informados', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 8, closedAt: 10, hits: 3 })
    t = cycle(t, { firedAt: 22, closedAt: 24, hits: 4 })
    expect(t.cycles[1]).toMatchObject({ at: 22, seconds: 12 })
  })

  it('"Começou" duas vezes não reinicia o relógio', () => {
    const t = startPhase(startPhase(createPhaseTimer(), s(0)), s(50))
    expect(t.startedAt).toBe(0)
  })

  it('cronômetro congela enquanto espera os acertos', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = markFired(t, s(9))
    expect(currentCycleSeconds(t, s(20))).toBe(9)
  })

  it('cancelar o ATIROU não perde o tempo que estava contando', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cancelFired(markFired(t, s(5)))
    expect(t.pending).toBeNull()
    expect(currentCycleSeconds(t, s(7))).toBe(7)
  })

  it('limita a quantidade de ciclos', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    for (let i = 0; i < MAX_CYCLES + 5; i++) {
      t = cycle(t, { firedAt: i * 2 + 1, closedAt: i * 2 + 2, hits: 1 })
    }
    expect(t.cycles).toHaveLength(MAX_CYCLES)
  })
})

describe('coletou e acertou', () => {
  it('coletou começa em 4', () => {
    const t = markFired(startPhase(createPhaseTimer(), s(0)), s(3))
    expect(t.pending.collected).toBe(4)
  })

  it('acertos nunca passam do que foi coletado', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 5, closedAt: 6, collected: 2, hits: 4 })
    expect(t.cycles[0].hits).toBe(2)
  })

  it('coletou fica entre 1 e 4', () => {
    let t = markFired(startPhase(createPhaseTimer(), s(0)), s(3))
    expect(setCollected(t, 9).pending.collected).toBe(4)
    expect(setCollected(t, 0).pending.collected).toBe(1)
  })
})

describe('preload no AUTO', () => {
  it('só o primeiro ciclo do AUTO é preload', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 3, closedAt: 4, hits: 4, preload: true })
    t = cycle(t, { firedAt: 15, closedAt: 16, hits: 2, preload: true })
    expect(t.cycles.map((c) => c.preload)).toEqual([true, false])
  })

  it('no TELEOP nenhum ciclo é preload', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 3, closedAt: 4, hits: 4 })
    expect(t.cycles[0].preload).toBe(false)
  })
})

describe('desfazer', () => {
  it('volta para a escolha de acertos do último ciclo, com o mesmo tempo', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 8, closedAt: 10, hits: 1, collected: 3 })
    t = undoLastCycle(t)
    expect(t.cycles).toHaveLength(0)
    expect(t.pending).toEqual({ firedAt: s(8), collected: 3 })

    t = closeCycle(t, 3, s(12))
    expect(t.cycles[0]).toMatchObject({ seconds: 8, hits: 3, collected: 3 })
  })

  it('sem ciclos, não faz nada', () => {
    const t = startPhase(createPhaseTimer(), s(0))
    expect(undoLastCycle(t)).toBe(t)
  })
})

describe('resumo da fase', () => {
  it('calcula erros, precisão e tempo médio sem o scouter anotar', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 3, closedAt: 4, hits: 4, preload: true }) // preload, 3 s
    t = cycle(t, { firedAt: 14, closedAt: 15, hits: 3 }) // 10 s
    t = cycle(t, { firedAt: 27, closedAt: 28, hits: 1, collected: 2 }) // 12 s
    expect(summarizeCycles(t.cycles)).toEqual({
      totalCycles: 3,
      totalShots: 10,
      totalHits: 8,
      totalMisses: 2,
      accuracy: 0.8,
      avgCycleSeconds: 11, // média de 10 e 12; o preload fica fora
    })
  })

  it('sem ciclos: zeros e campos vazios', () => {
    expect(summarizeCycles([])).toEqual({
      totalCycles: 0,
      totalShots: 0,
      totalHits: 0,
      totalMisses: 0,
      accuracy: null,
      avgCycleSeconds: null,
    })
  })

  it('só preload: não há tempo médio', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 3, closedAt: 4, hits: 4, preload: true })
    expect(summarizeCycles(t.cycles).avgCycleSeconds).toBeNull()
  })
})

describe('formato para o banco e para a tela', () => {
  it('remove os campos internos do desfazer', () => {
    let t = startPhase(createPhaseTimer(), s(0))
    t = cycle(t, { firedAt: 8, closedAt: 10, hits: 3 })
    expect(toStoredCycle(t.cycles[0])).toEqual({
      at: 8,
      seconds: 8,
      collected: 4,
      hits: 3,
      preload: false,
    })
  })

  it('formata porcentagem e segundos em português', () => {
    expect(formatPercent(0.756)).toBe('76%')
    expect(formatPercent(null)).toBe('—')
    expect(formatSeconds(11.25)).toBe('11,3 s')
    expect(formatSeconds(null)).toBe('—')
  })
})
