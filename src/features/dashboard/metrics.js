/**
 * Métricas da dashboard num lugar só: nome, formato e se maior ou menor é melhor.
 *
 * Tabela, líderes, ficha da equipe e comparação leem daqui. Assim "tempo de ciclo:
 * menor é melhor" é dito uma vez, e não repetido (e esquecido) em cada tela.
 *
 * Tudo aqui é função pura sobre o resumo de summarizeTeam(): fácil de testar.
 */
import { formatNumber, formatRate } from './analytics.js'

/** Com menos partidas que isso, a média ainda balança muito: a tela avisa "poucos dados". */
export const RELIABLE_MATCHES = 3

const formatSeconds = (value) =>
  value === null || value === undefined ? '—' : `${formatNumber(value)} s`
const formatOrdinal = (value) => (value === null || value === undefined ? '—' : `${value}º`)
const formatInteger = (value) => (value === null || value === undefined ? '—' : String(value))

/**
 * better: 'higher' | 'lower' | null (null = não existe "melhor", ex.: jogar defesa)
 * official: vem dos resultados oficiais da FIRST (vale mesmo sem relatório nosso).
 */
export const METRICS = Object.freeze({
  officialRank: {
    label: 'Ranking oficial',
    short: 'Rank',
    hint: 'Posição no ranking oficial do evento (FIRST)',
    format: formatOrdinal,
    better: 'lower',
    official: true,
  },
  opr: {
    label: 'OPR',
    short: 'OPR',
    hint: 'Pontos que a equipe soma à aliança por partida, sem faltas (resultados oficiais)',
    format: formatNumber,
    better: 'higher',
    official: true,
  },
  autoOpr: {
    label: 'OPR no AUTO',
    short: 'OPR AUTO',
    hint: 'Pontos de AUTO que a equipe soma à aliança (resultados oficiais)',
    format: formatNumber,
    better: 'higher',
    official: true,
  },
  avgTotalHits: {
    label: 'Acertos no CELL',
    short: 'CELL',
    hint: 'POLLEN acertados por partida (AUTO + TELEOP)',
    format: formatNumber,
    better: 'higher',
  },
  accuracy: {
    label: 'Precisão',
    short: 'Precisão',
    hint: 'Acertos ÷ POLLEN lançados',
    format: formatRate,
    better: 'higher',
  },
  avgCycleSeconds: {
    label: 'Tempo de ciclo',
    short: 'Ciclo',
    hint: 'Coletar e ficar pronto para atirar (sem o preload)',
    format: formatSeconds,
    better: 'lower',
  },
  avgTeleopCycles: {
    label: 'Ciclos no TELEOP',
    short: 'Ciclos',
    hint: 'Ciclos por partida no TELEOP',
    format: formatNumber,
    better: 'higher',
  },
  minHits: {
    label: 'Pior partida',
    short: 'Piso',
    hint: 'Menor número de acertos numa partida: o mínimo que dá para esperar',
    format: formatInteger,
    better: 'higher',
  },
  avgLeaveParkPoints: {
    label: 'LEAVE+PARK',
    short: 'L+P',
    hint: 'Pontos de LEAVE e PARK por partida (o SWARM pede 16 da aliança)',
    format: formatNumber,
    better: 'higher',
  },
  avgFlowerPieces: {
    label: 'FLOWER',
    short: 'FLOWER',
    hint: 'NECTAR + POLLEN na FLOWER por partida',
    format: formatNumber,
    better: 'higher',
  },
  avgGarden: {
    label: 'GARDEN',
    short: 'GARDEN',
    hint: 'POLLEN e NECTAR no GARDEN por partida',
    format: formatNumber,
    better: 'higher',
  },
  defensePlayedRate: {
    label: 'Faz defesa',
    short: 'Defesa',
    hint: 'Em quantas partidas jogou defesa',
    format: formatRate,
    better: null,
  },
  issueRate: {
    label: 'Problemas',
    short: 'Probl.',
    hint: 'Em quantas partidas parou, tombou ou desconectou',
    format: formatRate,
    better: 'lower',
  },
  avgDriverRating: {
    label: 'Pilotagem',
    short: 'Piloto',
    hint: 'Nota média de 1 a 5 dada pelos scouters',
    format: formatNumber,
    better: 'higher',
  },
})

