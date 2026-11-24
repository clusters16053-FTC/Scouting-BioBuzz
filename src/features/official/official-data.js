/**
 * Dados oficiais da FIRST no formato do app, e os cálculos feitos em cima deles.
 *
 * A API da FIRST responde em inglês e com nomes próprios (scoreRedFinal, station "Red1"...).
 * Tudo passa por aqui uma vez: o resto do app só conhece o formato normalizado.
 * Se a FIRST mudar um nome de campo, o ajuste é só neste arquivo.
 *
 * Funções puras, sem rede: testadas em tests/unit/official-data.test.js.
 */

// ---------- Normalização ----------

/** [{ teamNumber, nameShort, nameFull, city, ... }] → [{ teamNumber, name, city }] */
export function normalizeTeams(raw = []) {
  return raw
    .filter((t) => Number.isInteger(t?.teamNumber))
    .map((t) => ({
      teamNumber: t.teamNumber,
      name: (t.nameShort || t.nameFull || '').trim(),
      city: [t.city, t.stateProv].filter(Boolean).join(', '),
    }))
    .sort((a, b) => a.teamNumber - b.teamNumber)
}

/** "Red1" → { alliance: 'red', station: 1 } */
function parseStation(value) {
  const match = /^(red|blue)\s*(\d)$/i.exec(String(value ?? ''))
  return match ? { alliance: match[1].toLowerCase(), station: Number(match[2]) } : null
}

function matchKey(level, number, series = 0) {
  return level === 'qual' ? `qual-${number}` : `playoff-${series}-${number}`
}

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

/**
 * Junta a tabela (quem joga onde) com os resultados (placar).
 * schedule e results: { qual: [...], playoff: [...] } como a ponte devolve.
 *
 * → [{ key, level, number, series, description, startTime,
 *      teams: [{ teamNumber, alliance, station, surrogate, noShow, dq }],
 *      played, score: { red: { total, auto, foul }, blue: {...} } | null }]
 */
export function normalizeMatches(schedule = {}, results = {}) {
  const resultsByKey = new Map()
  for (const level of ['qual', 'playoff']) {
    for (const r of results[level] ?? []) {
      resultsByKey.set(matchKey(level, r.matchNumber, r.series), r)
    }
  }

  const out = []
  for (const level of ['qual', 'playoff']) {
    for (const s of schedule[level] ?? []) {
      if (!Number.isInteger(s?.matchNumber)) continue
      const key = matchKey(level, s.matchNumber, s.series)
      const result = resultsByKey.get(key)
      const teams = (s.teams ?? [])
        .map((t) => {
          const place = parseStation(t.station)
          if (!place || !Number.isInteger(t.teamNumber)) return null
          return {
            teamNumber: t.teamNumber,
            ...place,
            surrogate: t.surrogate === true,
            noShow: t.noShow === true,
            dq: t.dq === true,
          }
        })
        .filter(Boolean)

      const red = num(result?.scoreRedFinal)
      const blue = num(result?.scoreBlueFinal)
      const played = red !== null && blue !== null

      out.push({
        key,
        level,
        number: s.matchNumber,
        series: s.series ?? 0,
        description: s.description ?? '',
        startTime: s.startTime ?? null,
        teams,
        played,
        score: played
          ? {
              red: {
                total: red,
                auto: num(result.scoreRedAuto),
                foul: num(result.scoreRedFoul),
              },
              blue: {
                total: blue,
                auto: num(result.scoreBlueAuto),
                foul: num(result.scoreBlueFoul),
              },
            }
          : null,
      })
    }
  }
  return out
}

/** Ranking oficial: sortOrder1 é a pontuação de ranking (RS) da temporada. */
export function normalizeRankings(raw = []) {
  return raw
    .filter((r) => Number.isInteger(r?.teamNumber) && Number.isInteger(r?.rank))
    .map((r) => ({
      teamNumber: r.teamNumber,
      rank: r.rank,
      rankingScore: num(r.sortOrder1),
      wins: num(r.wins) ?? 0,
      losses: num(r.losses) ?? 0,
      ties: num(r.ties) ?? 0,
      matchesPlayed: num(r.matchesPlayed) ?? 0,
    }))
    .sort((a, b) => a.rank - b.rank)
}

