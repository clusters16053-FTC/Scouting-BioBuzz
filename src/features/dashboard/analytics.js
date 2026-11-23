/**
 * Cálculos da dashboard, sem tela e sem Firebase.
 *
 * Entrada: os documentos crus de matchReports e pitReports.
 * Saída: um resumo por equipe e projeções de aliança.
 *
 * Regras importantes:
 *   - Só relatórios de partida no formato atual (schemaVersion 2) entram.
 *   - Ciclos com valores absurdos são descartados e os totais RECALCULADOS aqui:
 *     as regras do banco não conseguem validar cada ciclo da lista.
 *   - Se dois scouters registrarem a mesma equipe na mesma partida, vale o mais recente.
 *   - Médias de desempenho usam só partidas jogadas (sem "não apareceu").
 *   - TIPs e pontos da HIVE NÃO são estimados: o TIP é da aliança e o manual não diz
 *     quantos POLLEN viram um TIP. A contribuição para os TIPs é medida em acertos no CELL.
 */
import { POINTS, RANKING } from '../../config/game.js'

export const MATCH_SCHEMA = 2
const MAX_CYCLE_SECONDS = 300

// ---------- Limpeza ----------

function isInt(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max
}

function cleanCycles(cycles) {
  if (!Array.isArray(cycles)) return []
  return cycles.filter(
    (c) =>
      c &&
      isInt(c.collected, 1, 4) &&
      isInt(c.hits, 0, c.collected) &&
      Number.isFinite(c.seconds) &&
      c.seconds >= 0 &&
      c.seconds <= MAX_CYCLE_SECONDS,
  )
}

function toMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** Normaliza um relatório de partida; devolve null se não der para usar. */
export function sanitizeMatchReport(raw) {
  if (!raw || raw.schemaVersion !== MATCH_SCHEMA) return null
  if (!isInt(raw.teamNumber, 1, 99999) || !isInt(raw.matchNumber, 1, 999)) return null

  const auto = raw.auto ?? {}
  const teleop = raw.teleop ?? {}
  const endgame = raw.endgame ?? {}
  const count = (v) => (isInt(v, 0, 99) ? v : 0)

  return {
    id: raw.id,
    teamNumber: raw.teamNumber,
    matchNumber: raw.matchNumber,
    alliance: raw.alliance,
    station: raw.station,
    scouter: raw.scouter ?? '',
    noShow: raw.noShow === true,
    auto: {
      leave: auto.leave === true,
      park: auto.park === true,
      cycles: cleanCycles(auto.cycles),
    },
    teleop: {
      cycles: cleanCycles(teleop.cycles),
      intake: Array.isArray(teleop.intake) ? teleop.intake : [],
    },
    endgame: {
      nectarFlower: count(endgame.nectarFlower),
      pollenFlower: count(endgame.pollenFlower),
      garden: count(endgame.garden),
      park: endgame.park === true,
    },
    defensePlayed: raw.defensePlayed ?? 'none',
    defenseReceived: raw.defenseReceived ?? 'none',
    issues: Array.isArray(raw.issues) ? raw.issues : [],
    driverRating: isInt(raw.driverRating, 0, 5) ? raw.driverRating : 0,
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
    createdAt: toMillis(raw.createdAt),
  }
}

/**
 * Um relatório por equipe por partida. Se houver dois (dois scouters no mesmo robô),
 * fica o mais recente. Devolve também quantos duplicados foram descartados.
 */
export function dedupeReports(reports) {
  const byKey = new Map()
  let duplicates = 0
  for (const report of reports) {
    const key = `${report.teamNumber}:${report.matchNumber}`
    const existing = byKey.get(key)
    if (existing) {
      duplicates += 1
      if (report.createdAt < existing.createdAt) continue
    }
    byKey.set(key, report)
  }
  return { reports: [...byKey.values()], duplicates }
}

// ---------- Uma partida ----------

const sum = (values) => values.reduce((total, v) => total + v, 0)
const mean = (values) => (values.length ? sum(values) / values.length : null)

