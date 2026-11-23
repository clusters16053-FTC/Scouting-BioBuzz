import { useOutletContext } from 'react-router'
import { OWN_TEAM } from '../../config/team.js'
import { formatNumber, formatRate } from './analytics.js'
import RankedBars from './charts/RankedBars.jsx'
import StatTile from './components/StatTile.jsx'
import TeamTable from './components/TeamTable.jsx'

export default function RankingPage() {
  const { summary } = useOutletContext()
  const { teams, overview } = summary

  const ranked = teams.filter((t) => t.played > 0).sort((a, b) => b.avgTotalHits - a.avgTotalHits)

  const ownPosition = ranked.findIndex((t) => t.teamNumber === OWN_TEAM.number) + 1

  return (
    <div className="dashboard__body">
      <dl className="stat-row">
        <StatTile label="Equipes" value={overview.teamCount} />
        <StatTile label="Partidas cobertas" value={overview.matchCount} />
        <StatTile label="Relatórios" value={overview.reportCount} />
        <StatTile label="Entrevistas de pit" value={overview.pitCount} />
        {ownPosition > 0 && (
          <StatTile
            label={`${OWN_TEAM.name} em acertos`}
            value={`${ownPosition}º`}
            detail={`de ${ranked.length} equipes`}
            emphasis
          />
        )}
      </dl>

      {(overview.ignoredReports > 0 || overview.duplicates > 0) && (
        <p className="data-note muted">
          {overview.duplicates > 0 &&
            `${overview.duplicates} relatório(s) repetido(s) da mesma equipe na mesma partida: valeu o mais recente. `}
          {overview.ignoredReports > 0 &&
            `${overview.ignoredReports} relatório(s) de uma versão antiga do formulário ficaram de fora.`}
        </p>
      )}

      <section className="panel">
        <header className="panel__header">
          <h2>Acertos por partida</h2>
          <p className="muted">
            Média de POLLEN acertados no CELL (AUTO + TELEOP). É a contribuição de cada robô para os
            TIPs da aliança.
          </p>
        </header>
        <RankedBars
          ariaLabel="Acertos por partida, da maior média para a menor"
          formatValue={formatNumber}
          items={ranked.map((t) => ({
            key: t.teamNumber,
            label: String(t.teamNumber),
            sublabel: t.teamName,
            value: t.avgTotalHits,
            highlight: t.teamNumber === OWN_TEAM.number,
            to: `equipe/${t.teamNumber}`,
            details: [
              ['precisão', formatRate(t.accuracy)],
              ['ciclo médio', `${formatNumber(t.avgCycleSeconds)} s`],
              ['partidas', t.played],
            ],
          }))}
        />
      </section>

      <section className="panel">
        <header className="panel__header">
          <h2>Todas as equipes</h2>
          <p className="muted">
            Médias por partida (ciclo em segundos, problemas e precisão em %, piloto de 1 a 5).
            Toque no nome da coluna para ordenar. Linhas apagadas têm menos de 2 partidas.
          </p>
        </header>
        <TeamTable teams={teams} />
      </section>
    </div>
  )
}
