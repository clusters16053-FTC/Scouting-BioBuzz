import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './Layout.jsx'
import HomePage from '../features/home/HomePage.jsx'
import MatchScoutingPage from '../features/match-scouting/MatchScoutingPage.jsx'
import PitScoutingPage from '../features/pit-scouting/PitScoutingPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
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
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AccessGate>
    </SessionProvider>
  )
}
