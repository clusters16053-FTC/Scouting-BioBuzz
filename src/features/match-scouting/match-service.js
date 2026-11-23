import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase.js'
import { paths } from '../../lib/db-paths.js'
import { toMatchDocument } from './match-schema.js'

/**
 * Salva o relatório de partida.
 *
 * NÃO espera o servidor de propósito: o Firestore grava no cache do aparelho na hora
 * e envia quando tiver internet. Se esperássemos a promise, offline o botão ficaria
 * "salvando" para sempre. O acompanhamento de pendentes entra na etapa 5.
 */
export function saveMatchReport(eventId, draft, { uid, scouter }) {
  const ref = doc(db, paths.matchReports(eventId), draft.id)
  const data = toMatchDocument(draft, { uid, scouter, syncedAt: serverTimestamp() })

  setDoc(ref, data).catch((error) => {
    console.error('[scouting] O servidor recusou o relatório de partida', draft.id, error)
  })
}
