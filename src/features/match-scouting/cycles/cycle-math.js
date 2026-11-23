/**
 * Lógica dos ciclos de lançamento, sem tela e sem Firebase.
 *
 * Um CICLO: o robô coleta POLLEN (máx. 4, regra G407), fica pronto e atira.
 * O scouter marca:
 *   1. "ATIROU"  → momento em que o robô começou a atirar
 *   2. coletou (1–4) e acertou (0–coletou) → fecha o ciclo
 *
 * Tempo de ciclo = do fim do ciclo anterior (ou do "Começou") até o "ATIROU".
 * Ou seja: quanto tempo ele leva para coletar e ficar pronto para disparar.
 *
 * O estado da fase fica no rascunho como:
 *   {
 *     startedAt: number | null,   // epoch ms do "Começou"
 *     markAt: number | null,      // epoch ms de onde o ciclo atual começou a contar
 *     pending: { firedAt, collected } | null,  // depois do ATIROU, esperando os acertos
 *     cycles: [ { at, seconds, collected, hits, preload, startMs, firedMs } ]
 *   }
 * startMs/firedMs servem só para o "desfazer" e não vão para o banco.
 */

export const MAX_PER_CYCLE = 4
export const MAX_CYCLES = 30

export function createPhaseTimer() {
  return { startedAt: null, markAt: null, pending: null, cycles: [] }
}

/** "Começou o AUTO/TELEOP": liga o cronômetro. */
export function startPhase(timer, now) {
  if (timer.startedAt !== null) return timer
  return { ...timer, startedAt: now, markAt: now }
}

/** "ATIROU": congela o tempo do ciclo e espera os acertos. */
export function markFired(timer, now) {
  if (timer.startedAt === null || timer.pending || timer.cycles.length >= MAX_CYCLES) return timer
  return { ...timer, pending: { firedAt: now, collected: MAX_PER_CYCLE } }
}

/** Troca quantos POLLEN ele coletou neste ciclo. */
export function setCollected(timer, collected) {
  if (!timer.pending) return timer
  const value = clamp(collected, 1, MAX_PER_CYCLE)
  return { ...timer, pending: { ...timer.pending, collected: value } }
}

/** Apertou ATIROU sem querer: volta, sem perder o tempo que já estava contando. */
export function cancelFired(timer) {
  return { ...timer, pending: null }
}

/**
 * Informa os acertos e fecha o ciclo.
 * O próximo ciclo começa a contar a partir de agora.
 * `isPreloadPhase`: no AUTO, o 1º ciclo é o preload (não houve coleta).
 */
export function closeCycle(timer, hits, now, { isPreloadPhase = false } = {}) {
  const { pending } = timer
  if (!pending) return timer

  const collected = pending.collected
  const cycle = {
    at: roundTenth((pending.firedAt - timer.startedAt) / 1000),
    seconds: roundTenth((pending.firedAt - timer.markAt) / 1000),
    collected,
    hits: clamp(hits, 0, collected),
    preload: isPreloadPhase && timer.cycles.length === 0,
    startMs: timer.markAt,
    firedMs: pending.firedAt,
  }

  return { ...timer, pending: null, markAt: now, cycles: [...timer.cycles, cycle] }
}

/**
 * Desfaz o último ciclo e volta para a escolha de acertos dele,
 * já que o erro mais comum é ter tocado no número errado.
 */
export function undoLastCycle(timer) {
  const last = timer.cycles.at(-1)
  if (!last) return timer
  return {
    ...timer,
    cycles: timer.cycles.slice(0, -1),
    markAt: last.startMs,
    pending: { firedAt: last.firedMs, collected: last.collected },
  }
}

/** Segundos do ciclo que está contando agora (para o cronômetro na tela). */
export function currentCycleSeconds(timer, now) {
  if (timer.markAt === null) return 0
  const end = timer.pending ? timer.pending.firedAt : now
  return Math.max(0, (end - timer.markAt) / 1000)
}

/**
 * Totais de uma fase: o que o scouter NÃO precisa anotar.
 * - erros = coletadas − acertos
 * - precisão = acertos ÷ coletadas
 * - tempo médio ignora o ciclo de preload (não teve coleta)
 */
export function summarizeCycles(cycles) {
  const totalShots = cycles.reduce((sum, c) => sum + c.collected, 0)
  const totalHits = cycles.reduce((sum, c) => sum + c.hits, 0)
  const timed = cycles.filter((c) => !c.preload)
  const avgCycleSeconds = timed.length
    ? roundTenth(timed.reduce((sum, c) => sum + c.seconds, 0) / timed.length)
    : null

  return {
    totalCycles: cycles.length,
    totalShots,
    totalHits,
    totalMisses: totalShots - totalHits,
    accuracy: totalShots ? totalHits / totalShots : null,
    avgCycleSeconds,
  }
}

/** Ciclo no formato do banco (sem os campos internos do "desfazer"). */
export function toStoredCycle(cycle) {
  return {
    at: cycle.at,
    seconds: cycle.seconds,
    collected: cycle.collected,
    hits: cycle.hits,
    preload: cycle.preload,
  }
}

/** 0.75 → "75%"; null → "—" */
export function formatPercent(value) {
  return value === null ? '—' : `${Math.round(value * 100)}%`
}

/** 12.34 → "12,3 s"; null → "—" */
export function formatSeconds(value) {
  return value === null ? '—' : `${value.toFixed(1).replace('.', ',')} s`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function roundTenth(value) {
  return Math.round(value * 10) / 10
}
