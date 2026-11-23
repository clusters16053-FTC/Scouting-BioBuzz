import { formatRate } from '../analytics.js'

/** Teto "redondo" para o eixo: 7 → 8, 13 → 15, 22 → 25. */
function niceMax(value) {
  if (value <= 4) return 4
  const step = value <= 10 ? 2 : 5
  return Math.ceil(value / step) * step
}

/**
 * Colunas empilhadas por partida: acertos no AUTO (embaixo) + TELEOP (em cima).
 * Duas séries → legenda sempre visível. Cada coluna mostra os valores ao passar
 * o mouse ou focar; a tabela "partida a partida" na ficha tem os mesmos números.
 *
 * matches: saída de matchStats() + noShow, em ordem de partida.
 */
export default function MatchColumns({ matches }) {
  const played = matches.filter((m) => !m.noShow)
  const top = niceMax(Math.max(...played.map((m) => m.totalHits), 0))
  const ticks = [0, top / 2, top]

  return (
    <figure className="match-columns">
      <ul className="chart-legend" aria-label="Legenda">
        <li>
          <span className="swatch swatch--auto" /> AUTO
        </li>
        <li>
          <span className="swatch swatch--teleop" /> TELEOP
        </li>
      </ul>

      <div className="match-columns__plot">
        <div className="match-columns__axis" aria-hidden="true">
          {[...ticks].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="match-columns__area">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="match-columns__grid"
              style={{ bottom: `${(tick / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          <ol className="match-columns__bars">
            {matches.map((m) => (
              <li
                key={m.matchNumber}
                className="match-column"
                tabIndex={0}
                aria-label={
                  m.noShow
                    ? `Partida ${m.matchNumber}: não apareceu`
                    : `Partida ${m.matchNumber}: ${m.autoHits} no AUTO, ${m.teleopHits} no TELEOP`
                }
              >
                <span className="match-column__stack">
                  {m.noShow ? (
                    <span className="match-column__absent">não veio</span>
                  ) : (
                    <>
                      <span
                        className="match-column__seg match-column__seg--teleop"
                        style={{ height: `${(m.teleopHits / top) * 100}%` }}
                      />
                      <span
                        className="match-column__seg match-column__seg--auto"
                        style={{ height: `${(m.autoHits / top) * 100}%` }}
                      />
                    </>
                  )}
                </span>
                <span className="match-column__x">{m.matchNumber}</span>

                {!m.noShow && (
                  <span className="chart-tip" role="presentation">
                    <span className="chart-tip__title">Partida {m.matchNumber}</span>
                    <span className="chart-tip__row">
                      <i className="line-key line-key--teleop" />
                      <strong>{m.teleopHits}</strong>
                      <span>TELEOP</span>
                    </span>
                    <span className="chart-tip__row">
                      <i className="line-key line-key--auto" />
                      <strong>{m.autoHits}</strong>
                      <span>AUTO</span>
                    </span>
                    <span className="chart-tip__row">
                      <strong>
                        {formatRate(m.totalShots ? m.totalHits / m.totalShots : null)}
                      </strong>
                      <span>precisão</span>
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption className="muted">Partida</figcaption>
    </figure>
  )
}
