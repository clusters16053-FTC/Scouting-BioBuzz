/**
 * Itens do menu. Ficam separados do Layout porque a Home
 * também usa essa lista para montar os atalhos.
 * `icon` é o nome de um ícone em src/components/Icon.jsx.
 */
export const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: 'home', description: '' },
  {
    to: '/partida',
    label: 'Partida',
    icon: 'match',
    description: 'Acompanhar um robô durante a partida',
  },
  { to: '/pit', label: 'Pit', icon: 'pit', description: 'Entrevistar uma equipe nos boxes' },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    description: 'Comparar equipes e montar a estratégia',
  },
]
