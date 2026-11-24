import { describe, expect, it } from 'vitest'
import {
  checkReports,
  computeOpr,
  humanizeField,
  matchesOf,
  nextMatchOf,
  nonPenaltyPoints,
  normalizeMatches,
  normalizeRankings,
  normalizeScores,
  normalizeTeams,
  teamAtStation,
  typoCorrections,
} from '../../src/features/official/official-data.js'

/** Linha da tabela no formato da API da FIRST. */
function scheduled(matchNumber, [red1, red2], [blue1, blue2]) {
  return {
    matchNumber,
    description: `Qualification ${matchNumber}`,
    teams: [
      { teamNumber: red1, station: 'Red1' },
      { teamNumber: red2, station: 'Red2' },
      { teamNumber: blue1, station: 'Blue1' },
      { teamNumber: blue2, station: 'Blue2' },
    ],
  }
}

function result(matchNumber, red, blue, { redFoul = 0, blueFoul = 0 } = {}) {
  return {
    matchNumber,
    scoreRedFinal: red,
    scoreRedAuto: Math.round(red / 3),
    scoreRedFoul: redFoul,
    scoreBlueFinal: blue,
    scoreBlueAuto: Math.round(blue / 3),
    scoreBlueFoul: blueFoul,
  }
}

const SCHEDULE = {
  qual: [
    scheduled(1, [16053, 8743], [18002, 11234]),
    scheduled(2, [18002, 16053], [8743, 11234]),
    scheduled(3, [11234, 16053], [8743, 18002]),
  ],
  playoff: [],
}
const RESULTS = { qual: [result(1, 120, 90, { redFoul: 10 }), result(2, 80, 100)], playoff: [] }
const MATCHES = normalizeMatches(SCHEDULE, RESULTS)

describe('normalizeTeams', () => {
  it('usa o nome curto, junta cidade e estado e ordena', () => {
    const teams = normalizeTeams([
      { teamNumber: 18002, nameShort: 'RoboMel', city: 'Fortaleza', stateProv: 'CE' },
      { teamNumber: 16053, nameShort: '', nameFull: 'Clusters FTC' },
      { nameShort: 'sem número' },
    ])
    expect(teams).toEqual([
      { teamNumber: 16053, name: 'Clusters FTC', city: '' },
      { teamNumber: 18002, name: 'RoboMel', city: 'Fortaleza, CE' },
    ])
  })
})

describe('normalizeMatches', () => {
  it('traduz "Red1" em aliança e posição', () => {
    expect(MATCHES[0].teams[0]).toMatchObject({ teamNumber: 16053, alliance: 'red', station: 1 })
    expect(MATCHES[0].teams[3]).toMatchObject({ teamNumber: 11234, alliance: 'blue', station: 2 })
  })

  it('junta o placar quando a partida já foi jogada', () => {
    expect(MATCHES[0].played).toBe(true)
    expect(MATCHES[0].score.red).toEqual({ total: 120, auto: 40, foul: 10 })
    expect(MATCHES[2].played).toBe(false)
    expect(MATCHES[2].score).toBeNull()
  })
})

describe('consultas na tabela', () => {
  it('acha a equipe de uma posição', () => {
    expect(teamAtStation(MATCHES, 2, 'red', 2)).toBe(16053)
    expect(teamAtStation(MATCHES, 2, 'blue', 1)).toBe(8743)
    expect(teamAtStation(MATCHES, 99, 'red', 1)).toBeNull()
  })

  it('lista partidas de uma equipe com parceiro, adversários e resultado', () => {
    const [first, second] = matchesOf(MATCHES, 16053)
    expect(first).toMatchObject({ alliance: 'red', partners: [8743], opponents: [18002, 11234] })
    expect(first.outcome).toBe('win')
    expect(second.outcome).toBe('loss')
  })

  it('próxima partida é a primeira ainda não jogada', () => {
    expect(nextMatchOf(MATCHES, 16053).match.number).toBe(3)
    expect(nextMatchOf(MATCHES, 99999)).toBeNull()
  })
})

