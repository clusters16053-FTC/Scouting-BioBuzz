/**
 * Número em destaque com a posição no evento.
 *
 * position: { rank, total, share } de positionOf() — share vai de 0 (pior) a 1 (melhor).
 * A barrinha mostra onde a equipe está entre o pior e o melhor do evento;
 * o texto "3º de 16" diz o mesmo sem depender da barra.
 */
export default function RankTile({ label, value, detail, position, emphasis = false }) {
  return (
    <div className={`stat-tile rank-tile ${emphasis ? 'stat-tile--emphasis' : ''}`}>
      <dt>{label}</dt>
      <dd>
        <span className="stat-tile__value">{value}</span>
        {position && (
          <span className="rank-tile__position">
            <span className="rank-tile__rank">
              {position.rank}º de {position.total}
            </span>
            <span className="rank-tile__track" aria-hidden="true">
              <span className="rank-tile__dot" style={{ left: `${position.share * 100}%` }} />
            </span>
          </span>
        )}
        {detail && <span className="stat-tile__detail">{detail}</span>}
      </dd>
    </div>
  )
}
