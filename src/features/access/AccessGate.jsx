import JoinTeamPage from './JoinTeamPage.jsx'
import SetupMissingPage from './SetupMissingPage.jsx'
import { useSession } from './session-context.js'

/**
 * Porteiro do app: só mostra o conteúdo (children) para quem já entrou na equipe.
 */
export default function AccessGate({ children }) {
  const { status } = useSession()

  if (status === 'unconfigured') return <SetupMissingPage />
  if (status === 'loading') {
    return (
      <div className="center-screen" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="muted">Carregando…</span>
      </div>
    )
  }
  if (status === 'guest') return <JoinTeamPage />

  return children
}
