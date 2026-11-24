/**
 * Caminhos das coleções/documentos no Firestore, num lugar só.
 * Evita erro de digitação espalhado pelo código e casa com firestore.rules.
 */
export const paths = {
  member: (uid) => `members/${uid}`,
  event: (eventId) => `events/${eventId}`,
  matchReports: (eventId) => `events/${eventId}/matchReports`,
  pitReports: (eventId) => `events/${eventId}/pitReports`,
  pitPhotos: (eventId) => `events/${eventId}/pitPhotos`,
  watchlist: (eventId) => `events/${eventId}/watchlist`,
}
