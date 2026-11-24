/**
 * Favoritas da equipe: a lista de olho para a escolha de aliança.
 *
 * Um documento por equipe favoritada, em events/{eventId}/watchlist/{teamNumber}.
 * O id É o número da equipe: se duas pessoas marcarem a mesma equipe ao mesmo tempo
 * (até offline), as duas escrevem no mesmo documento, sem duplicar.
 * Desmarcar = apagar o documento.
 *
 * Fica separado do serviço (que importa o Firebase) para os testes de regra usarem
 * exatamente o mesmo formato que o app envia.
 */
export function toWatchlistDocument(teamNumber, { uid, scouter, addedAt }) {
  return {
    teamNumber,
    scouter,
    addedBy: uid,
    addedAt,
  }
}
