import { useEffect, useState } from 'react'

/**
 * Hora atual (epoch ms) que se atualiza sozinha, para cronômetros na tela.
 * Só fica "tiquetaqueando" quando `active` é verdadeiro, para não gastar bateria à toa.
 */
export function useNow(active, intervalMs = 200) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])

  return now
}

/** Vibração curta de confirmação (Android). No iPhone simplesmente não faz nada. */
export function vibrate(ms = 30) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // Alguns navegadores bloqueiam vibração: ignora.
  }
}
