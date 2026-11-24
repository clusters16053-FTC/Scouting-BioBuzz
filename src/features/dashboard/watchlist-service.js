import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase.js'
import { paths } from '../../lib/db-paths.js'
import { useSession } from '../access/session-context.js'
import { toWatchlistDocument } from './watchlist-schema.js'

/**
 * Favoritas compartilhadas do evento, em tempo real.
 *
 * Marcar e desmarcar não esperam o servidor (funciona offline, como os relatórios):
 * o Firestore aplica na hora no aparelho e sincroniza quando a internet voltar.
 *
 * → { teams: Set<number>, toggle(teamNumber) }
 */
export function useWatchlist(eventId) {
  const { user, member } = useSession()
  const [teams, setTeams] = useState(() => new Set())

  useEffect(
    () =>
      onSnapshot(
        collection(db, paths.watchlist(eventId)),
        (snapshot) => setTeams(new Set(snapshot.docs.map((d) => Number(d.id)))),
        (error) => console.error('[scouting] Não foi possível ler as favoritas', error),
      ),
    [eventId],
  )

  function toggle(teamNumber) {
    const ref = doc(db, paths.watchlist(eventId), String(teamNumber))
    const write = teams.has(teamNumber)
      ? deleteDoc(ref)
      : setDoc(
          ref,
          toWatchlistDocument(teamNumber, {
            uid: user.uid,
            scouter: member?.name ?? '',
            addedAt: serverTimestamp(),
          }),
        )
    write.catch((error) => console.error('[scouting] O servidor recusou a favorita', error))
  }

  return { teams, toggle }
}
