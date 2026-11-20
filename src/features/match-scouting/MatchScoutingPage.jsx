import ComingSoon from '../../components/ComingSoon.jsx'

export default function MatchScoutingPage() {
  return (
    <ComingSoon title="Scouting de partida" stage={4}>
      <p>Um formulário por robô por partida, dividido em AUTO, TELEOP e último minuto.</p>
      <p className="muted">
        Contadores grandes de acertos/erros no CELL, LEAVE, PARK e peças nas FLOWERS.
      </p>
    </ComingSoon>
  )
}
