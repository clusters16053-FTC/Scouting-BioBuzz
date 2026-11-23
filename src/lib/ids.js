/**
 * Gera um ID único no próprio aparelho, sem precisar de internet.
 *
 * Usamos isso como ID do documento no Firestore: dois scouters offline nunca
 * geram o mesmo ID, e salvar de novo o mesmo rascunho cai no mesmo documento.
 */
export function createId() {
  // randomUUID só existe em páginas seguras (https ou localhost).
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()

  // Alternativa para testes pelo IP da rede local (http://192.168...).
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
