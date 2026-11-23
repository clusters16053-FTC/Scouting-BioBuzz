/**
 * Contador com botões grandes de − e +.
 * Feito para apertar sem olhar muito para a tela durante a partida.
 */
export default function Counter({ label, value, onChange, min = 0, max = 99, tone = 'neutral' }) {
  const decrease = () => onChange(Math.max(min, value - 1))
  const increase = () => onChange(Math.min(max, value + 1))

  return (
    <div className={`counter counter--${tone}`}>
      <span className="counter__label">{label}</span>
      <div className="counter__controls">
        <button
          type="button"
          className="counter__button"
          onClick={decrease}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>
        <output className="counter__value" aria-live="polite">
          {value}
        </output>
        <button
          type="button"
          className="counter__button counter__button--plus"
          onClick={increase}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
