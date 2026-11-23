import { formatRate } from '../analytics.js'

/**
 * Lista de taxas (0 a 100%): nome, barra e número em cada linha.
 * O trilho é um tom mais apagado da mesma cor, então dá para ler o "quanto falta".
 *
 * rows: [{ label, value (0–1 ou null), hint? }]
 */
export default function MeterList({ rows }) {
  return (
    <dl className="meter-list">
      {rows.map((row) => (
        <div key={row.label} className="meter">
          <dt>
            {row.label}
            {row.hint && <span className="meter__hint">{row.hint}</span>}
          </dt>
          <dd>
            <span className="meter__track" aria-hidden="true">
              <span className="meter__fill" style={{ width: `${(row.value ?? 0) * 100}%` }} />
            </span>
            <span className="meter__value">{formatRate(row.value)}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
