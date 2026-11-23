import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase.js'
import { paths } from '../../lib/db-paths.js'

/**
 * Relatórios de partida e de pit do evento, em TEMPO REAL.
 *
 * onSnapshot "escuta" a coleção: a primeira resposta traz tudo e, depois disso,
 * cada relatório novo que chega faz a função rodar de novo — a tela atualiza sozinha.
 * Sem internet, o Firestore responde com o que tem no cache do aparelho
 * (metadata.fromCache = true), e a tela avisa que pode estar desatualizada.
 *
 * Quem usa este hook deve recriar o componente quando o evento mudar
 * (key={eventId}), para não misturar dados de dois eventos.
 */
export function useEventData(eventId) {
  const [state, setState] = useState({
    status: 'loading',
    matches: [],
    pits: [],
    fromCache: false,
    updatedAt: null,
    error: null,
  })

  useEffect(() => {
    const latest = { matches: null, pits: null, matchesCache: false, pitsCache: false }

    function publish() {
      if (!latest.matches || !latest.pits) return // espera as duas coleções
      setState({
        status: 'ready',
        matches: latest.matches,
        pits: latest.pits,
        fromCache: latest.matchesCache || latest.pitsCache,
        updatedAt: Date.now(),
        error: null,
      })
    }

    function listen(path, key) {
      return onSnapshot(
        collection(db, path),
        { includeMetadataChanges: true },
        (snapshot) => {
          latest[key] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          latest[`${key}Cache`] = snapshot.metadata.fromCache
          publish()
        },
        (error) => setState((current) => ({ ...current, status: 'error', error })),
      )
    }

    const stopMatches = listen(paths.matchReports(eventId), 'matches')
    const stopPits = listen(paths.pitReports(eventId), 'pits')
    return () => {
      stopMatches()
      stopPits()
    }
  }, [eventId])

  return state
}