describe('computeOpr', () => {
  it('recupera a contribuição de cada equipe quando os placares são exatos', () => {
    const truth = { 1: 10, 2: 20, 3: 30, 4: 40 }
    const pairs = [
      [
        [1, 2],
        [3, 4],
      ],
      [
        [1, 3],
        [2, 4],
      ],
      [
        [1, 4],
        [2, 3],
      ],
      [
        [2, 1],
        [4, 3],
      ],
    ]
    const schedule = {
      qual: pairs.map(([red, blue], i) => scheduled(i + 1, red, blue)),
      playoff: [],
    }
    const sum = (teams) => teams.reduce((acc, t) => acc + truth[t], 0)
    const results = {
      qual: pairs.map(([red, blue], i) => result(i + 1, sum(red), sum(blue))),
      playoff: [],
    }
    const opr = computeOpr(normalizeMatches(schedule, results), (s) => s.total)
    for (const [team, value] of Object.entries(truth)) {
      expect(opr.get(Number(team))).toBeCloseTo(value, 1)
    }
  })

  it('sem como separar (sempre juntas), divide os pontos entre as duas', () => {
    const schedule = { qual: [scheduled(1, [1, 2], [3, 4])], playoff: [] }
    const results = { qual: [result(1, 50, 30)], playoff: [] }
    const opr = computeOpr(normalizeMatches(schedule, results), (s) => s.total)
    expect(opr.get(1)).toBeCloseTo(25, 1)
    expect(opr.get(2)).toBeCloseTo(25, 1)
  })

  it('ignora partidas não jogadas e devolve vazio sem dados', () => {
    expect(computeOpr(normalizeMatches(SCHEDULE, { qual: [] }), (s) => s.total).size).toBe(0)
  })

  it('pontos sem faltas descontam as faltas recebidas', () => {
    expect(nonPenaltyPoints({ total: 120, foul: 10 })).toBe(110)
    expect(nonPenaltyPoints({ total: null, foul: 0 })).toBeNull()
  })
})

describe('normalizeRankings', () => {
  it('pega posição, RS e vitórias, em ordem', () => {
    const ranks = normalizeRankings([
      {
        rank: 2,
        teamNumber: 18002,
        sortOrder1: 4.1,
        wins: 3,
        losses: 1,
        ties: 0,
        matchesPlayed: 4,
      },
      {
        rank: 1,
        teamNumber: 16053,
        sortOrder1: 4.6,
        wins: 4,
        losses: 0,
        ties: 0,
        matchesPlayed: 4,
      },
    ])
    expect(ranks.map((r) => r.teamNumber)).toEqual([16053, 18002])
    expect(ranks[0]).toMatchObject({ rank: 1, rankingScore: 4.6, wins: 4 })
  })
})

describe('normalizeScores', () => {
  it('guarda todos os números de cada aliança, sem conhecer o jogo', () => {
    const scores = normalizeScores([
      {
        matchNumber: 7,
        alliances: [
          { alliance: 'Red', team: 0, autoTipCount: 2, swarmAchieved: true, notes: 'x' },
          { alliance: 'Blue', team: 0, autoTipCount: 1, swarmAchieved: false },
        ],
      },
    ])
    expect(scores['qual-7']).toEqual({
      red: { autoTipCount: 2, swarmAchieved: true },
      blue: { autoTipCount: 1, swarmAchieved: false },
    })
  })

  it('deixa o nome do campo legível', () => {
    expect(humanizeField('autoTipCount')).toBe('Auto tip count')
  })
})

describe('checkReports', () => {
  const report = (matchNumber, alliance, station, teamNumber) => ({
    id: `r-${matchNumber}-${alliance}${station}`,
    matchNumber,
    alliance,
    station,
    teamNumber,
    scouter: 'Ana',
  })

  it('acha equipe digitada errada e robô sem relatório (só em partidas jogadas)', () => {
    const reports = [
      report(1, 'red', 1, 16053),
      report(1, 'red', 2, 8734), // a tabela diz 8743
      report(1, 'blue', 1, 18002),
      report(2, 'red', 1, 18002),
      report(3, 'red', 1, 11234), // partida 3 ainda não jogada: não conta
    ]
    const check = checkReports(MATCHES, reports)
    expect(check.wrongTeam).toEqual([
      {
        reportId: 'r-1-red2',
        likelyTypo: false,
        matchNumber: 1,
        alliance: 'red',
        station: 2,
        expected: 8743,
        reported: 8734,
        scouter: 'Ana',
      },
    ])
    expect(check.missing.map((m) => `${m.matchNumber}-${m.teamNumber}`)).toEqual([
      '1-11234',
      '2-16053',
      '2-8743',
      '2-11234',
    ])
    expect(check).toMatchObject({ covered: 4, total: 8 })
  })

  it('número fora do evento é erro de digitação e pode ser corrigido sozinho', () => {
    const eventTeams = new Set([16053, 8743, 18002, 11234])
    const typo = checkReports(MATCHES, [report(1, 'red', 2, 8734)], eventTeams)
    expect(typo.wrongTeam[0].likelyTypo).toBe(true)
    expect([...typoCorrections(typo)]).toEqual([['r-1-red2', 8743]])

    // 18002 está inscrita: pode ter sido a posição que foi anotada errada. Só avisa.
    const doubt = checkReports(MATCHES, [report(1, 'red', 2, 18002)], eventTeams)
    expect(doubt.wrongTeam[0].likelyTypo).toBe(false)
    expect(typoCorrections(doubt).size).toBe(0)
  })
})