/** Colunas da tabela de equipes, na ordem em que aparecem. Nome, formato e direção vêm de METRICS. */
export const TABLE_COLUMNS = [
  'avgTotalHits',
  'accuracy',
  'avgCycleSeconds',
  'avgTeleopCycles',
  'minHits',
  'avgLeaveParkPoints',
  'avgFlowerPieces',
  'avgGarden',
  'defensePlayedRate',
  'issueRate',
  'avgDriverRating',
]

/** Categorias que aparecem em "Líderes" e no card da nossa equipe. */
export const LEADER_METRICS = [
  'avgTotalHits',
  'accuracy',
  'avgCycleSeconds',
  'minHits',
  'avgFlowerPieces',
  'avgLeaveParkPoints',
]

export function isLowSample(team) {
  return team.played < RELIABLE_MATCHES
}

/**
 * Categorias da Visão geral. Com resultados oficiais, o OPR entra na frente e "Pior partida"
 * sai (continua na ficha e na comparação): ficam sempre 6, que fecham a grade de 3 colunas.
 */
export function leaderMetricsFor(teams) {
  return hasMetric(teams, 'opr')
    ? ['opr', ...LEADER_METRICS.filter((key) => key !== 'minHits')]
    : LEADER_METRICS
}

/** Alguma equipe tem esse número? (as métricas oficiais só existem com a API ligada) */
export function hasMetric(teams, key) {
  return teams.some((t) => t[key] !== null && t[key] !== undefined)
}

function hasValue(value) {
  return value !== null && value !== undefined && !Number.isNaN(value)
}

/** Comparador "melhor primeiro" para uma métrica. */
function compareBest(key) {
  const sign = METRICS[key].better === 'lower' ? 1 : -1
  return (a, b) => sign * (a[key] - b[key])
}

/**
 * Ranking de uma métrica: só equipes que jogaram e têm valor.
 * Empate divide a posição (1º, 2º, 2º, 4º), como em qualquer classificação.
 * → [{ team, value, rank }]
 */
export function rankBy(teams, key) {
  if (!METRICS[key]?.better) return []
  const official = METRICS[key].official
  const eligible = teams
    .filter((t) => (official || t.played > 0) && hasValue(t[key]))
    .sort(compareBest(key))
  let rank = 0
  return eligible.map((team, index) => {
    if (index === 0 || team[key] !== eligible[index - 1][key]) rank = index + 1
    return { team, value: team[key], rank }
  })
}

/**
 * Posição de uma equipe em uma métrica.
 * share vai de 0 (pior do evento) a 1 (melhor): é o que a barrinha da ficha desenha.
 * → { rank, total, share } ou null se a equipe não entra no ranking.
 */
export function positionOf(teams, key, teamNumber) {
  const ranking = rankBy(teams, key)
  const entry = ranking.find((r) => r.team.teamNumber === teamNumber)
  if (!entry) return null
  const values = ranking.map((r) => r.value)
  const best = values[0]
  const worst = values[values.length - 1]
  const share = best === worst ? 1 : Math.abs(entry.value - worst) / Math.abs(best - worst)
  return { rank: entry.rank, total: ranking.length, share }
}

/** As n primeiras de uma métrica, marcando quem tem poucos dados. */
export function leadersOf(teams, key, n = 3) {
  return rankBy(teams, key)
    .slice(0, n)
    .map((entry) => ({
      ...entry,
      // "Poucos dados" fala dos NOSSOS relatórios; não vale para números oficiais.
      lowSample: !METRICS[key].official && isLowSample(entry.team),
    }))
}

