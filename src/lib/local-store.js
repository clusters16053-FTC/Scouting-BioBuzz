import { useSyncExternalStore } from 'react'

/**
 * Valor salvo no localStorage do aparelho e compartilhado entre componentes.
 * Quando um componente muda o valor, todos que usam o mesmo store atualizam.
 *
 * Uso:
 *   const eventStore = createLocalStore('scouting:event', '')
 *   const event = eventStore.useValue()
 *   eventStore.set('BRCEFOR')
 */
export function createLocalStore(key, initialValue) {
  const listeners = new Set()
  let cache = read()

  function read() {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initialValue : JSON.parse(raw)
    } catch {
      // Navegação privada ou armazenamento cheio: segue só em memória.
      return initialValue
    }
  }

  function get() {
    return cache
  }

  function set(value) {
    cache = typeof value === 'function' ? value(cache) : value
    try {
      if (cache === undefined || cache === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(cache))
    } catch {
      // Ignora: o valor continua disponível em memória nesta sessão.
    }
    listeners.forEach((listener) => listener())
  }

  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function useValue() {
    return useSyncExternalStore(subscribe, get, () => initialValue)
  }

  return { get, set, useValue }
}
