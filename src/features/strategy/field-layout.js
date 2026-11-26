/**
 * Esquema do campo da BIOBUZZ para o quadro de estratégia.
 *
 * Desenho PRÓPRIO (não é a arte da FIRST), em polegadas, visto de cima com a plateia
 * embaixo. Fonte: Competition Manual, seção 9 (ARENA).
 *
 * Confirmado pelo texto do manual:
 *   - campo de 144 × 144 in, 36 TILES de 24 × 24 in (grade 6 × 6);
 *   - HIVE no centro: estrutura de 49,46 in de largura por 38,95 in de profundidade;
 *   - aliança vermelha à esquerda (vista da plateia), azul à direita.
 *
 * PROVISÓRIO (as posições exatas estão nas figuras 9-2 e 10-2 do manual):
 *   FLOWERS, GARDENS, LOADING ZONES e posições iniciais. Ajuste aqui e mude
 *   LAYOUT_CONFIRMED para true quando conferir com a figura.
 */
import { FIELD_SIZE } from './board-model.js'

export const LAYOUT_CONFIRMED = false

export const TILE = 24

export const ALLIANCE_COLORS = { red: '#d63a26', blue: '#1f74d6' }

const HIVE_W = 49.46
const HIVE_D = 38.95

export const FIELD = {
  hive: {
    x: (FIELD_SIZE - HIVE_W) / 2,
    y: (FIELD_SIZE - HIVE_D) / 2,
    width: HIVE_W,
    height: HIVE_D,
  },
  // FLOWERS presas na parede (provisório: duas na parede de trás, duas na da plateia).
  flowers: [
    { x: 36, y: 5 },
    { x: 108, y: 5 },
    { x: 36, y: 139 },
    { x: 108, y: 139 },
  ],
  // GARDENS em cantos opostos (provisório).
  gardens: [
    { alliance: 'red', x: 0, y: 0, width: 23, height: 23 },
    { alliance: 'blue', x: FIELD_SIZE - 23, y: FIELD_SIZE - 23, width: 23, height: 23 },
  ],
  // LOADING ZONES junto da área de cada aliança (provisório: meio das paredes laterais).
  loadingZones: [
    { alliance: 'red', x: 0, y: 60.5, width: 11, height: 23 },
    { alliance: 'blue', x: FIELD_SIZE - 11, y: 60.5, width: 11, height: 23 },
  ],
}

/** Tamanho máximo do robô na FTC: cabe num cubo de 18 in. */
export const ROBOT_SIZE = 18

/** Posição inicial de cada posição de aliança (provisório). */
const START = {
  red: [
    [16, 36],
    [16, 108],
  ],
  blue: [
    [FIELD_SIZE - 16, 36],
    [FIELD_SIZE - 16, 108],
  ],
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
