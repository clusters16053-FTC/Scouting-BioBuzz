import Icon from '../../components/Icon.jsx'

const ALLIANCE_NAME = { red: 'Vermelha', blue: 'Azul' }

/**
 * Tela depois de salvar. O botão principal já prepara a próxima partida
 * com o número +1 e a mesma aliança/posição. Com a tabela oficial, já diz quem vem.
 */
export default function MatchSaved({ last, next, onNext }) {
  return (
    <section className="saved">
      <span className="saved__icon">
        <Icon name="check" size={32} />
      </span>
      <h1>Relatório salvo</h1>
      <p className="muted">
        Partida {last.matchNumber}, equipe {last.teamNumber}. Ficou guardado no aparelho e sobe
        sozinho quando tiver internet.
      </p>
      <button type="button" className="button button--save" onClick={onNext}>
        Começar partida {last.matchNumber + 1}
      </button>
      {next && (
        <p className="saved__next">
          {ALLIANCE_NAME[last.alliance]} {last.station}:{' '}
          <strong>
            {next.teamNumber}
            {next.name ? ` ${next.name}` : ''}
          </strong>
          , pela tabela oficial
        </p>
      )}
    </section>
  )
}
