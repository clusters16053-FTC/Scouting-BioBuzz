import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { auth, isFirebaseConfigured } from '../../lib/firebase.js'
import { fetchMember, joinTeam } from './access-service.js'
import { SessionContext } from './session-context.js'

export default function SessionProvider({ children }) {
  const [state, setState] = useState({
    status: isFirebaseConfigured ? 'loading' : 'unconfigured',
    user: null,
    member: null,
  })

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    // Dispara quando o app abre e sempre que o login muda.
    // Devolve a função que cancela a escuta quando o componente sai da tela.
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: 'guest', user: null, member: null })
        return
      }
      const member = await fetchMember(user.uid)
      setState((prev) => {
        // Se o join() terminou enquanto esta consulta estava em andamento,
        // não deixa uma resposta antiga ("não é membro") desfazer a entrada.
        if (prev.status === 'member' && prev.user?.uid === user.uid) return prev
        return { status: member ? 'member' : 'guest', user, member }
      })
    })
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      async join(form) {
        const member = await joinTeam(form)
        setState({ status: 'member', user: auth.currentUser, member })
      },
    }),
    [state],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
