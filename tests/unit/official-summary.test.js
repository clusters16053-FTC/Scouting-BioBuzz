import { describe, expect, it } from 'vitest'
import { buildEventSummary } from '../../src/features/dashboard/analytics.js'
import { normalizeMatches } from '../../src/features/official/official-data.js'
import { enrichSummary } from '../../src/features/official/official-summary.js'

const official = {
  fetchedAt: 1,
  teams: [
    { teamNumber: 16053, name: 'Clusters' },
    { teamNumber: 8743, name: 'Abelhas Mecânicas' },
  ],
  rankings: [{ teamNumber: 8743, rank: 1, rankingScore: 4.5, wins: 3, losses: 0, ties: 0 }],
  matches: normalizeMatches(
    {
      qual: [
        {
          matchNumber: 1,
          teams: [
            { teamNumber: 16053, station: 'Red1' },
            { teamNumber: 8743, station: 'Red2' },
          ],
        },
      ],
    },
    { qual: [{ matchNumber: 1, scoreRedFinal: 100, scoreRedFoul: 10, scoreBlueFinal: 0 }] },
  ),
}

describe('enrichSummary', () => {
  it('sem dados oficiais, devolve o resumo como estava', () => {
    const summary = buildEventSummary([], [])
    expect(enrichSummary(summary, { fetchedAt: null })).toBe(summary)
  })

  it('inclui equipes inscritas sem relatório, com nome, ranking e OPR', () => {
    const { teams } = enrichSummary(buildEventSummary([], []), official)
    const abelhas = teams.find((t) => t.teamNumber === 8743)
    expect(abelhas).toMatchObject({
      teamName: 'Abelhas Mecânicas',
      played: 0,
      officialRank: 1,
      record: { wins: 3, losses: 0, ties: 0 },
    })
    // 100 pontos - 10 de falta, divididos entre as duas (só jogaram juntas).
    expect(abelhas.opr).toBeCloseTo(45, 0)
    expect(teams.find((t) => t.teamNumber === 16053).officialRank).toBeNull()
  })
})
