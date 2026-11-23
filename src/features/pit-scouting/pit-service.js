import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase.js'
import { paths } from '../../lib/db-paths.js'
import { toPitDocument } from './pit-schema.js'

/**
 * Salva a entrevista e, se tiver, a foto em documento separado (mesmo ID).
 * Assim como na partida, não espera o servidor: funciona offline.
 */
export function savePitReport(eventId, draft, { uid, scouter }) {
  const report = toPitDocument(draft, { uid, scouter, syncedAt: serverTimestamp() })

  setDoc(doc(db, paths.pitReports(eventId), draft.id), report).catch((error) => {
    console.error('[scouting] O servidor recusou o relatório de pit', draft.id, error)
  })

  if (draft.photo) {
    setDoc(doc(db, paths.pitPhotos(eventId), draft.id), {
      image: draft.photo,
      createdBy: uid,
    }).catch((error) => {
      console.error('[scouting] O servidor recusou a foto do pit', draft.id, error)
    })
  }
}
