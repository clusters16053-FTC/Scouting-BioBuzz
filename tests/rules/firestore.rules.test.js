/**
 * Testes das regras de segurança (firestore.rules).
 *
 * Rodam contra o emulador do Firestore, nunca contra o banco real:
 *   npm run test:rules
 *
 * Cada teste simula um usuário (sem login, logado sem código, membro...)
 * e verifica se a operação é aceita (assertSucceeds) ou barrada (assertFails).
 *
 * Os relatórios "válidos" são montados com as MESMAS funções que o app usa
 * (toMatchDocument / toPitDocument). Se o formulário mudar e as regras não,
 * estes testes quebram — de propósito.
 */
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  createEmptyMatchDraft,
  toMatchDocument,
} from '../../src/features/match-scouting/match-schema.js'
import { createEmptyPitDraft, toPitDocument } from '../../src/features/pit-scouting/pit-schema.js'
import {
  closeCycle,
  createPhaseTimer,
  markFired,
  setCollected,
  startPhase,
} from '../../src/features/match-scouting/cycles/cycle-math.js'

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
    await setDoc(doc(db, 'members/membro2'), { name: 'Bia', code: TEAM_CODE, joinedAt: new Date() })
    await setDoc(doc(db, `${EVENT}/matchReports/existente`), {
      ...matchReport('membro'),
      syncedAt: new Date(),
    })
  })
})

// ---------- Helpers ----------

const anonymous = () => testEnv.unauthenticatedContext().firestore()
const user = (uid) => testEnv.authenticatedContext(uid).firestore()

/**
 * Simula o scouter registrando ciclos: [[segundo do ATIROU, coletou, acertou], ...]
 * O "Começou" acontece no segundo 0 e os acertos são informados 1 s depois de cada ATIROU.
 */
function phaseTimer(cycles, { isPreloadPhase = false } = {}) {
  const base = 1_700_000_000_000
  let timer = startPhase(createPhaseTimer(), base)
  for (const [firedAt, collected, hits] of cycles) {
    timer = markFired(timer, base + firedAt * 1000)
    timer = setCollected(timer, collected)
    timer = closeCycle(timer, hits, base + (firedAt + 1) * 1000, { isPreloadPhase })
  }
  return timer
}

/** Relatório de partida preenchido, exatamente como o app gera. */
function matchReport(uid, overrides = {}) {
  const draft = {
    ...createEmptyMatchDraft({ matchNumber: 12, alliance: 'red', station: 1 }),
    teamNumber: 16053,
    auto: {
      leave: true,
      park: false,
      timer: phaseTimer(
        [
          [3, 4, 4],
          [18, 4, 2],
        ],
        { isPreloadPhase: true },
      ),
    },
    teleop: {
      intake: ['floor', 'flower'],
      timer: phaseTimer([
        [10, 4, 3],
        [24, 3, 3],
        [39, 4, 1],
      ]),
    },
    endgame: { nectarFlower: 2, pollenFlower: 1, garden: 0, park: true },
    defensePlayed: 'low',
    issues: ['tipped'],
    driverRating: 4,
    notes: 'ciclo rápido',
  }
  return {
    ...toMatchDocument(draft, { uid, scouter: 'Ana', syncedAt: serverTimestamp() }),
    ...overrides,
  }
}

/** Relatório de pit preenchido, exatamente como o app gera. */
function pitReport(uid, overrides = {}) {
  const draft = {
    ...createEmptyPitDraft(),
    teamNumber: 16053,
    teamName: 'Clusters',
    drivetrain: 'mecanum',
    shooterShape: 'c',
    flowerPlaces: ['nectar', 'pollen'],
    removesFromFlower: true,
    autoNotes: 'sai da área, lança o preload e faz 2 ciclos',
    strategy: 'foca em TIPS',
    photo: 'data:image/jpeg;base64,abc',
  }
  return {
    ...toPitDocument(draft, { uid, scouter: 'Ana', syncedAt: serverTimestamp() }),
    ...overrides,
  }
}

