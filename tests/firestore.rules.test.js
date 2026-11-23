/**
 * Testes das regras de segurança (firestore.rules).
 *
 * Rodam contra o emulador do Firestore, nunca contra o banco real:
 *   npm run test:rules
 *
 * Cada teste simula um usuário (sem login, logado sem código, membro...)
 * e verifica se a operação é aceita (assertSucceeds) ou barrada (assertFails).
 */
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const TEAM_CODE = 'codigo-secreto'
const EVENT = 'events/BRCEFOR'

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-scouting',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(() => testEnv.cleanup())

beforeEach(async () => {
  await testEnv.clearFirestore()
  // Prepara o banco ignorando as regras, como se fosse o admin no console.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'config/access'), { teamCode: TEAM_CODE })
    await setDoc(doc(db, 'members/membro'), { name: 'Ana', code: TEAM_CODE, joinedAt: new Date() })
    await setDoc(doc(db, `${EVENT}/matchReports/existente`), {
      ...matchReport('membro'),
      syncedAt: new Date(),
    })
  })
})

// ---------- Helpers ----------

const anonymous = () => testEnv.unauthenticatedContext().firestore()
const user = (uid) => testEnv.authenticatedContext(uid).firestore()

function matchReport(uid, overrides = {}) {
  return {
    schemaVersion: 1,
    teamNumber: 16053,
    matchNumber: 12,
    alliance: 'red',
    station: 1,
    createdBy: uid,
    syncedAt: serverTimestamp(),
    ...overrides,
  }
}

// ---------- Testes ----------

describe('config secreta', () => {
  it('ninguém lê o código da equipe, nem membro', async () => {
    await assertFails(getDoc(doc(anonymous(), 'config/access')))
    await assertFails(getDoc(doc(user('membro'), 'config/access')))
  })

  it('ninguém altera o código pelo app', async () => {
    await assertFails(setDoc(doc(user('membro'), 'config/access'), { teamCode: 'novo' }))
  })
})

describe('entrar na equipe', () => {
  const join = (db, uid, data = {}) =>
    setDoc(doc(db, `members/${uid}`), {
      name: 'Bia',
      code: TEAM_CODE,
      joinedAt: serverTimestamp(),
      ...data,
    })

  it('aceita com o código certo', async () => {
    await assertSucceeds(join(user('novo'), 'novo'))
  })

  it('barra código errado', async () => {
    await assertFails(join(user('novo'), 'novo', { code: 'chute' }))
  })

  it('barra quem não fez login', async () => {
    await assertFails(join(anonymous(), 'novo'))
  })

  it('barra cadastrar outro aparelho', async () => {
    await assertFails(join(user('novo'), 'outro-uid'))
  })

  it('barra campos extras (ex.: tentar virar admin)', async () => {
    await assertFails(join(user('novo'), 'novo', { admin: true }))
  })

  it('barra nome vazio', async () => {
    await assertFails(join(user('novo'), 'novo', { name: '' }))
  })

  it('cada um só lê o próprio cadastro', async () => {
    await assertSucceeds(getDoc(doc(user('membro'), 'members/membro')))
    await assertFails(getDoc(doc(user('intruso'), 'members/membro')))
    await assertFails(getDocs(collection(user('membro'), 'members')))
  })
})

describe('relatórios de partida', () => {
  const reports = (db) => collection(db, `${EVENT}/matchReports`)
  const reportDoc = (db, id) => doc(db, `${EVENT}/matchReports/${id}`)

  it('membro cria relatório', async () => {
    await assertSucceeds(setDoc(reportDoc(user('membro'), 'r1'), matchReport('membro')))
  })

  it('logado sem código não cria nem lê', async () => {
    await assertFails(setDoc(reportDoc(user('intruso'), 'r1'), matchReport('intruso')))
    await assertFails(getDocs(reports(user('intruso'))))
  })

  it('sem login não lê nada', async () => {
    await assertFails(getDocs(reports(anonymous())))
  })

  it('membro lê relatórios', async () => {
    await assertSucceeds(getDocs(reports(user('membro'))))
  })

  it('barra relatório em nome de outra pessoa', async () => {
    await assertFails(setDoc(reportDoc(user('membro'), 'r1'), matchReport('outro')))
  })

  it('barra dados inválidos', async () => {
    const db = user('membro')
    await assertFails(setDoc(reportDoc(db, 'r1'), matchReport('membro', { alliance: 'green' })))
    await assertFails(setDoc(reportDoc(db, 'r2'), matchReport('membro', { teamNumber: -5 })))
    await assertFails(setDoc(reportDoc(db, 'r3'), matchReport('membro', { station: 3 })))
  })

  it('reenviar o mesmo relatório funciona (sync offline)', async () => {
    await assertSucceeds(setDoc(reportDoc(user('membro'), 'existente'), matchReport('membro')))
  })

  it('ninguém apaga relatório', async () => {
    await assertFails(deleteDoc(reportDoc(user('membro'), 'existente')))
  })
})

describe('fotos do pit', () => {
  const photo = (db, id) => doc(db, `${EVENT}/pitPhotos/${id}`)

  it('membro envia foto pequena', async () => {
    await assertSucceeds(setDoc(photo(user('membro'), 'p1'), { image: 'abc', createdBy: 'membro' }))
  })

  it('barra foto grande demais', async () => {
    const huge = 'x'.repeat(400001)
    await assertFails(setDoc(photo(user('membro'), 'p1'), { image: huge, createdBy: 'membro' }))
  })
})

describe('caminhos desconhecidos', () => {
  it('bloqueia qualquer coleção fora do previsto', async () => {
    await assertFails(setDoc(doc(user('membro'), 'qualquer/coisa'), { a: 1 }))
  })
})
