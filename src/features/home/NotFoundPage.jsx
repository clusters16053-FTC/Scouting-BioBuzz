import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="coming-soon">
      <h1>Página não encontrada</h1>
      <p className="muted">Esse endereço não existe.</p>
      <Link to="/" className="button">
        Voltar ao início
      </Link>
    </section>
  )
}