/** Números de uma partida de uma equipe. */
export function matchStats(report) {
  const autoCycles = report.auto.cycles
  const teleCycles = report.teleop.cycles
  const autoHits = sum(autoCycles.map((c) => c.hits))
  const autoShots = sum(autoCycles.map((c) => c.collected))
  const teleopHits = sum(teleCycles.map((c) => c.hits))
  const teleopShots = sum(teleCycles.map((c) => c.collected))

  const leaveParkPoints =
    (report.auto.leave ? POINTS.auto.leave : 0) +
    (report.auto.park ? POINTS.auto.park : 0) +
    (report.endgame.park ? POINTS.teleop.park : 0)

  return {
    matchNumber: report.matchNumber,
    alliance: report.alliance,
    noShow: report.noShow,
    autoHits,
    autoShots,
    teleopHits,
    teleopShots,
    totalHits: autoHits + teleopHits,
    totalShots: autoShots + teleopShots,
    autoCycles: autoCycles.length,
    teleopCycles: teleCycles.length,
    // Tempo de ciclo: só TELEOP e sem preload (no AUTO o robô já começa carregado).
    cycleSeconds: teleCycles.filter((c) => !c.preload).map((c) => c.seconds),
    leaveParkPoints,
    flowerPieces: report.endgame.nectarFlower + report.endgame.pollenFlower,
    garden: report.endgame.garden,
    hasIssue: report.issues.length > 0,
  }
}

// ---------- Uma equipe ----------

const rate = (items, predicate) =>
  items.length ? items.filter(predicate).length / items.length : null

function countBy(items, pick) {
  const counts = {}
  for (const item of items) {
    for (const key of pick(item)) counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function standardDeviation(values) {
  if (values.length < 2) return null
  const avg = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)))
}

/** Último relatório de pit de uma equipe (o mais recente vale). */
function latestPit(pits) {
  return pits.reduce(
    (latest, pit) =>
      !latest || toMillis(pit.createdAt) > toMillis(latest.createdAt) ? pit : latest,
    null,
  )
}

/**
 * Resumo de uma equipe a partir dos seus relatórios (já limpos e sem duplicados).
 * Campos com `null` significam "sem dado suficiente", não zero.
 */
export function summarizeTeam(teamNumber, reports, pits = []) {
  const ordered = [...reports].sort((a, b) => a.matchNumber - b.matchNumber)
  const played = ordered.filter((r) => !r.noShow)
  const perMatch = played.map(matchStats)

  const totalHits = sum(perMatch.map((m) => m.totalHits))
  const totalShots = sum(perMatch.map((m) => m.totalShots))
  const autoHits = sum(perMatch.map((m) => m.autoHits))
  const autoShots = sum(perMatch.map((m) => m.autoShots))
  const teleopHits = sum(perMatch.map((m) => m.teleopHits))
  const teleopShots = sum(perMatch.map((m) => m.teleopShots))
  const allCycleSeconds = perMatch.flatMap((m) => m.cycleSeconds)
  const hitsPerMatch = perMatch.map((m) => m.totalHits)

  const recent = hitsPerMatch.slice(-3)
  const avgTotalHits = mean(hitsPerMatch)
  const rated = played.filter((r) => r.driverRating > 0).map((r) => r.driverRating)
  const pit = latestPit(pits)

  return {
    teamNumber,
    teamName: pit?.teamName || '',
    matches: ordered.length,
    played: played.length,
    noShows: ordered.length - played.length,

    // Contribuição para os TIPs (acertos no CELL)
    avgTotalHits,
    avgAutoHits: mean(perMatch.map((m) => m.autoHits)),
    avgTeleopHits: mean(perMatch.map((m) => m.teleopHits)),
    accuracy: totalShots ? totalHits / totalShots : null,
    autoAccuracy: autoShots ? autoHits / autoShots : null,
    teleopAccuracy: teleopShots ? teleopHits / teleopShots : null,
    avgTeleopCycles: mean(perMatch.map((m) => m.teleopCycles)),
    avgCycleSeconds: mean(allCycleSeconds),

    // Consistência
    minHits: hitsPerMatch.length ? Math.min(...hitsPerMatch) : null,
    maxHits: hitsPerMatch.length ? Math.max(...hitsPerMatch) : null,
    hitsStdDev: standardDeviation(hitsPerMatch),
    recentHits: recent.length ? mean(recent) : null,
    // Positivo = as últimas 3 partidas estão acima da média geral.
    trend:
      recent.length && hitsPerMatch.length > recent.length ? mean(recent) - avgTotalHits : null,

    // LEAVE / PARK (contam para o SWARM RP)
    leaveRate: rate(played, (r) => r.auto.leave),
    autoParkRate: rate(played, (r) => r.auto.park),
    endParkRate: rate(played, (r) => r.endgame.park),
    avgLeaveParkPoints: mean(perMatch.map((m) => m.leaveParkPoints)),

    // FLOWER e GARDEN
    avgNectarFlower: mean(played.map((r) => r.endgame.nectarFlower)),
    avgPollenFlower: mean(played.map((r) => r.endgame.pollenFlower)),
    avgFlowerPieces: mean(perMatch.map((m) => m.flowerPieces)),
    avgGarden: mean(perMatch.map((m) => m.garden)),

    // Comportamento
    defensePlayedRate: rate(played, (r) => r.defensePlayed !== 'none'),
    defenseReceivedRate: rate(played, (r) => r.defenseReceived !== 'none'),
    issueRate: rate(played, (r) => r.issues.length > 0),
    issueCounts: countBy(played, (r) => r.issues),
    intakeCounts: countBy(played, (r) => r.teleop.intake),
    avgDriverRating: mean(rated),

    perMatch,
    // Partidas em que o robô não apareceu (para marcar no gráfico).
    absentMatches: ordered
      .filter((r) => r.noShow)
      .map((r) => ({ matchNumber: r.matchNumber, noShow: true })),
    notes: ordered
      .filter((r) => r.notes)
      .map((r) => ({ matchNumber: r.matchNumber, scouter: r.scouter, text: r.notes })),
    pit,
  }
}

