/**
 * Número em destaque com rótulo e uma linha de contexto opcional.
 * value já vem formatado (ex.: "7,5", "72%").
 */
export default function StatTile({ label, value, detail, emphasis = false }) {
  return (
    <div className={`stat-tile ${emphasis ? 'stat-tile--emphasis' : ''}`}>
      <dt>{label}</dt>
      <dd>
        <span className="stat-tile__value">{value}</span>
        {detail && <span className="stat-tile__detail">{detail}</span>}
      </dd>
    </div>
  )
}
