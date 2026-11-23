/**
 * Conexão com o Firebase. Todo o app importa `auth` e `db` daqui.
 *
 * A configuração vem das variáveis de ambiente VITE_FIREBASE_* (veja .env.example).
 * O Vite só expõe para o navegador variáveis que começam com VITE_.
 */
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const env = import.meta.env

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/** Falso quando as variáveis não foram preenchidas — o app mostra uma tela de aviso. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

const useEmulators = env.VITE_USE_EMULATORS === 'true'

export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null

/** Login. O Firebase guarda a sessão no aparelho (IndexedDB), então ela sobrevive offline. */
export const auth = app ? getAuth(app) : null

/**
 * Banco de dados com CACHE PERSISTENTE: é isso que faz o app funcionar offline.
 * - Escritas sem internet ficam guardadas no aparelho e sobem sozinhas depois.
 * - Leituras sem internet usam o que já está no cache.
 * - O "multiple tab manager" deixa o cache funcionar com o app aberto em várias abas.
 */
export const db = app
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : null

if (app && useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