/** Copia o objeto removendo um campo. */
function without(object, field) {
  const copy = { ...object }
  delete copy[field]
  return copy
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

describe('relatórios de partida — acesso', () => {
  const reports = (db) => collection(db, `${EVENT}/matchReports`)
  const reportDoc = (db, id) => doc(db, `${EVENT}/matchReports/${id}`)

  it('membro cria relatório gerado pelo app', async () => {
    await assertSucceeds(setDoc(reportDoc(user('membro'), 'r1'), matchReport('membro')))
  })

  it('aceita relatório de robô ausente (no-show)', async () => {
    const draft = {
      ...createEmptyMatchDraft({ matchNumber: 3, alliance: 'blue', station: 2 }),
      teamNumber: 1234,
      noShow: true,
    }
    const data = toMatchDocument(draft, {
      uid: 'membro',
      scouter: 'Ana',
      syncedAt: serverTimestamp(),
    })
    await assertSucceeds(setDoc(reportDoc(user('membro'), 'r2'), data))
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

  it('reenviar o mesmo relatório funciona (sync offline)', async () => {
    await assertSucceeds(setDoc(reportDoc(user('membro'), 'existente'), matchReport('membro')))
  })

  it('outro membro não sobrescreve relatório alheio', async () => {
    await assertFails(setDoc(reportDoc(user('membro2'), 'existente'), matchReport('membro2')))
  })

  it('ninguém apaga relatório', async () => {
    await assertFails(deleteDoc(reportDoc(user('membro'), 'existente')))
  })
})

describe('relatórios de partida — validação dos campos', () => {
  const save = (data) => setDoc(doc(user('membro'), `${EVENT}/matchReports/novo`), data)
  const valid = () => matchReport('membro')

  it.each([
    ['aliança inválida', { alliance: 'green' }],
    ['equipe negativa', { teamNumber: -5 }],
    ['equipe como texto', { teamNumber: '16053' }],
    ['posição 3', { station: 3 }],
    ['partida 0', { matchNumber: 0 }],
    ['versão de schema antiga', { schemaVersion: 1 }],
    ['versão de schema desconhecida', { schemaVersion: 3 }],
    ['nota 6', { driverRating: 6 }],
    ['defesa inválida', { defensePlayed: 'total' }],
    ['problema desconhecido', { issues: ['explodiu'] }],
    ['observação longa demais', { notes: 'x'.repeat(501) }],
    ['data como texto', { createdAt: '2026-12-05' }],
    ['campo extra', { hacker: true }],
  ])('barra %s', async (_, override) => {
    await assertFails(save({ ...valid(), ...override }))
  })

  it.each([
    ['AUTO no formato antigo (v1)', (d) => ({ ...d, auto: { ...d.auto, made: 3, missed: 1 } })],
    ['AUTO sem PARK', (d) => ({ ...d, auto: without(d.auto, 'park') })],
    ['total de ciclos diferente da lista', (d) => ({ ...d, auto: { ...d.auto, totalCycles: 5 } })],
    ['mais acertos que tiros', (d) => ({ ...d, teleop: { ...d.teleop, totalHits: 99 } })],
    ['mais de 4 tiros por ciclo', (d) => ({ ...d, teleop: { ...d.teleop, totalShots: 40 } })],
    ['tempo médio negativo', (d) => ({ ...d, teleop: { ...d.teleop, avgCycleSeconds: -2 } })],
    ['tempo médio como texto', (d) => ({ ...d, teleop: { ...d.teleop, avgCycleSeconds: '11' } })],
    [
      'lista de ciclos gigante',
      (d) => ({
        ...d,
        teleop: { ...d.teleop, cycles: Array(31).fill(d.teleop.cycles[0]), totalCycles: 31 },
      }),
    ],
    ['TELEOP com coleta inválida', (d) => ({ ...d, teleop: { ...d.teleop, intake: ['ceu'] } })],
    ['final com GARDEN fracionado', (d) => ({ ...d, endgame: { ...d.endgame, garden: 1.5 } })],
  ])('barra %s', async (_, change) => {
    await assertFails(save(change(valid())))
  })

  it('barra relatório sem um campo obrigatório', async () => {
    await assertFails(save(without(valid(), 'teleop')))
  })
})

describe('relatórios de pit', () => {
  const save = (data, uid = 'membro') => setDoc(doc(user(uid), `${EVENT}/pitReports/p1`), data)

  it('membro cria relatório gerado pelo app', async () => {
    await assertSucceeds(save(pitReport('membro')))
  })

  it('aceita o mínimo obrigatório (sem FLOWER, sem textos, sem foto)', async () => {
    const draft = {
      ...createEmptyPitDraft(),
      teamNumber: 1234,
      drivetrain: 'tank',
      shooterShape: 'none',
    }
    const data = toPitDocument(draft, {
      uid: 'membro',
      scouter: 'Ana',
      syncedAt: serverTimestamp(),
    })
    await assertSucceeds(save(data))
  })

  it('logado sem código não cria', async () => {
    await assertFails(save(pitReport('intruso'), 'intruso'))
  })

  it.each([
    ['tração inválida', { drivetrain: 'pernas' }],
    ['shooter inválido', { shooterShape: 'z' }],
    ['shooter vazio', { shooterShape: null }],
    ['peça desconhecida na FLOWER', { flowerPlaces: ['mel'] }],
    ['"tira da FLOWER" como texto', { removesFromFlower: 'sim' }],
    ['AUTO longo demais', { autoNotes: 'x'.repeat(501) }],
    ['nome longo demais', { teamName: 'x'.repeat(61) }],
    ['versão antiga do pit', { schemaVersion: 1 }],
    ['campo do formato antigo', { launchesCell: true }],
    ['campo extra', { photo: 'data:image/jpeg;base64,abc' }],
  ])('barra %s', async (_, override) => {
    await assertFails(save({ ...pitReport('membro'), ...override }))
  })
})

describe('fotos do pit', () => {
  const photo = (db, id) => doc(db, `${EVENT}/pitPhotos/${id}`)

  it('membro envia foto pequena', async () => {
    await assertSucceeds(
      setDoc(photo(user('membro'), 'p1'), {
        image: 'data:image/jpeg;base64,abc',
        createdBy: 'membro',
      }),
    )
  })

  it('barra foto grande demais', async () => {
    const huge = 'x'.repeat(400001)
    await assertFails(setDoc(photo(user('membro'), 'p1'), { image: huge, createdBy: 'membro' }))
  })

  it('barra campo extra junto da foto', async () => {
    await assertFails(
      setDoc(photo(user('membro'), 'p1'), { image: 'abc', createdBy: 'membro', extra: 1 }),
    )
  })
})

describe('caminhos desconhecidos', () => {
  it('bloqueia qualquer coleção fora do previsto', async () => {
    await assertFails(setDoc(doc(user('membro'), 'qualquer/coisa'), { a: 1 }))
  })
})
