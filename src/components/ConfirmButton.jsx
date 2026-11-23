import { useEffect, useState } from 'react'

/**
 * Botão que pede um segundo toque antes de agir (ex.: apagar o rascunho).
 * Volta ao normal sozinho depois de alguns segundos sem confirmar.
 */
export default function ConfirmButton({ children, confirmLabel = 'Confirmar?', onConfirm }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return undefined
    const timer = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [armed])

  return (
    <button
      type="button"
      className={`button button--ghost ${armed ? 'button--danger' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
