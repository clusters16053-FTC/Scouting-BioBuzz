import { useOutletContext, useSearchParams } from 'react-router'
import Icon from '../../components/Icon.jsx'
import CompareTable from './components/CompareTable.jsx'
import TeamSearch from './components/TeamSearch.jsx'

const MAX_TEAMS = 4

/** "16053,8743" → [16053, 8743], sem repetidos e no máximo 4. */
function parseTeams(value) {
  const numbers = (value ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
  return [...new Set(numbers)].slice(0, MAX_TEAMS)
}

/**
 * Duas a quatro equipes lado a lado, com o melhor valor de cada linha destacado.
 * As equipes ficam no endereço (?equipes=16053,8743): dá para mandar o link.
 */
export default function ComparePage() {
  const { summary, watchlist } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const byNumber = new Map(summary.teams.map((t) => [t.teamNumber, t]))
  const chosen = parseTeams(params.get('equipes')).filter((n) => byNumber.has(n))
  const teams = chosen.map((n) => byNumber.get(n))

  function setTeams(numbers) {
    setParams(numbers.length ? { equipes: numbers.join(',') } : {}, { replace: true })
  }

  const available = summary.teams.filter((t) => !chosen.includes(t.teamNumber))
  const favorites = [...watchlist.teams].filter((n) => byNumber.has(n)).slice(0, MAX_TEAMS)

  return (
    <div className="dashboard__body">
      <section className="panel compare-picker">
        <header className="panel__header">
          <h2>Comparar equipes</h2>
          <p className="muted">
            Escolha de 2 a {MAX_TEAMS} equipes. Em cada linha, o melhor valor fica destacado.
          </p>
        </header>

        {chosen.length > 0 && (
          <ul className="compare-chips" aria-label="Equipes escolhidas">
            {teams.map((t) => (
              <li key={t.teamNumber}>
                <span>
                  <strong>{t.teamNumber}</strong> {t.teamName}
                </span>
                <button
                  type="button"
                  aria-label={`Tirar ${t.teamNumber} da comparação`}
                  onClick={() => setTeams(chosen.filter((n) => n !== t.teamNumber))}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="compare-picker__actions">
          {chosen.length < MAX_TEAMS && (
            <TeamSearch
              teams={available}
              label="Adicionar equipe à comparação"
              placeholder="Adicionar equipe"
              onPick={(team) => setTeams([...chosen, team.teamNumber])}
            />
          )}
          {favorites.length >= 2 && (
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setTeams(favorites)}
            >
              <Icon name="star" size={18} />
              Usar favoritas
            </button>
          )}
          {chosen.length > 0 && (
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setTeams([])}
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {teams.length < 2 ? (
        <p className="muted empty-inline">
          {teams.length === 0
            ? 'Busque uma equipe acima, use as favoritas ou toque em "Comparar" na ficha de uma equipe.'
            : 'Adicione mais uma equipe para comparar.'}
        </p>
      ) : (
        <CompareTable teams={teams} watchlist={watchlist} />
      )}
    </div>
  )
}
