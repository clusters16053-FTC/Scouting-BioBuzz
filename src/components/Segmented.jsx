/**
 * Escolha única entre poucas opções, como botões lado a lado.
 * Mais rápido que um <select> no celular: um toque e pronto.
 *
 * options: [{ value, label, tone? }]
 * columns: opcional — força uma grade com N colunas
 */
export default function Segmented({ label, value, options, onChange, columns }) {
  return (
    <fieldset
      className={`segmented ${columns ? 'segmented--grid' : ''}`}
      style={columns ? { '--columns': columns } : undefined}
    >
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
