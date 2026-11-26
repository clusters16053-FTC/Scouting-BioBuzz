import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import Layout from './Layout.jsx'
import HomePage from '../features/home/HomePage.jsx'
import MatchScoutingPage from '../features/match-scouting/MatchScoutingPage.jsx'
import PitScoutingPage from '../features/pit-scouting/PitScoutingPage.jsx'
import DashboardLayout from '../features/dashboard/DashboardLayout.jsx'
import OverviewPage from '../features/dashboard/OverviewPage.jsx'
import TeamsPage from '../features/dashboard/TeamsPage.jsx'
import ComparePage from '../features/dashboard/ComparePage.jsx'
import TeamPage from '../features/dashboard/TeamPage.jsx'
import SimulatePage from '../features/dashboard/SimulatePage.jsx'
import NotFoundPage from '../features/home/NotFoundPage.jsx'
import SessionProvider from '../features/access/SessionProvider.jsx'
import AccessGate from '../features/access/AccessGate.jsx'

/**
 * Raiz do app.
 * - <SessionProvider> descobre quem está usando o aparelho.
 * - <AccessGate> só libera as telas para quem entrou na equipe.
 * - <Routes> é o mapa de telas; toda tela nova entra aqui.
 */
export default function App() {
  return (
    <SessionProvider>
      <AccessGate>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="partida" element={<MatchScoutingPage />} />
              <Route path="pit" element={<PitScoutingPage />} />
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="equipes" element={<TeamsPage />} />
                <Route path="equipe/:teamNumber" element={<TeamPage />} />
                <Route path="comparar" element={<ComparePage />} />
                <Route path="simular" element={<SimulatePage />} />
                {/* Endereço antigo da aba (links salvos continuam funcionando). */}
                <Route path="partida" element={<Navigate to="/dashboard/simular" replace />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AccessGate>
    </SessionProvider>
  )
}
