import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './Layout.jsx'
import HomePage from '../features/home/HomePage.jsx'
import MatchScoutingPage from '../features/match-scouting/MatchScoutingPage.jsx'
import PitScoutingPage from '../features/pit-scouting/PitScoutingPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import NotFoundPage from '../features/home/NotFoundPage.jsx'

/**
 * Mapa de rotas do app. Toda tela nova entra aqui.
 * O <Layout> envolve todas as rotas e desenha cabeçalho + navegação.
 */
export default function App() {
  return (
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
  )
}
