/**
 * Esquema do campo da BIOBUZZ para o quadro de estratégia.
 *
 * Desenho PRÓPRIO (não é a arte da FIRST nem de outro app), em polegadas, visto de cima
 * com a aliança VERMELHA EMBAIXO e a azul em cima.
 *
 * Posições medidas numa vista de cima do campo (grade de 6 × 6 TILES de 24 in) e
 * conferidas com o Competition Manual, seção 9: campo de 144 × 144 in, GARDEN de
 * ~23 × 2 in, LOADING ZONE de ~23 × 11 in. O campo é simétrico: girar 180° troca
 * exatamente o lado azul pelo vermelho.
 */
import { FIELD_SIZE } from './board-model.js'

export const TILE = 24

export const ALLIANCE_COLORS = { red: '#d63a26', blue: '#1f74d6' }

/** Espelha um ponto/retângulo para o lado da outra aliança (giro de 180°). */
const mirrorX = (x, width = 0) => FIELD_SIZE - x - width
const mirrorY = (y, height = 0) => FIELD_SIZE - y - height

/**
 * HIVES: duas, empilhadas no centro (azul em cima, vermelha embaixo).
 * Cada uma tem 2 CELLS ligados por uma barra: um virado PARA CIMA (aceita lançamento,
 * começa com 3 NECTAR) e um PARA BAIXO. `points` = para onde as pontas apontam.
 */
const BLUE_HIVE = {
  alliance: 'blue',
  y: 48.4,
  height: 21.1,
  points: 'right',
  cells: [
    { x: 52, width: 17.9, up: true },
    { x: 78.9, width: 17.9, up: false },
  ],
}

const RED_HIVE = {
  alliance: 'red',
  y: mirrorY(BLUE_HIVE.y, BLUE_HIVE.height),
  height: BLUE_HIVE.height,
  points: 'left',
  cells: BLUE_HIVE.cells.map((c) => ({ ...c, x: mirrorX(c.x, c.width) })).sort((a, b) => a.x - b.x),
}

export const FIELD = {
  // Estrutura que segura as duas HIVES (as linhas cinza de cima e de baixo).
  hiveFrame: { x: 52, y: 47.1, width: 39.9, height: 49.5 },
  hives: [BLUE_HIVE, RED_HIVE],

  // FLOWERS presas nas paredes, em pares espelhados.
  flowers: [
    { x: 48.2, y: 2.5 },
    { x: 141.5, y: 47.8 },
    { x: mirrorX(141.5), y: mirrorY(47.8) },
    { x: mirrorX(48.2), y: mirrorY(2.5) },
  ],

  // GARDENS: faixas na parede, cada uma começa com 4 POLLEN.
  gardens: [
    { alliance: 'blue', x: 0, y: 0.8, width: 2.4, height: 22.6 },
    { alliance: 'red', x: mirrorX(0, 2.4), y: mirrorY(0.8, 22.6), width: 2.4, height: 22.6 },
  ],

  // LOADING ZONES: "U" aberto para a parede da aliança (onde se faz PARK).
  loadingZones: [
    { alliance: 'blue', x: 96.8, y: 0, width: 22.4, height: 11.5, wall: 'top' },
    {
      alliance: 'red',
      x: mirrorX(96.8, 22.4),
      y: mirrorY(0, 11.5),
      width: 22.4,
      height: 11.5,
      wall: 'bottom',
    },
  ],
}

/** Margem em volta do campo para os nomes das alianças. */
export const VIEW = { x: -2, y: -9, width: FIELD_SIZE + 4, height: FIELD_SIZE + 18 }

/** Tamanho máximo do robô na FTC: cabe num cubo de 18 in. */
export const ROBOT_SIZE = 18

/** Posição inicial de cada posição de aliança: encostado na parede da própria aliança. */
const RED_START = [
  [116, 135],
  [68, 135],
]

const START = {
  red: RED_START,
  blue: RED_START.map(([x, y]) => [mirrorX(x), mirrorY(y)]),
}

/**
 * Posição inicial dos robôs da simulação.
 * slots: { red: [16053, 8743], blue: [18002, null] } → { 16053: [x, y], ... }
 */
export function startPositions(slots) {
  const out = {}
  for (const alliance of ['red', 'blue']) {
    slots[alliance].forEach((team, index) => {
      if (team) out[team] = START[alliance][index]
    })
  }
  return out
}

/** Aliança de cada equipe da simulação: { 16053: 'red', ... } */
export function allianceOf(slots) {
  const out = {}
  for (const alliance of ['red', 'blue']) {
    for (const team of slots[alliance]) if (team) out[team] = alliance
  }
  return out
}
