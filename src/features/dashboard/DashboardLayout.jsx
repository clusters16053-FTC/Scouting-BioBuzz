import { useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import Icon from '../../components/Icon.jsx'
import RequireEvent from '../event/RequireEvent.jsx'
import { buildEventSummary } from './analytics.js'
import TeamSearch from './components/TeamSearch.jsx'
import { useEventData } from './use-event-data.js'
import { useWatchlist } from './watchlist-service.js'
import './dashboard.css'

/**
 * Abas da dashboard. match diz em quais endereços a aba fica marcada:
 * a ficha da equipe (/dashboard/equipe/123) é aberta a partir de "Equipes".
 * short: nome curto para o celular, onde as 4 abas precisam caber numa linha.
 */
const TABS = [
  {
    to: '/dashboard',
    label: 'Visão geral',
    short: 'Geral',
    match: (path) => path === '/dashboard',
  },
  {
    to: '/dashboard/equipes',
    label: 'Equipes',
    match: (path) => path.startsWith('/dashboard/equipe'),
  },
  {
    to: '/dashboard/comparar',
    label: 'Comparar',
    match: (path) => path.startsWith('/dashboard/comparar'),
  },
  {
    to: '/dashboard/partida',
    label: 'Próxima partida',
    short: 'Próxima',
    match: (path) => path.startsWith('/dashboard/partida'),
  },
]

/**
 * Casca da dashboard: busca os dados do evento UMA vez e entrega para as telas
 * (visão geral, equipes, ficha, comparar, próxima partida) via contexto do <Outlet>.
 * Também guarda a busca do topo e as favoritas compartilhadas.
 */
export default function DashboardLayout() {
  return (
    <RequireEvent>{(eventId) => <EventDashboard key={eventId} eventId={eventId} />}</RequireEvent>
  )
}

function EventDashboard({ eventId }) {
  const data = useEventData(eventId)
  const watchlist = useWatchlist(eventId)
  const navigate = useNavigate()
  const pathname = useLocation().pathname.replace(/\/$/, '')
  const summary = useMemo(
    () => buildEventSummary(data.matches, data.pits),
    [data.matches, data.pits],
  )

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__title">
          <h1>Dashboard</h1>
          <SyncStatus data={data} overview={summary.overview} />
        </div>
        <TeamSearch
          teams={summary.teams}
          shortcut
          onPick={(team) => navigate(`/dashboard/equipe/${team.teamNumber}`)}
        />
        <nav className="dashboard-tabs" aria-label="Telas da dashboard">
          {TABS.map((tab) => {
            const active = tab.match(pathname)
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={active ? 'active' : undefined}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.short ? tab.label : undefined}
              >
                {tab.short ? (
                  <>
                    <span className="tab-label--long" aria-hidden="true">
                      {tab.label}
                    </span>
                    <span className="tab-label--short" aria-hidden="true">
                      {tab.short}
                    </span>
                  </>
                ) : (
                  tab.label
                )}
              </Link>
            )
          })}
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
        <Outlet context={{ eventId, summary, watchlist }} />
      )}
    </section>
  )
}

/**
 * "Ao vivo" quando os dados vêm do servidor; aviso quando vêm do cache do aparelho.
 * Junto, o tamanho da base: quanto mais partidas, mais dá pra confiar nas médias.
 */
function SyncStatus({ data, overview }) {
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
      <span>
        Ao vivo às {time}
        {overview.reportCount > 0 && (
          <span className="sync-status__base">
            . Base: {overview.teamCount} equipes, {overview.matchCount} partidas e{' '}
            {overview.pitCount} pits
          </span>
        )}
      </span>
    </p>
  )
}
