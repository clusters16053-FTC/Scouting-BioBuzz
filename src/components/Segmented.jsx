/**
 * Escolha única entre poucas opções, como botões lado a lado.
 * Mais rápido que um <select> no celular: um toque e pronto.
 *
 * options: [{ value, label, tone? }]
 */
export default function Segmented({ label, value, options, onChange, name }) {
  return (
    <fieldset className="segmented">
      {label && <legend className="field-label">{label}</legend>}
      <div className="segmented__options" role="radiogroup">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              className={`segmented__option ${selected ? 'is-selected' : ''} ${
                option.tone ? `tone-${option.tone}` : ''
              }`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
