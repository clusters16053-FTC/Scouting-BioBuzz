/** Campo de texto livre com contador de caracteres. */
export default function TextArea({ label, value, onChange, maxLength = 500, placeholder }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        <span className="muted field-hint">
          {value.length}/{maxLength}
        </span>
      </span>
      <textarea
        rows={3}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