/**
 * Monta o resumo de todas as equipes do evento.
 * Equipes que só têm pit (ainda não jogaram) também aparecem.
 */
export function buildEventSummary(rawMatches, rawPits) {
  const cleaned = rawMatches.map(sanitizeMatchReport).filter(Boolean)
  const { reports, duplicates } = dedupeReports(cleaned)
  const pits = rawPits.filter((p) => p && Number.isInteger(p.teamNumber))

  const teams = new Set([...reports.map((r) => r.teamNumber), ...pits.map((p) => p.teamNumber)])
  const summaries = [...teams].map((team) =>
    summarizeTeam(
      team,
      reports.filter((r) => r.teamNumber === team),
      pits.filter((p) => p.teamNumber === team),
    ),
  )

  return {
    teams: summaries,
    overview: {
      teamCount: teams.size,
      reportCount: reports.length,
      matchCount: new Set(reports.map((r) => r.matchNumber)).size,
      pitCount: new Set(pits.map((p) => p.teamNumber)).size,
      ignoredReports: rawMatches.length - cleaned.length,
      duplicates,
    },
  }
}

// ---------- Aliança ----------

/**
 * Projeção de uma aliança (1 ou 2 equipes) a partir das médias.
 * É uma estimativa: a soma das médias, não uma previsão garantida.
 */
export function projectAlliance(summaries) {
  const teams = summaries.filter(Boolean)
  const add = (pick) => sum(teams.map((t) => pick(t) ?? 0))
  const expectedLeavePark = add((t) => t.avgLeaveParkPoints)

  return {
    teams,
    expectedHits: add((t) => t.avgTotalHits),
    expectedLeavePark,
    swarmThreshold: RANKING.swarmThreshold,
    swarmLikely: expectedLeavePark >= RANKING.swarmThreshold,
    expectedFlowerPieces: add((t) => t.avgFlowerPieces),
    flowerScorers: teams.filter((t) => (t.avgFlowerPieces ?? 0) > 0 || t.pit?.flowerPlaces?.length),
    flowerRemovers: teams.filter((t) => t.pit?.removesFromFlower),
    defenders: teams.filter((t) => (t.defensePlayedRate ?? 0) >= 0.5),
    risky: teams.filter((t) => (t.issueRate ?? 0) >= 0.34),
    missingData: teams.filter((t) => !t.played),
  }
}

// ---------- Formatação (pt-BR) ----------

const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 12.345 → "12,3"; null → "—" */
export function formatNumber(value) {
  return value === null || value === undefined ? '—' : oneDecimal.format(value)
}

/** 0.756 → "76%"; null → "—" */
export function formatRate(value) {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}
