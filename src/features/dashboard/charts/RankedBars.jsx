import { Link } from 'react-router'

/**
 * Barras horizontais ranqueadas (maior primeiro), com ÊNFASE:
 * a equipe destacada fica na cor de destaque e as demais em cinza.
 *
 * Cada barra mostra o valor na ponta (ninguém depende da cor para ler)
 * e um balão com detalhes ao passar o mouse ou focar pelo teclado.
 *
 * items: [{ key, label, sublabel, value, highlight, to, details: [[rótulo, valor], ...] }]
 */
export default function RankedBars({ items, formatValue, ariaLabel }) {
  const max = Math.max(...items.map((item) => item.value), 0) || 1

  return (
    <ol className="rank-bars" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.key}>
          <Link
            to={item.to}
            className={`rank-bar ${item.highlight ? 'is-highlight' : ''}`}
            aria-label={`${item.label} ${item.sublabel ?? ''}: ${formatValue(item.value)}`}
          >
            <span className="rank-bar__label">
              <strong>{item.label}</strong>
              {item.sublabel && <span>{item.sublabel}</span>}
            </span>
            <span className="rank-bar__track">
              <span
                className="rank-bar__fill"
                style={{ width: `${Math.max((item.value / max) * 100, 0.5)}%` }}
              />
              <span className="rank-bar__value">{formatValue(item.value)}</span>
            </span>
            {item.details && (
              <span className="chart-tip" role="presentation">
                {item.details.map(([label, value]) => (
                  <span key={label} className="chart-tip__row">
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </span>
                ))}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  )
}
