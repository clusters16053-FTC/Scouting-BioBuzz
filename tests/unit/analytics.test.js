/**
 * Testes dos cálculos da dashboard.
 * Os relatórios são montados com as mesmas funções do formulário (toMatchDocument),
 * então o teste cobre o caminho real: formulário → banco → dashboard.
 */
import { describe, expect, it } from 'vitest'
import {
  buildEventSummary,
  dedupeReports,
  formatNumber,
  formatRate,
  matchStats,
  projectAlliance,
  sanitizeMatchReport,
  summarizeTeam,
} from '../../src/features/dashboard/analytics.js'
import {
  createEmptyMatchDraft,
  toMatchDocument,
} from '../../src/features/match-scouting/match-schema.js'
import {
  closeCycle,
  createPhaseTimer,
  markFired,
  setCollected,
  startPhase,
} from '../../src/features/match-scouting/cycles/cycle-math.js'

/** Ciclos simulados: [[segundo do ATIROU, coletou, acertou], ...] */
function timer(cycles, isPreloadPhase = false) {
  const base = 1_700_000_000_000
  let t = startPhase(createPhaseTimer(), base)
  for (const [firedAt, collected, hits] of cycles) {
    t = markFired(t, base + firedAt * 1000)
    t = setCollected(t, collected)
    t = closeCycle(t, hits, base + (firedAt + 1) * 1000, { isPreloadPhase })
  }
  return t
}

let clock = 0
/** Relatório cru, como sai do formulário e fica no banco. */
function report(team, match, options = {}) {
  const draft = {
    ...createEmptyMatchDraft({ matchNumber: match, alliance: 'red', station: 1 }),
    teamNumber: team,
    noShow: options.noShow ?? false,
    auto: {
      leave: options.leave ?? true,
      park: options.autoPark ?? false,
      timer: timer(options.auto ?? [[3, 4, 4]], true),
    },
    teleop: { intake: options.intake ?? ['floor'], timer: timer(options.teleop ?? []) },
    endgame: {
      nectarFlower: options.nectar ?? 0,
      pollenFlower: options.pollen ?? 0,
      garden: options.garden ?? 0,
      park: options.endPark ?? true,
    },
    defensePlayed: options.defense ?? 'none',
    issues: options.issues ?? [],
    driverRating: options.rating ?? 0,
    notes: options.notes ?? '',
  }
  const doc = toMatchDocument(draft, { uid: 'u', scouter: 'Ana', syncedAt: null })
  clock += 1000
  return { ...doc, id: `${team}-${match}-${clock}`, createdAt: new Date(clock) }
}

describe('limpeza dos relatórios', () => {
  it('ignora o formato antigo (v1) e números inválidos', () => {
    expect(sanitizeMatchReport({ ...report(1, 1), schemaVersion: 1 })).toBeNull()
    expect(sanitizeMatchReport({ ...report(1, 1), teamNumber: -3 })).toBeNull()
    expect(sanitizeMatchReport(null)).toBeNull()
  })

  it('descarta ciclos absurdos e recalcula os totais', () => {
    const raw = report(1, 1, { teleop: [[10, 4, 3]] })
    raw.teleop.cycles.push({ at: 1, seconds: 9999, collected: 4, hits: 4, preload: false })
    raw.teleop.cycles.push({ at: 1, seconds: 5, collected: 2, hits: 3, preload: false })
    raw.teleop.totalHits = 999
    const stats = matchStats(sanitizeMatchReport(raw))
    expect(stats.teleopHits).toBe(3)
    expect(stats.teleopShots).toBe(4)
  })

  it('dois scouters na mesma equipe e partida: vale o mais recente', () => {
    const old = sanitizeMatchReport(report(7, 3, { teleop: [[10, 4, 1]] }))
    const latest = sanitizeMatchReport(report(7, 3, { teleop: [[10, 4, 4]] }))
    const { reports, duplicates } = dedupeReports([latest, old])
    expect(duplicates).toBe(1)
    expect(reports).toHaveLength(1)
    expect(matchStats(reports[0]).teleopHits).toBe(4)
  })
})

