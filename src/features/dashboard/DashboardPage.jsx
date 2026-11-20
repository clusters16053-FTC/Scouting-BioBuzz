import ComingSoon from '../../components/ComingSoon.jsx'

export default function DashboardPage() {
  return (
    <ComingSoon title="Dashboard" stage={6}>
      <p>Ranking de equipes, médias por fase e comparação lado a lado.</p>
      <p className="muted">Atualiza sozinho quando chegam novos relatórios.</p>
    </ComingSoon>
  )
}
