/**
 * Ponte entre o app e a API oficial da FIRST (FTC Events API v2.0).
 *
 * Por que existe: a API exige usuário + token, e o token é senha. Se ficasse no código
 * do site, qualquer pessoa copiaria pelo navegador. Aqui ele fica só no servidor
 * (variáveis FTC_API_USERNAME e FTC_API_KEY, SEM o prefixo VITE_).
 *
 * A ponte só aceita uma lista fechada de consultas da temporada atual. Ninguém consegue
 * usar ela para chamar outra coisa em nosso nome.
 *
 * Esta função é pura (recebe env e fetch): roda na Vercel (api/ftc.js), no `npm run dev`
 * (plugin em vite.config.js) e nos testes, sem mudar nada.
 *
 * Documentação da API: https://ftc-events.firstinspires.org/services/API
 */
import { SEASON } from '../src/config/game.js'

export const FTC_API_BASE = 'https://ftc-api.firstinspires.org/v2.0'

/** Código de evento da FIRST: letras e números (ex.: BRFOQ). */
const EVENT_CODE = /^[A-Z0-9]{2,20}$/

/** Por quanto tempo a Vercel pode reaproveitar a resposta (segundos). */
const CACHE = {
  live: 'public, s-maxage=60, stale-while-revalidate=300',
  slow: 'public, s-maxage=3600, stale-while-revalidate=86400',
}

/**
 * Consultas aceitas. Cada uma vira uma ou mais chamadas à API da FIRST.
 * needsEvent: exige ?event=CODIGO.
 */
const RESOURCES = {
  // Eventos da temporada. Filtra o país aqui para não mandar o mundo inteiro pro celular.
  events: { needsEvent: false, cache: 'slow' },
  // Equipes inscritas no evento (a API pagina: juntamos todas as páginas).
  teams: { needsEvent: true, cache: 'slow' },
  // Tabela de partidas (quem joga onde) — classificatórias e playoffs.
  schedule: { needsEvent: true, cache: 'live' },
  // Resultados: placar final, AUTO e faltas de cada aliança.
  matches: { needsEvent: true, cache: 'live' },
  // Ranking oficial do evento.
  rankings: { needsEvent: true, cache: 'live' },
  // Placar detalhado de cada partida (campos do jogo, ex.: TIPs).
  scores: { needsEvent: true, cache: 'live' },
}

const MAX_TEAM_PAGES = 10

function json(status, body, cache) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache ?? 'no-store',
    },
    body: JSON.stringify(body),
  }
}

/** Erro da API da FIRST com o status original (404 = evento não existe, 401 = token). */
class UpstreamError extends Error {
  constructor(status) {
    super(`FIRST respondeu ${status}`)
    this.status = status
  }
}

/**
 * query: { resource, event?, country? }
 * env:   { FTC_API_USERNAME, FTC_API_KEY }
 * → { status, headers, body (texto JSON) }
 */
export async function handleFtcRequest(query, env, fetchImpl = fetch) {
  const resource = RESOURCES[query.resource]
  if (!resource) return json(400, { error: 'resource-invalido' })

  const event = String(query.event ?? '').toUpperCase()
  if (resource.needsEvent && !EVENT_CODE.test(event)) {
    return json(400, { error: 'evento-invalido' })
  }

  if (!env.FTC_API_USERNAME || !env.FTC_API_KEY) {
    // O app trata isso como "integração desligada" e segue funcionando sem os dados oficiais.
    return json(503, { error: 'nao-configurado' })
  }

  const authorization = `Basic ${btoa(`${env.FTC_API_USERNAME}:${env.FTC_API_KEY}`)}`
  const season = SEASON.apiYear

  async function get(path) {
    const response = await fetchImpl(`${FTC_API_BASE}/${season}${path}`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
    })
    if (!response.ok) throw new UpstreamError(response.status)
    return response.json()
  }

  try {
    const data = await load(query.resource, { event, country: query.country, get })
    return json(200, { season, fetchedAt: new Date().toISOString(), data }, CACHE[resource.cache])
  } catch (error) {
    if (error instanceof UpstreamError) {
      const reason =
        error.status === 404
          ? 'nao-encontrado'
          : error.status === 401
            ? 'token-recusado'
            : 'erro-na-first'
      // 401 vira 502 aqui: para o app, o problema é do servidor, não de quem pediu.
      return json(error.status === 404 ? 404 : 502, { error: reason, upstream: error.status })
    }
    return json(502, { error: 'sem-resposta-da-first' })
  }
}

async function load(resource, { event, country, get }) {
  const code = encodeURIComponent(event)

  // Classificatórias são obrigatórias; playoffs podem ainda não existir (início do evento).
  async function byLevel(path, key) {
    const qual = await get(`${path}?tournamentLevel=qual`)
    const playoff = await get(`${path}?tournamentLevel=playoff`).catch(() => ({}))
    return { qual: qual[key] ?? [], playoff: playoff[key] ?? [] }
  }

  switch (resource) {
    case 'events': {
      const { events = [] } = await get('/events')
      const wanted = (country ?? 'Brazil').toLowerCase()
      return wanted === 'all'
        ? events
        : events.filter((e) => String(e.country ?? '').toLowerCase() === wanted)
    }
    case 'teams': {
      const teams = []
      for (let page = 1; page <= MAX_TEAM_PAGES; page += 1) {
        const result = await get(`/teams?eventCode=${code}&page=${page}`)
        teams.push(...(result.teams ?? []))
        if (!result.pageTotal || page >= result.pageTotal) break
      }
      return teams
    }
    case 'schedule':
      return byLevel(`/schedule/${code}`, 'schedule')
    case 'matches':
      return byLevel(`/matches/${code}`, 'matches')
    case 'rankings': {
      const { rankings = [] } = await get(`/rankings/${code}`)
      return rankings
    }
    case 'scores': {
      const { matchScores = [] } = await get(`/scores/${code}/qual`)
      return matchScores
    }
    default:
      throw new Error(`consulta desconhecida: ${resource}`)
  }
}
