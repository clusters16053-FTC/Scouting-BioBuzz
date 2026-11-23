import { FLOWER_PIECE_OPTIONS } from './pit-schema.js'

/**
 * "Pontua na FLOWER?" → Não | NECTAR | POLLEN
 *
 * NECTAR e POLLEN podem ser marcados juntos (robô que pontua os dois).
 * "Não" é exclusivo: corresponde à lista vazia.
 */
export default function FlowerScoringField({ value, onChange }) {
  const none = value.length === 0

  function toggle(piece) {
    onChange(value.includes(piece) ? value.filter((p) => p !== piece) : [...value, piece])
  }

  return (
    <fieldset className="segmented">
      <legend className="field-label">Pontua na FLOWER?</legend>
      <div className="segmented__options">
        <button
          type="button"
          aria-pressed={none}
          className={`segmented__option ${none ? 'is-selected' : ''}`}
          onClick={() => onChange([])}
        >
          Não
        </button>
        {FLOWER_PIECE_OPTIONS.map((option) => {
          const selected = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={`segmented__option ${selected ? 'is-selected tone-good' : ''}`}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
