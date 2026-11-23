import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../../lib/firebase.js'
import { paths } from '../../lib/db-paths.js'

/**
 * Foto do pit, baixada só quando a ficha da equipe é aberta.
 * Fica fora da lista principal para o ranking não baixar dezenas de fotos.
 *
 * Retorna: undefined (carregando), null (sem foto) ou o data URL da imagem.
 */
export function usePitPhoto(eventId, pitReport) {
  const pitId = pitReport?.hasPhoto ? pitReport.id : null
  const [photo, setPhoto] = useState({ pitId: null, image: undefined })

  useEffect(() => {
    if (!pitId) return undefined
    let cancelled = false
    getDoc(doc(db, paths.pitPhotos(eventId), pitId))
      .then((snapshot) => {
        if (!cancelled) setPhoto({ pitId, image: snapshot.exists() ? snapshot.data().image : null })
      })
      .catch(() => {
        if (!cancelled) setPhoto({ pitId, image: null })
      })
    return () => {
      cancelled = true
    }
  }, [eventId, pitId])

  if (!pitId) return null
  return photo.pitId === pitId ? photo.image : undefined
}