/**
 * Atalhos da aba Equipes: cada um é um filtro + uma ordenação.
 * filter recebe (team, context) — context.watchlist é o Set das favoritas.
 */
export const PRESETS = [
  { id: 'todas', label: 'Todas', sort: 'avgTotalHits', filter: () => true },
  {
    id: 'favoritas',
    label: '★ Favoritas',
    sort: 'avgTotalHits',
    filter: (t, ctx) => ctx.watchlist.has(t.teamNumber),
  },
  { id: 'cell', label: 'Melhores no CELL', sort: 'avgTotalHits', filter: (t) => t.played > 0 },
  {
    id: 'precisao',
    label: 'Mais precisos',
    sort: 'accuracy',
    filter: (t) => hasValue(t.accuracy),
  },
  {
    id: 'ciclo',
    label: 'Ciclo rápido',
    sort: 'avgCycleSeconds',
    filter: (t) => hasValue(t.avgCycleSeconds),
  },
  {
    id: 'flower',
    label: 'Pontuam na FLOWER',
    sort: 'avgFlowerPieces',
    filter: (t) => (t.avgFlowerPieces ?? 0) > 0 || (t.pit?.flowerPlaces?.length ?? 0) > 0,
  },
  {
    id: 'defesa',
    label: 'Fazem defesa',
    sort: 'defensePlayedRate',
    filter: (t) => (t.defensePlayedRate ?? 0) >= 0.5,
  },
  {
    id: 'confiaveis',
    label: 'Sem problemas',
    sort: 'avgTotalHits',
    filter: (t) => t.played > 0 && t.issueRate === 0,
  },
  { id: 'sem-pit', label: 'Sem entrevista de pit', sort: 'teamNumber', filter: (t) => !t.pit },
]

/**
 * Ordena com valores vazios sempre no fim, em qualquer direção.
 * direction: 'asc' | 'desc'
 */
export function sortTeams(teams, key, direction) {
  return [...teams].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (!hasValue(va) && !hasValue(vb)) return a.teamNumber - b.teamNumber
    if (!hasValue(va)) return 1
    if (!hasValue(vb)) return -1
    return direction === 'asc' ? va - vb : vb - va
  })
}

/** Direção padrão de uma coluna: do melhor para o pior. */
export function defaultDirection(key) {
  if (key === 'teamNumber') return 'asc'
  return METRICS[key]?.better === 'lower' ? 'asc' : 'desc'
}

export function applyPreset(teams, presetId, context) {
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]
  const filtered = teams.filter((t) => preset.filter(t, context))
  return sortTeams(filtered, preset.sort, defaultDirection(preset.sort))
}

/**
 * Na comparação, quais posições têm o melhor valor da linha.
 * Sem destaque quando a métrica não tem "melhor", quando há menos de 2 valores
 * ou quando todos empatam (destacar todo mundo não diz nada).
 * → Set de índices
 */
export function bestIndexes(values, better) {
  const present = values.map((v, i) => [v, i]).filter(([v]) => hasValue(v))
  if (!better || present.length < 2) return new Set()
  const pick = better === 'lower' ? Math.min : Math.max
  const best = pick(...present.map(([v]) => v))
  if (present.every(([v]) => v === best)) return new Set()
  return new Set(present.filter(([v]) => v === best).map(([, i]) => i))
}

/**
 * Busca de equipe: número começando com o texto ou nome contendo o texto.
 * Números exatos vêm primeiro.
 */
export function searchTeams(teams, query, limit = 6) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored = teams
    .map((t) => {
      const number = String(t.teamNumber)
      if (number === q) return [0, t]
      if (number.startsWith(q)) return [1, t]
      if (t.teamName?.toLowerCase().includes(q)) return [2, t]
      return null
    })
    .filter(Boolean)
  return scored
    .sort((a, b) => a[0] - b[0] || a[1].teamNumber - b[1].teamNumber)
    .slice(0, limit)
    .map(([, t]) => t)
}
