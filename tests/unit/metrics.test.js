import { describe, expect, it } from 'vitest'
import {
  applyPreset,
  bestIndexes,
  isLowSample,
  leadersOf,
  positionOf,
  rankBy,
  searchTeams,
  sortTeams,
} from '../../src/features/dashboard/metrics.js'

/** Resumo mínimo de equipe: só os campos que cada teste usa. */
function team(teamNumber, fields = {}) {
  return { teamNumber, teamName: '', played: 3, pit: null, ...fields }
}

describe('rankBy', () => {
  it('ordena do melhor para o pior conforme a métrica', () => {
    const teams = [
      team(1, { avgTotalHits: 10 }),
      team(2, { avgTotalHits: 20 }),
      team(3, { avgTotalHits: 15 }),
    ]
    expect(rankBy(teams, 'avgTotalHits').map((r) => r.team.teamNumber)).toEqual([2, 3, 1])
  })

  it('no tempo de ciclo, menor é melhor', () => {
    const teams = [team(1, { avgCycleSeconds: 12 }), team(2, { avgCycleSeconds: 9 })]
    expect(rankBy(teams, 'avgCycleSeconds')[0].team.teamNumber).toBe(2)
  })

  it('empate divide a posição', () => {
    const teams = [
      team(1, { avgTotalHits: 20 }),
      team(2, { avgTotalHits: 15 }),
      team(3, { avgTotalHits: 15 }),
      team(4, { avgTotalHits: 5 }),
    ]
    expect(rankBy(teams, 'avgTotalHits').map((r) => r.rank)).toEqual([1, 2, 2, 4])
  })

  it('deixa de fora quem não jogou ou não tem valor', () => {
    const teams = [
      team(1, { avgCycleSeconds: 10 }),
      team(2, { avgCycleSeconds: null }),
      team(3, { played: 0, avgCycleSeconds: 8 }),
    ]
    expect(rankBy(teams, 'avgCycleSeconds')).toHaveLength(1)
  })

  it('métrica sem "melhor" (defesa) não tem ranking', () => {
    expect(rankBy([team(1, { defensePlayedRate: 1 })], 'defensePlayedRate')).toEqual([])
  })
})

describe('positionOf', () => {
  const teams = [
    team(1, { avgCycleSeconds: 8 }),
    team(2, { avgCycleSeconds: 10 }),
    team(3, { avgCycleSeconds: 12 }),
  ]

  it('dá posição, total e onde a equipe fica entre o pior (0) e o melhor (1)', () => {
    expect(positionOf(teams, 'avgCycleSeconds', 1)).toEqual({ rank: 1, total: 3, share: 1 })
    expect(positionOf(teams, 'avgCycleSeconds', 2)).toEqual({ rank: 2, total: 3, share: 0.5 })
    expect(positionOf(teams, 'avgCycleSeconds', 3)).toEqual({ rank: 3, total: 3, share: 0 })
  })

  it('null para equipe fora do ranking', () => {
    expect(positionOf(teams, 'avgCycleSeconds', 99)).toBeNull()
  })

  it('todos iguais contam como melhor', () => {
    const tied = [team(1, { accuracy: 0.5 }), team(2, { accuracy: 0.5 })]
    expect(positionOf(tied, 'accuracy', 2).share).toBe(1)
  })
})

describe('leadersOf', () => {
  it('pega as 3 primeiras e marca quem tem poucas partidas', () => {
    const teams = [
      team(1, { avgTotalHits: 30, played: 1 }),
      team(2, { avgTotalHits: 20 }),
      team(3, { avgTotalHits: 10 }),
      team(4, { avgTotalHits: 5 }),
    ]
    const leaders = leadersOf(teams, 'avgTotalHits')
    expect(leaders.map((l) => l.team.teamNumber)).toEqual([1, 2, 3])
    expect(leaders.map((l) => l.lowSample)).toEqual([true, false, false])
  })
})

