/**
 * Múltipla escolha em "chips": toca para marcar, toca de novo para desmarcar.
 *
 * value: array com os valores marcados
 * options: [{ value, label }]
 */
export default function ChipGroup({ label, value, options, onChange }) {
  function toggle(optionValue) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    )
  }

  return (
    <fieldset className="chip-group">
      {label && <legend className="field-label">{label}</legend>}
      <div className="chip-group__options">
        {options.map((option) => {
          const selected = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={`chip ${selected ? 'is-selected' : ''}`}
              onClick={() => toggle(option.value)}
            >
              {selected ? '✓ ' : ''}
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