/**
 * Placar detalhado (campos do jogo, ex.: TIPs). Os nomes dos campos mudam a cada
 * temporada, então guardamos TODOS os números e sim/não de cada aliança, sem interpretar.
 * → { 'qual-12': { red: { campo: valor }, blue: {...} } }
 */
export function normalizeScores(raw = []) {
  const out = {}
  for (const score of raw) {
    if (!Number.isInteger(score?.matchNumber)) continue
    const entry = {}
    for (const alliance of score.alliances ?? []) {
      const color = String(alliance.alliance ?? alliance.color ?? '').toLowerCase()
      if (color !== 'red' && color !== 'blue') continue
      const fields = {}
      for (const [name, value] of Object.entries(alliance)) {
        if (name === 'alliance' || name === 'color' || name === 'team') continue
        if (typeof value === 'number' || typeof value === 'boolean') fields[name] = value
      }
      entry[color] = fields
    }
    out[matchKey('qual', score.matchNumber)] = entry
  }
  return out
}

/** "autoTipCount" → "Auto tip count": legível sem conhecer o jogo. */
export function humanizeField(name) {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// ---------- Consultas ----------

/** Equipe numa posição de uma partida classificatória, ou null. */
export function teamAtStation(matches, matchNumber, alliance, station) {
  const match = matches.find((m) => m.level === 'qual' && m.number === matchNumber)
  return (
    match?.teams.find((t) => t.alliance === alliance && t.station === station)?.teamNumber ?? null
  )
}

/** Partidas de uma equipe, na ordem: classificatórias e depois playoffs. */
export function matchesOf(matches, teamNumber) {
  return matches
    .filter((m) => m.teams.some((t) => t.teamNumber === teamNumber))
    .map((m) => {
      const me = m.teams.find((t) => t.teamNumber === teamNumber)
      const other = me.alliance === 'red' ? 'blue' : 'red'
      const partners = m.teams
        .filter((t) => t.alliance === me.alliance && t.teamNumber !== teamNumber)
        .map((t) => t.teamNumber)
      const opponents = m.teams.filter((t) => t.alliance === other).map((t) => t.teamNumber)
      let outcome = null
      if (m.played) {
        const ours = m.score[me.alliance].total
        const theirs = m.score[other].total
        outcome = ours > theirs ? 'win' : ours < theirs ? 'loss' : 'tie'
      }
      return { match: m, alliance: me.alliance, station: me.station, partners, opponents, outcome }
    })
}

/** Próxima partida ainda não jogada de uma equipe, ou null. */
export function nextMatchOf(matches, teamNumber) {
  return matchesOf(matches, teamNumber).find((entry) => !entry.match.played) ?? null
}

// ---------- OPR ----------

/**
 * OPR (Offensive Power Rating): quantos pontos, em média, cada equipe soma à aliança,
 * descontando a força dos parceiros.
 *
 * Cada aliança numa partida vira uma equação: OPR(robô A) + OPR(robô B) = pontos da aliança.
 * Com várias partidas, há mais equações que equipes; o "melhor encaixe" é o de mínimos
 * quadrados: resolver (AᵀA) x = Aᵀb.
 *
 * O "+ λ" na diagonal (ridge) evita divisão por zero no começo do evento, quando duas
 * equipes só jogaram juntas e não dá para separar quem fez o quê: nesse caso o ponto
 * é dividido entre elas.
 *
 * pick(allianceScore) escolhe o que medir: total sem faltas, só AUTO...
 * Só usa classificatórias jogadas. → Map(teamNumber → OPR)
 */
export function computeOpr(matches, pick, lambda = 1e-3) {
  const rows = []
  for (const m of matches) {
    if (m.level !== 'qual' || !m.played) continue
    for (const alliance of ['red', 'blue']) {
      const teams = m.teams.filter((t) => t.alliance === alliance).map((t) => t.teamNumber)
      const value = pick(m.score[alliance])
      if (teams.length && value !== null && value !== undefined) rows.push({ teams, value })
    }
  }

  const teams = [...new Set(rows.flatMap((r) => r.teams))].sort((a, b) => a - b)
  const index = new Map(teams.map((t, i) => [t, i]))
  const n = teams.length
  if (!n) return new Map()

  // Monta AᵀA (n×n) e Aᵀb (n) direto, sem guardar A.
  const ata = Array.from({ length: n }, () => new Array(n).fill(0))
  const atb = new Array(n).fill(0)
  for (const { teams: rowTeams, value } of rows) {
    const ids = rowTeams.map((t) => index.get(t))
    for (const i of ids) {
      atb[i] += value
      for (const j of ids) ata[i][j] += 1
    }
  }
  for (let i = 0; i < n; i += 1) ata[i][i] += lambda

  const solution = solveLinear(ata, atb)
  return new Map(teams.map((t, i) => [t, solution[i]]))
}

/** Eliminação de Gauss com pivotamento parcial. Modifica as cópias, não a entrada. */
function solveLinear(matrix, vector) {
  const n = vector.length
  const a = matrix.map((row, i) => [...row, vector[i]])
  for (let col = 0; col < n; col += 1) {
    let pivot = col
    for (let r = col + 1; r < n; r += 1) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    }
    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    for (let r = col + 1; r < n; r += 1) {
      const factor = a[r][col] / a[col][col]
      for (let c = col; c <= n; c += 1) a[r][c] -= factor * a[col][c]
    }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r -= 1) {
    let sum = a[r][n]
    for (let c = r + 1; c < n; c += 1) sum -= a[r][c] * x[c]
    x[r] = sum / a[r][r]
  }
  return x
}