describe('resumo da equipe', () => {
  const reports = [
    // partida 1: preload 4/4 no AUTO; TELEOP 3/4 em 10 s e 2/4 em 14 s
    report(16053, 1, {
      teleop: [
        [10, 4, 3],
        [25, 4, 2],
      ],
      autoPark: true,
      nectar: 1,
      garden: 2,
      rating: 4,
      notes: 'rápida',
    }),
    // partida 2: robô não apareceu
    report(16053, 2, { noShow: true }),
    // partida 3: preload 2/4; TELEOP 4/4 em 12 s
    report(16053, 3, {
      auto: [[3, 4, 2]],
      teleop: [[12, 4, 4]],
      leave: false,
      endPark: false,
      issues: ['tipped'],
      defense: 'high',
      rating: 2,
    }),
  ].map(sanitizeMatchReport)

  const s = summarizeTeam(16053, reports, [
    { teamNumber: 16053, teamName: 'Clusters', createdAt: new Date(1), drivetrain: 'tank' },
    { teamNumber: 16053, teamName: 'Clusters', createdAt: new Date(2), drivetrain: 'mecanum' },
  ])

  it('conta partidas e separa quem não apareceu', () => {
    expect(s).toMatchObject({ matches: 3, played: 2, noShows: 1 })
    expect(s.absentMatches).toEqual([{ matchNumber: 2, noShow: true }])
    expect(s.perMatch.map((m) => m.matchNumber)).toEqual([1, 3])
  })

  it('acertos por partida e precisão usam só partidas jogadas', () => {
    // partida 1: 4 + 5 = 9 acertos em 12 tiros; partida 3: 2 + 4 = 6 em 8
    expect(s.avgTotalHits).toBe(7.5)
    expect(s.avgAutoHits).toBe(3)
    expect(s.avgTeleopHits).toBe(4.5)
    expect(s.accuracy).toBe(15 / 20)
    expect(s.autoAccuracy).toBe(6 / 8)
  })

  it('tempo de ciclo: só TELEOP, sem preload, média de todos os ciclos', () => {
    // ciclos do TELEOP: 10 s, 14 s (25 − 11) e 12 s
    expect(s.avgCycleSeconds).toBe(12)
    expect(s.avgTeleopCycles).toBe(1.5)
  })

  it('consistência: pior e melhor partida', () => {
    expect(s.minHits).toBe(6)
    expect(s.maxHits).toBe(9)
  })

  it('LEAVE/PARK em taxa e em pontos', () => {
    expect(s.leaveRate).toBe(0.5)
    expect(s.endParkRate).toBe(0.5)
    // partida 1: LEAVE 3 + PARK AUTO 5 + PARK final 5 = 13; partida 3: 0
    expect(s.avgLeaveParkPoints).toBe(6.5)
  })

  it('comportamento, nota e observações', () => {
    expect(s.defensePlayedRate).toBe(0.5)
    expect(s.issueRate).toBe(0.5)
    expect(s.issueCounts).toEqual({ tipped: 1 })
    expect(s.avgDriverRating).toBe(3)
    expect(s.notes).toEqual([{ matchNumber: 1, scouter: 'Ana', text: 'rápida' }])
  })

  it('usa o pit mais recente', () => {
    expect(s.pit.drivetrain).toBe('mecanum')
    expect(s.teamName).toBe('Clusters')
  })

  it('equipe sem partidas: médias vazias, não zero', () => {
    const empty = summarizeTeam(1, [])
    expect(empty.avgTotalHits).toBeNull()
    expect(empty.accuracy).toBeNull()
    expect(empty.minHits).toBeNull()
  })
})

describe('tendência', () => {
  it('compara as 3 últimas partidas com a média geral', () => {
    const hits = [0, 0, 4, 4, 4]
    const reports = hits.map((h, i) => sanitizeMatchReport(report(5, i + 1, { auto: [[3, 4, h]] })))
    const s = summarizeTeam(5, reports)
    expect(s.recentHits).toBe(4)
    expect(s.trend).toBeCloseTo(4 - 12 / 5)
  })

  it('sem partidas suficientes, não há tendência', () => {
    const s = summarizeTeam(5, [sanitizeMatchReport(report(5, 1))])
    expect(s.trend).toBeNull()
  })
})

describe('evento', () => {
  it('junta equipes de partidas e de pit e conta o que foi ignorado', () => {
    const matches = [
      report(1, 1),
      report(2, 1),
      report(1, 2),
      { ...report(3, 1), schemaVersion: 1 },
    ]
    const pits = [{ teamNumber: 9, teamName: 'Só pit', createdAt: new Date() }]
    const { teams, overview } = buildEventSummary(matches, pits)
    expect(teams.map((t) => t.teamNumber).sort((a, b) => a - b)).toEqual([1, 2, 9])
    expect(overview).toMatchObject({
      teamCount: 3,
      reportCount: 3,
      matchCount: 2,
      pitCount: 1,
      ignoredReports: 1,
      duplicates: 0,
    })
  })
})

describe('projeção de aliança', () => {
  const a = { avgTotalHits: 8, avgLeaveParkPoints: 10, avgFlowerPieces: 2, played: 3 }
  const b = { avgTotalHits: 5, avgLeaveParkPoints: 8, avgFlowerPieces: 0, played: 3 }

  it('soma as médias e compara com o SWARM (16 pontos)', () => {
    const p = projectAlliance([a, b])
    expect(p.expectedHits).toBe(13)
    expect(p.expectedLeavePark).toBe(18)
    expect(p.swarmLikely).toBe(true)
  })

  it('um robô só não chega no SWARM', () => {
    expect(projectAlliance([b, null]).swarmLikely).toBe(false)
  })

  it('aponta defensores, riscos e equipes sem dados', () => {
    const p = projectAlliance([
      { ...a, defensePlayedRate: 0.6, issueRate: 0.5 },
      { ...b, played: 0 },
    ])
    expect(p.defenders).toHaveLength(1)
    expect(p.risky).toHaveLength(1)
    expect(p.missingData).toHaveLength(1)
  })
})

describe('formatação', () => {
  it('número com uma casa e porcentagem', () => {
    expect(formatNumber(7.25)).toBe('7,3')
    expect(formatNumber(null)).toBe('—')
    expect(formatRate(0.756)).toBe('76%')
    expect(formatRate(null)).toBe('—')
  })
})
