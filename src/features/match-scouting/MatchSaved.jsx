import Icon from '../../components/Icon.jsx'

/**
 * Tela depois de salvar. O botão principal já prepara a próxima partida
 * com o número +1 e a mesma aliança/posição.
 */
export default function MatchSaved({ last, onNext }) {
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
    </section>
  )
}
