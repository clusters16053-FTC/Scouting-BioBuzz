/**
 * Junta os dados oficiais ao resumo da dashboard (que vem só dos nossos scouters).
 *
 * - Nome oficial de cada equipe (o do pit fica de reserva).
 * - Equipes inscritas que ainda não têm relatório também aparecem (com "—").
 * - Ranking oficial, RS, vitórias/derrotas e OPR calculado com os resultados oficiais.
 *
 * Função pura: recebe o resumo e o pacote oficial, devolve um resumo novo.
 */
import { summarizeTeam } from '../dashboard/analytics.js'
import { computeOpr, nonPenaltyPoints } from './official-data.js'

export function enrichSummary(summary, official) {
  if (!official?.fetchedAt) return summary

  const names = new Map(official.teams.map((t) => [t.teamNumber, t.name]))
  const ranks = new Map(official.rankings.map((r) => [r.teamNumber, r]))
  const opr = computeOpr(official.matches, nonPenaltyPoints)
  const autoOpr = computeOpr(official.matches, (score) => score.auto)

  const known = new Set(summary.teams.map((t) => t.teamNumber))
  const onlyOfficial = official.teams
    .filter((t) => !known.has(t.teamNumber))
    .map((t) => summarizeTeam(t.teamNumber, [], []))

  const teams = [...summary.teams, ...onlyOfficial].map((team) => {
    const rank = ranks.get(team.teamNumber)
    return {
      ...team,
      teamName: names.get(team.teamNumber) || team.teamName,
      officialRank: rank?.rank ?? null,
      rankingScore: rank?.rankingScore ?? null,
      record: rank ? { wins: rank.wins, losses: rank.losses, ties: rank.ties } : null,
      opr: opr.get(team.teamNumber) ?? null,
      autoOpr: autoOpr.get(team.teamNumber) ?? null,
    }
  })

  return { ...summary, teams }
}
