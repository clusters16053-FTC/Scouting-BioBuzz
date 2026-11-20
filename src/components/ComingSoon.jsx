/**
 * Placeholder das telas que ainda serão construídas.
 * Mostra o que a tela vai fazer e em qual etapa do roadmap ela entra.
 */
export default function ComingSoon({ title, stage, children }) {
  return (
    <section className="coming-soon">
      <span className="badge">Etapa {stage}</span>
      <h1>{title}</h1>
      <div className="coming-soon__body">{children}</div>
    </section>
  )
}
