/**
 * Aparece quando as variáveis VITE_FIREBASE_* não foram configuradas.
 * Evita uma tela branca sem explicação.
 */
export default function SetupMissingPage() {
  return (
    <div className="center-screen">
      <section className="card">
        <h1>Firebase não configurado</h1>
        <p className="muted">
          Preencha as variáveis <code>VITE_FIREBASE_*</code> no arquivo <code>.env.local</code> (ou
          na Vercel, em Environment Variables) e reinicie o app.
        </p>
        <p className="muted">
          Passo a passo em <code>docs/firebase.md</code>.
        </p>
      </section>
    </div>
  )
}
