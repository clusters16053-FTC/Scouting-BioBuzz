/**
 * Regras de negócio do acesso: entrar na equipe e consultar o cadastro.
 * Fica separado dos componentes para a tela só cuidar de mostrar coisas.
 */
import { signInAnonymously } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase.js'
import { paths } from '../../lib/db-paths.js'

/** Erros com mensagem pronta para mostrar na tela. */
export class AccessError extends Error {}

/**
 * Busca o cadastro de membro do aparelho.
 * Offline, o Firestore responde com o que estiver no cache.
 * Retorna null se o aparelho ainda não entrou na equipe.
 */
export async function fetchMember(uid) {
  try {
    const snapshot = await getDoc(doc(db, paths.member(uid)))
    return snapshot.exists() ? snapshot.data() : null
  } catch {
    // Sem internet e sem cache: trata como "ainda não entrou".
    return null
  }
}

/**
 * Entra na equipe: login anônimo + cadastro com o código.
 * Precisa de internet, porque a regra do banco confere o código no servidor.
 */
export async function joinTeam({ name, code }) {
  if (!navigator.onLine) {
    throw new AccessError('Você precisa de internet para entrar pela primeira vez.')
  }

  const user = auth.currentUser ?? (await signInOrExplain())

  // Uma tentativa anterior pode ter dado certo no servidor mesmo com a tela mostrando erro
  // (ex.: internet caiu na hora da resposta). Nesse caso, o cadastro já existe.
  const existing = await fetchMember(user.uid)
  if (existing) return existing

  try {
    await withTimeout(
      setDoc(doc(db, paths.member(user.uid)), {
        name: name.trim(),
        code: code.trim(),
        joinedAt: serverTimestamp(),
      }),
      JOIN_TIMEOUT_MS,
    )
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new AccessError('Código da equipe inválido.')
    }
    if (error instanceof TimeoutError) {
      throw new AccessError(
        'A internet está lenta demais. Tente de novo num lugar com sinal melhor.',
      )
    }
    throw new AccessError('Não foi possível entrar. Tente de novo.')
  }

  return { name: name.trim() }
}

/** Login anônimo com mensagens de erro que o scouter entende. */
async function signInOrExplain() {
  try {
    const credential = await withTimeout(signInAnonymously(auth), JOIN_TIMEOUT_MS)
    return credential.user
  } catch (error) {
    if (
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/admin-restricted-operation'
    ) {
      throw new AccessError(
        'Login anônimo desativado no Firebase. Avise quem administra o sistema.',
      )
    }
    throw new AccessError(
      'Não foi possível conectar ao servidor. Confira a internet e tente de novo.',
    )
  }
}

const JOIN_TIMEOUT_MS = 15000

class TimeoutError extends Error {}

/** Rejeita a promise se ela demorar mais que `ms` milissegundos. */
function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
