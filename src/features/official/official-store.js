import { useEffect, useState } from 'react'
import { createLocalStore } from '../../lib/local-store.js'
import {
  normalizeMatches,
  normalizeRankings,
  normalizeScores,
  normalizeTeams,
} from './official-data.js'

/**
 * Dados oficiais da FIRST guardados NO APARELHO, um pacote por evento.
 *
 * Com internet: busca na ponte (/api/ftc) e guarda.
 * Sem internet (perto da arena): o app usa o último pacote guardado, e mostra a hora dele.
 *
 * status do pacote:
 *   'empty'      → ainda não buscou nada
 *   'ok'         → dados oficiais disponíveis
 *   'off'        → a integração não está configurada (sem token na Vercel)
 *   'not-found'  → a FIRST não conhece esse código de evento (ex.: scrimmage)
 *   'error'      → a última tentativa falhou (os dados antigos, se houver, continuam valendo)
 */
const EMPTY = Object.freeze({
  status: 'empty',
  teams: [],
  matches: [],
  rankings: [],
  scores: {},
  fetchedAt: null,
  error: null,
})

/** Só busca de novo sozinho se o pacote tiver mais que isso. */
const STALE_MS = 2 * 60 * 1000

const stores = new Map()
const inFlight = new Map()

function storeFor(eventId) {
  if (!stores.has(eventId)) {
    stores.set(eventId, createLocalStore(`scouting:official:${eventId}`, EMPTY))
  }
  return stores.get(eventId)
}

async function fetchResource(resource, eventId) {
  const params = new URLSearchParams({ resource })
  if (eventId) params.set('event', eventId)
  const response = await fetch(`/api/ftc?${params}`)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error ?? `HTTP ${response.status}`)
    error.status = response.status
    error.code = body.error
    throw error
  }
  return body.data
}

/**
 * Busca tudo do evento e guarda. Várias telas pedindo ao mesmo tempo = uma busca só.
 * Equipes e tabela são essenciais; ranking, resultados e placar detalhado podem
 * ainda não existir no começo do evento, e aí ficam vazios sem derrubar o resto.
 */
export function refreshOfficial(eventId) {
  if (inFlight.has(eventId)) return inFlight.get(eventId)
  const store = storeFor(eventId)

  const run = (async () => {
    try {
      const [teams, schedule] = await Promise.all([
        fetchResource('teams', eventId),
        fetchResource('schedule', eventId),
      ])
      const optional = (resource, fallback) =>
        fetchResource(resource, eventId).catch(() => fallback)
      const [results, rankings, scores] = await Promise.all([
        optional('matches', { qual: [], playoff: [] }),
        optional('rankings', []),
        optional('scores', []),
      ])
      store.set({
        status: 'ok',
        teams: normalizeTeams(teams),
        matches: normalizeMatches(schedule, results),
        rankings: normalizeRankings(rankings),
        scores: normalizeScores(scores),
        fetchedAt: Date.now(),
        error: null,
      })
    } catch (error) {
      const status =
        error.code === 'nao-configurado' ? 'off' : error.status === 404 ? 'not-found' : 'error'
      store.set((current) => ({
        ...current,
        // Falha de rede não apaga os dados que já estavam guardados.
        status: current.fetchedAt && status === 'error' ? 'ok' : status,
        error: error.code ?? error.message,
        lastAttempt: Date.now(),
      }))
    } finally {
      inFlight.delete(eventId)
    }
  })()

  inFlight.set(eventId, run)
  return run
}

/**
 * Dados oficiais do evento, com busca automática quando há internet.
 * autoRefreshMs: de quanto em quanto tempo atualizar sozinho enquanto a tela está aberta
 * (a dashboard usa; o formulário não precisa).
 */
export function useOfficialData(eventId, { autoRefreshMs = 0 } = {}) {
  const store = storeFor(eventId)
  const data = store.useValue()
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    await refreshOfficial(eventId)
    setRefreshing(false)
  }

  useEffect(() => {
    function maybeRefresh() {
      const current = store.get()
      if (!navigator.onLine || current.status === 'off' || current.status === 'not-found') return
      const last = current.lastAttempt ?? current.fetchedAt ?? 0
      if (Date.now() - last > STALE_MS) refreshOfficial(eventId)
    }
    maybeRefresh()
    if (!autoRefreshMs) return undefined
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshOfficial(eventId)
    }, autoRefreshMs)
    return () => clearInterval(timer)
  }, [eventId, autoRefreshMs, store])

  return { ...data, refresh, refreshing }
}

// ---------- Lista de eventos oficiais (Brasil) ----------

const eventsStore = createLocalStore('scouting:official-events', { events: [], fetchedAt: null })
const EVENTS_STALE_MS = 24 * 60 * 60 * 1000

/**
 * Eventos oficiais do Brasil na temporada, para escolher o evento sem digitar código.
 * → { events: [{ code, name, city, dateStart, dateEnd }], loading, error }
 */
export function useOfficialEvents(enabled) {
  const cached = eventsStore.useValue()
  const [error, setError] = useState(null)
  // Hora em que a tela abriu (lida uma vez só, não a cada desenho da tela).
  const [openedAt] = useState(() => Date.now())
  // Precisa buscar: lista vazia ou velha. Enquanto busca, "carregando" é só isso + sem erro.
  const stale = !cached.fetchedAt || openedAt - cached.fetchedAt > EVENTS_STALE_MS
  const shouldFetch = enabled && stale

  useEffect(() => {
    if (!shouldFetch || !navigator.onLine) return undefined
    let cancelled = false
    fetchResource('events')
      .then((events) => {
        if (cancelled) return
        eventsStore.set({
          events: events
            .filter((e) => e?.code)
            .map((e) => ({
              code: String(e.code).toUpperCase(),
              name: e.name ?? e.code,
              city: [e.city, e.stateprov ?? e.stateProv].filter(Boolean).join(', '),
              dateStart: e.dateStart ?? null,
              dateEnd: e.dateEnd ?? null,
            }))
            .sort((a, b) => String(a.dateStart).localeCompare(String(b.dateStart))),
          fetchedAt: Date.now(),
        })
        setError(null)
      })
      .catch((failure) => {
        if (!cancelled) setError(failure.code ?? failure.message)
      })
    return () => {
      cancelled = true
    }
  }, [shouldFetch])

  return { events: cached.events, loading: shouldFetch && !error, error }
}

/** Ligação exigida pela FIRST em telas que mostram os dados dela. */
export const FIRST_API_INFO_URL = 'https://ftc-events.firstinspires.org/services/API'
