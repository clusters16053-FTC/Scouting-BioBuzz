import { useMemo } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import Icon from '../../components/Icon.jsx'
import RequireEvent from '../event/RequireEvent.jsx'
import { buildEventSummary } from './analytics.js'
import { useEventData } from './use-event-data.js'
import './dashboard.css'

/**
 * Casca da dashboard: busca os dados do evento UMA vez e entrega para as três telas
 * (ranking, ficha da equipe e preparar partida) via contexto do <Outlet>.
 */
export default function DashboardLayout() {
  return (
    <RequireEvent>{(eventId) => <EventDashboard key={eventId} eventId={eventId} />}</RequireEvent>
  )
}

function EventDashboard({ eventId }) {
  const data = useEventData(eventId)
  const { pathname } = useLocation()
  // "Ranking" fica marcado também na ficha da equipe, que é aberta a partir dele.
  const onPrep = pathname.startsWith('/dashboard/partida')
  const summary = useMemo(
    () => buildEventSummary(data.matches, data.pits),
    [data.matches, data.pits],
  )

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <SyncStatus data={data} />
        </div>
        <nav className="dashboard-tabs" aria-label="Telas da dashboard">
          <NavLink to="/dashboard" className={() => (onPrep ? '' : 'active')}>
            Ranking
          </NavLink>
          <NavLink to="/dashboard/partida">Preparar partida</NavLink>
        </nav>
      </header>

      {data.status === 'loading' && (
        <div className="dashboard__loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Carregando relatórios…
        </div>
      )}

      {data.status === 'error' && (
        <p className="form-error" role="alert">
          Não foi possível ler os relatórios ({data.error?.code ?? 'erro desconhecido'}). Confira se
          você entrou na equipe e se as regras do Firebase estão publicadas.
        </p>
      )}

      {data.status === 'ready' &&
        summary.overview.reportCount === 0 &&
        summary.teams.length === 0 && (
          <div className="empty-state">
            <h2>Nenhum relatório em {eventId} ainda</h2>
            <p className="muted">
              Assim que os scouters salvarem partidas ou entrevistas de pit, os números aparecem
              aqui sozinhos.
            </p>
            <Link to="/partida" className="button">
              Registrar uma partida
            </Link>
          </div>
        )}

      {data.status === 'ready' && summary.teams.length > 0 && (
        <Outlet context={{ eventId, summary }} />
      )}
    </section>
  )
}

/** "Ao vivo" quando os dados vêm do servidor; aviso quando vêm do cache do aparelho. */
function SyncStatus({ data }) {
  if (data.status !== 'ready') return null
  const time = new Date(data.updatedAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (data.fromCache) {
    return (
      <p className="sync-status sync-status--cache">
        <Icon name="alert" size={16} />
        Sem conexão: mostrando os dados salvos no aparelho
      </p>
    )
  }
  return (
    <p className="sync-status">
      <span className="live-dot" aria-hidden="true" />
      Ao vivo, atualizado às {time}
    </p>
  )
}
