/**
 * Função da Vercel: GET /api/ftc?resource=teams&event=BRFOQ
 *
 * Só encaixa a ponte (server/ftc-api.js) no formato da Vercel.
 * O token vem das variáveis de ambiente do projeto na Vercel (FTC_API_USERNAME e FTC_API_KEY).
 */
import { handleFtcRequest } from '../server/ftc-api.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'metodo-nao-permitido' })
    return
  }
  const result = await handleFtcRequest(req.query, process.env)
  for (const [name, value] of Object.entries(result.headers)) res.setHeader(name, value)
  res.status(result.status).send(result.body)
}
