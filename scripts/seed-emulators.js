/**
 * Prepara o emulador do Firestore para desenvolvimento local.
 * Roda automaticamente no `npm run dev:emulators`.
 *
 * Cria config/access com um código de equipe de teste, que no banco real
 * você cadastra pelo console do Firebase.
 */
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'

const DEV_TEAM_CODE = 'clusters-dev'

const env = await initializeTestEnvironment({ projectId: 'demo-scouting' })

await env.withSecurityRulesDisabled((ctx) =>
  setDoc(doc(ctx.firestore(), 'config/access'), { teamCode: DEV_TEAM_CODE }),
)

await env.cleanup()

console.log(`\n✅ Emulador pronto. Código da equipe para testar: ${DEV_TEAM_CODE}\n`)
