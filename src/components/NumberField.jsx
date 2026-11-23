/**
 * Campo numérico que abre o teclado de números no celular.
 * Guarda o valor como número (ou 0 quando vazio).
 */
export default function NumberField({ label, value, onChange, placeholder, max = 99999 }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value || ''}
        placeholder={placeholder}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, String(max).length)
          onChange(Math.min(Number(digits) || 0, max))
        }}
      />
    </label>
  )
}
