/**
 * Itens do menu. Ficam separados do Layout porque a Home
 * também usa essa lista para montar os cards de atalho.
 */
export const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: '🏠', description: '' },
  {
    to: '/partida',
    label: 'Partida',
    icon: '🎯',
    description: 'Acompanhe um robô durante a partida',
  },
  { to: '/pit', label: 'Pit', icon: '🔧', description: 'Entreviste a equipe nos boxes' },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'Compare equipes e monte a estratégia',
  },
]
