import { createContext, useContext } from 'react'

/**
 * Estado da sessão compartilhado com o app inteiro.
 *
 * status:
 *   'unconfigured' → variáveis do Firebase não preenchidas
 *   'loading'      → verificando login no aparelho
 *   'guest'        → ainda não entrou na equipe
 *   'member'       → liberado para usar o app
 */
export const SessionContext = createContext(null)

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>')
  }
  return session
}
