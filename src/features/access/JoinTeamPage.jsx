import { useState } from 'react'
import { AccessError } from './access-service.js'
import { useSession } from './session-context.js'

export default function JoinTeamPage() {
  const { join } = useSession()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await join({ name, code })
    } catch (err) {
      setError(err instanceof AccessError ? err.message : 'Erro inesperado. Tente de novo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="center-screen">
      <form className="card form" onSubmit={handleSubmit}>
        <img src="/favicon.svg" alt="" width="56" height="56" />
        <h1>Entrar na equipe</h1>
        <p className="muted">
          Faça isso uma vez, com internet. Depois o app funciona mesmo offline.
        </p>

        <label className="field">
          <span>Seu nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            maxLength={40}
            required
          />
        </label>

        <label className="field">
          <span>Código da equipe</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="button" type="submit" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
