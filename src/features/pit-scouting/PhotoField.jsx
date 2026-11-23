import { useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { ImageTooLargeError, compressImage } from '../../lib/image.js'

/**
 * Tira (ou escolhe) uma foto e já comprime no aparelho.
 * O atributo capture="environment" abre direto a câmera traseira no celular.
 */
export default function PhotoField({ value, onChange }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite escolher a mesma foto de novo
    if (!file) return

    setStatus('working')
    setError('')
    try {
      onChange(await compressImage(file))
    } catch (err) {
      setError(
        err instanceof ImageTooLargeError
          ? 'A foto ficou grande demais mesmo comprimida. Tente outra.'
          : 'Não foi possível ler essa imagem.',
      )
    } finally {
      setStatus('idle')
    }
  }

  const sizeKb = value ? Math.round((value.length * 3) / 4 / 1024) : 0

  return (
    <div className="field">
      <span className="field-label">Foto do robô</span>

      {value && (
        <figure className="photo-preview">
          <img src={value} alt="Foto do robô" />
          <figcaption className="muted">~{sizeKb} KB depois de comprimida</figcaption>
        </figure>
      )}

      <div className="photo-actions">
        <label className="button button--ghost">
          <Icon name="camera" size={20} />
          {status === 'working' ? 'Comprimindo…' : value ? 'Trocar foto' : 'Tirar foto'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            disabled={status === 'working'}
            hidden
          />
        </label>
        {value && (
          <button type="button" className="button button--ghost" onClick={() => onChange(null)}>
            Remover
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