describe('isLowSample', () => {
  it('menos de 3 partidas jogadas é pouco', () => {
    expect(isLowSample(team(1, { played: 2 }))).toBe(true)
    expect(isLowSample(team(1, { played: 3 }))).toBe(false)
  })
})

describe('sortTeams', () => {
  it('valores vazios ficam no fim nas duas direções', () => {
    const teams = [
      team(1, { accuracy: null }),
      team(2, { accuracy: 0.4 }),
      team(3, { accuracy: 0.8 }),
    ]
    expect(sortTeams(teams, 'accuracy', 'desc').map((t) => t.teamNumber)).toEqual([3, 2, 1])
    expect(sortTeams(teams, 'accuracy', 'asc').map((t) => t.teamNumber)).toEqual([2, 3, 1])
  })
})

describe('applyPreset', () => {
  const teams = [
    team(1, { avgTotalHits: 10, avgCycleSeconds: 9, issueRate: 0, defensePlayedRate: 0.6 }),
    team(2, { avgTotalHits: 20, avgCycleSeconds: null, issueRate: 0.5, defensePlayedRate: 0 }),
    team(3, {
      avgTotalHits: 15,
      avgCycleSeconds: 12,
      issueRate: 0,
      avgFlowerPieces: 0,
      pit: { flowerPlaces: ['nectar'] },
    }),
    team(4, { played: 0, avgTotalHits: null, pit: null }),
  ]
  const context = { watchlist: new Set([3, 1]) }
  const ids = (presetId) => applyPreset(teams, presetId, context).map((t) => t.teamNumber)

  it('favoritas, ordenadas por acertos', () => {
    expect(ids('favoritas')).toEqual([3, 1])
  })

  it('ciclo rápido: só quem tem tempo, do menor para o maior', () => {
    expect(ids('ciclo')).toEqual([1, 3])
  })

  it('FLOWER conta o que o pit disse, mesmo sem ter visto em partida', () => {
    expect(ids('flower')).toEqual([3])
  })

  it('defesa: metade das partidas ou mais', () => {
    expect(ids('defesa')).toEqual([1])
  })

  it('sem problemas: jogou e nunca teve problema', () => {
    expect(ids('confiaveis')).toEqual([3, 1])
  })

  it('sem entrevista de pit, em ordem de número', () => {
    expect(ids('sem-pit')).toEqual([1, 2, 4])
  })

  it('atalho desconhecido cai em "Todas"', () => {
    expect(ids('nao-existe')).toEqual([2, 3, 1, 4])
  })
})

describe('bestIndexes', () => {
  it('destaca o maior quando maior é melhor', () => {
    expect([...bestIndexes([10, 20, 15], 'higher')]).toEqual([1])
  })

  it('destaca o menor quando menor é melhor, ignorando vazios', () => {
    expect([...bestIndexes([null, 12, 9], 'lower')]).toEqual([2])
  })

  it('empate no topo destaca os dois', () => {
    expect([...bestIndexes([20, 20, 15], 'higher')]).toEqual([0, 1])
  })

  it('não destaca quando todos empatam, falta valor ou não existe melhor', () => {
    expect(bestIndexes([5, 5], 'higher').size).toBe(0)
    expect(bestIndexes([5, null], 'higher').size).toBe(0)
    expect(bestIndexes([0.2, 0.8], null).size).toBe(0)
  })
})

describe('searchTeams', () => {
  const teams = [
    team(16053, { teamName: 'Clusters' }),
    team(1605, { teamName: 'Voltz' }),
    team(8743, { teamName: 'Abelhas Mecânicas' }),
  ]

  it('número exato primeiro, depois quem começa com o texto', () => {
    expect(searchTeams(teams, '1605').map((t) => t.teamNumber)).toEqual([1605, 16053])
  })

  it('acha pelo nome, sem diferenciar maiúsculas', () => {
    expect(searchTeams(teams, 'abelhas').map((t) => t.teamNumber)).toEqual([8743])
  })

  it('texto vazio não sugere nada', () => {
    expect(searchTeams(teams, '  ')).toEqual([])
  })
})
