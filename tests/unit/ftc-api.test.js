import { describe, expect, it, vi } from 'vitest'
import { FTC_API_BASE, handleFtcRequest } from '../../server/ftc-api.js'

const ENV = { FTC_API_USERNAME: 'clusters', FTC_API_KEY: 'segredo' }

/** fetch falso: responde conforme o caminho pedido. routes: { '/caminho': [status, corpo] } */
function fakeFetch(routes) {
  return vi.fn(async (url) => {
    const path = url.replace(`${FTC_API_BASE}/2026`, '')
    const [status, body] = routes[path] ?? [404, {}]
    return { ok: status >= 200 && status < 300, status, json: async () => body }
  })
}

const call = (query, fetchImpl, env = ENV) => handleFtcRequest(query, env, fetchImpl)
const bodyOf = (result) => JSON.parse(result.body)

describe('ponte da API da FIRST', () => {
  it('recusa consulta fora da lista', async () => {
    const result = await call({ resource: 'awards', event: 'BRFOQ' }, fakeFetch({}))
    expect(result.status).toBe(400)
  })

  it('recusa código de evento estranho antes de chamar a FIRST', async () => {
    const fetchImpl = fakeFetch({})
    const result = await call({ resource: 'teams', event: '../teams' }, fetchImpl)
    expect(result.status).toBe(400)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sem token configurado responde 503 sem chamar a FIRST', async () => {
    const fetchImpl = fakeFetch({})
    const result = await call({ resource: 'rankings', event: 'BRFOQ' }, fetchImpl, {})
    expect(result.status).toBe(503)
    expect(bodyOf(result).error).toBe('nao-configurado')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('manda usuário:token em Base64 no cabeçalho Authorization', async () => {
    const fetchImpl = fakeFetch({ '/rankings/BRFOQ': [200, { rankings: [] }] })
    await call({ resource: 'rankings', event: 'brfoq' }, fetchImpl)
    const [, options] = fetchImpl.mock.calls[0]
    expect(options.headers.Authorization).toBe(`Basic ${btoa('clusters:segredo')}`)
  })

  it('nunca devolve o token na resposta', async () => {
    const fetchImpl = fakeFetch({ '/rankings/BRFOQ': [200, { rankings: [] }] })
    const result = await call({ resource: 'rankings', event: 'BRFOQ' }, fetchImpl)
    expect(result.body).not.toContain('segredo')
    expect(result.body).not.toContain(btoa('clusters:segredo'))
  })

  it('junta todas as páginas de equipes', async () => {
    const fetchImpl = fakeFetch({
      '/teams?eventCode=BRFOQ&page=1': [200, { teams: [{ teamNumber: 1 }], pageTotal: 2 }],
      '/teams?eventCode=BRFOQ&page=2': [200, { teams: [{ teamNumber: 2 }], pageTotal: 2 }],
    })
    const result = await call({ resource: 'teams', event: 'BRFOQ' }, fetchImpl)
    expect(bodyOf(result).data.map((t) => t.teamNumber)).toEqual([1, 2])
  })

  it('tabela sem playoffs ainda: classificatórias vêm, playoffs ficam vazios', async () => {
    const fetchImpl = fakeFetch({
      '/schedule/BRFOQ?tournamentLevel=qual': [200, { schedule: [{ matchNumber: 1 }] }],
      '/schedule/BRFOQ?tournamentLevel=playoff': [500, {}],
    })
    const result = await call({ resource: 'schedule', event: 'BRFOQ' }, fetchImpl)
    expect(result.status).toBe(200)
    expect(bodyOf(result).data).toEqual({ qual: [{ matchNumber: 1 }], playoff: [] })
  })

  it('filtra eventos do Brasil por padrão', async () => {
    const fetchImpl = fakeFetch({
      '/events': [
        200,
        {
          events: [
            { code: 'BRFOQ', country: 'Brazil' },
            { code: 'USCAQ', country: 'USA' },
          ],
        },
      ],
    })
    const result = await call({ resource: 'events' }, fetchImpl)
    expect(bodyOf(result).data.map((e) => e.code)).toEqual(['BRFOQ'])
  })

  it('evento inexistente vira 404; token recusado vira 502', async () => {
    const notFound = await call({ resource: 'rankings', event: 'XXXX' }, fakeFetch({}))
    expect(notFound.status).toBe(404)

    const refused = await call(
      { resource: 'rankings', event: 'BRFOQ' },
      fakeFetch({ '/rankings/BRFOQ': [401, {}] }),
    )
    expect(refused.status).toBe(502)
    expect(bodyOf(refused).error).toBe('token-recusado')
  })

  it('resposta boa pode ficar em cache na Vercel', async () => {
    const result = await call(
      { resource: 'rankings', event: 'BRFOQ' },
      fakeFetch({ '/rankings/BRFOQ': [200, { rankings: [] }] }),
    )
    expect(result.headers['Cache-Control']).toContain('s-maxage=60')
  })
})
