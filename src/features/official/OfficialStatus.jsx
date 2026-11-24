import { FIRST_API_INFO_URL } from './official-store.js'

const time = (ms) =>
  new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * Uma linha dizendo de quando são os dados oficiais, com botão de atualizar.
 * Some quando a integração não está configurada: o app funciona igual, só sem eles.
 */
export default function OfficialStatus({ official }) {
  const { status, fetchedAt, error, refreshing, refresh, teams, matches } = official
  if (status === 'off') return null

  let text
  let tone = ''
  if (status === 'not-found') {
    text = 'Este código não é de um evento oficial da FIRST: as equipes são digitadas à mão.'
  } else if (status === 'ok') {
    text = `Dados oficiais de ${time(fetchedAt)}: ${teams.length} equipes, ${matches.length} partidas na tabela.`
    if (error) {
      text += ' Sem conexão agora, usando os guardados.'
      tone = 'official-status--warn'
    }
  } else if (status === 'error') {
    text = 'Não foi possível buscar os dados oficiais da FIRST.'
    tone = 'official-status--warn'
  } else {
    text = refreshing ? 'Buscando dados oficiais da FIRST…' : 'Ainda sem dados oficiais da FIRST.'
  }

  return (
    <div className={`official-status ${tone}`} role="status">
      <p>
        {text}{' '}
        {status === 'ok' && (
          <a href={FIRST_API_INFO_URL} target="_blank" rel="noreferrer" className="text-link">
            Fonte: FIRST
          </a>
        )}
      </p>
      <button
        type="button"
        className="button button--ghost button--small"
        onClick={refresh}
        disabled={refreshing}
      >
        {refreshing ? 'Atualizando…' : status === 'not-found' ? 'Tentar de novo' : 'Atualizar'}
      </button>
    </div>
  )
}