/**
 * Correções seguras de equipe: { id do relatório → equipe da tabela }.
 * Só para erros de digitação evidentes (número fora do evento).
 */
export function typoCorrections(check) {
  return new Map(
    check.wrongTeam.filter((w) => w.likelyTypo && w.reportId).map((w) => [w.reportId, w.expected]),
  )
}

/** Pontos da aliança sem as faltas recebidas do adversário. */
export const nonPenaltyPoints = (score) =>
  score.total === null ? null : score.total - (score.foul ?? 0)

// ---------- Conferência ----------

/**
 * Compara os relatórios dos scouters com a tabela oficial, só em classificatórias JÁ jogadas.
 *
 * - wrongTeam: relatório numa posição em que a tabela diz outra equipe.
 *   likelyTypo = o número anotado nem está inscrito no evento (eventTeams): quase certo que
 *   foi erro de digitação, e a dashboard pode contar o relatório para a equipe da tabela.
 *   Se as duas equipes estão inscritas, não dá para saber quem errou: só avisa.
 * - missing: robô que jogou e ninguém anotou.
 * → { wrongTeam: [...], missing: [...], covered, total }
 */
export function checkReports(matches, reports, eventTeams = new Set()) {
  const byPlace = new Map()
  for (const r of reports) {
    byPlace.set(`${r.matchNumber}:${r.alliance}:${r.station}`, r)
  }

  const wrongTeam = []
  const missing = []
  let total = 0
  let covered = 0

  for (const m of matches) {
    if (m.level !== 'qual' || !m.played) continue
    for (const t of m.teams) {
      total += 1
      const report = byPlace.get(`${m.number}:${t.alliance}:${t.station}`)
      if (!report) {
        missing.push({
          matchNumber: m.number,
          alliance: t.alliance,
          station: t.station,
          teamNumber: t.teamNumber,
        })
      } else if (report.teamNumber !== t.teamNumber) {
        covered += 1
        wrongTeam.push({
          reportId: report.id,
          likelyTypo: eventTeams.size > 0 && !eventTeams.has(report.teamNumber),
          matchNumber: m.number,
          alliance: t.alliance,
          station: t.station,
          expected: t.teamNumber,
          reported: report.teamNumber,
          scouter: report.scouter ?? '',
        })
      } else {
        covered += 1
      }
    }
  }
  return { wrongTeam, missing, covered, total }
}
