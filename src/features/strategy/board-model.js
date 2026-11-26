/**
 * Quadro de estratégia: o que foi desenhado em cada fase da partida.
 *
 * Coordenadas em POLEGADAS do campo (0 a 144, origem no canto de trás à esquerda,
 * visto da plateia). Assim o desenho fica no mesmo lugar em qualquer tamanho de tela,
 * e girar o campo é só uma transformação na hora de desenhar.
 *
 * Tudo aqui é função pura (recebe o quadro, devolve um quadro novo): fácil de testar,
 * e desfazer/refazer vira só guardar versões anteriores.
 *
 * board = {
 *   phases: { auto: Phase, teleop: Phase, final: Phase },
 *   updatedAt: number,
 * }
 * Phase = {
 *   strokes: [{ id, kind: 'pen' | 'arrow', color, points: [[x, y], ...] }],
 *   robots: { [teamNumber]: [x, y] },   // só os robôs MOVIDOS nesta fase
 * }
 */

export const PHASES = [
  { key: 'auto', label: 'AUTO' },
  { key: 'teleop', label: 'TELEOP' },
  { key: 'final', label: 'FINAL' },
]

export const FIELD_SIZE = 144

const emptyPhase = () => ({ strokes: [], robots: {} })

export function emptyBoard() {
  return {
    phases: Object.fromEntries(PHASES.map((p) => [p.key, emptyPhase()])),
    updatedAt: 0,
  }
}

function withPhase(board, phaseKey, change) {
  const phase = board.phases[phaseKey] ?? emptyPhase()
  return {
    ...board,
    phases: { ...board.phases, [phaseKey]: { ...phase, ...change(phase) } },
    updatedAt: Date.now(),
  }
}

// ---------- Traços ----------

const round = (n) => Math.round(n * 10) / 10
const clamp = (n) => Math.min(FIELD_SIZE, Math.max(0, n))

/** Ponto dentro do campo, com 1 casa decimal (deixa o que fica guardado bem menor). */
export function toFieldPoint([x, y]) {
  return [round(clamp(x)), round(clamp(y))]
}

export function addStroke(board, phaseKey, stroke) {
  if (stroke.points.length < 2) return board
  return withPhase(board, phaseKey, (phase) => ({ strokes: [...phase.strokes, stroke] }))
}

export function removeStrokes(board, phaseKey, ids) {
  if (!ids.length) return board
  const drop = new Set(ids)
  return withPhase(board, phaseKey, (phase) => ({
    strokes: phase.strokes.filter((s) => !drop.has(s.id)),
  }))
}

export function clearPhase(board, phaseKey) {
  return withPhase(board, phaseKey, () => emptyPhase())
}

/** Distância de um ponto a um segmento de reta. */
function distanceToSegment([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const length2 = dx * dx + dy * dy
  const t =
    length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Ids dos traços que passam a menos de `radius` polegadas do ponto (para a borracha). */
export function strokesNear(strokes, point, radius) {
  return strokes
    .filter((stroke) =>
      stroke.points.some((p, i) =>
        i === 0
          ? Math.hypot(point[0] - p[0], point[1] - p[1]) <= radius
          : distanceToSegment(point, stroke.points[i - 1], p) <= radius,
      ),
    )
    .map((stroke) => stroke.id)
}

/**
 * Simplifica um traço feito no dedo (Ramer–Douglas–Peucker): tira os pontos que quase
 * não mudam o desenho. Um risco de 200 pontos costuma virar 20, sem diferença visível.
 */
export function simplifyPoints(points, tolerance = 0.6) {
  if (points.length < 3) return points
  let maxDistance = 0
  let index = 0
  const first = points[0]
  const last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = distanceToSegment(points[i], first, last)
    if (d > maxDistance) {
      maxDistance = d
      index = i
    }
  }
  if (maxDistance <= tolerance) return [first, last]
  const left = simplifyPoints(points.slice(0, index + 1), tolerance)
  const right = simplifyPoints(points.slice(index), tolerance)
  return [...left.slice(0, -1), ...right]
}

// ---------- Robôs ----------

export function moveRobot(board, phaseKey, teamNumber, point) {
  return withPhase(board, phaseKey, (phase) => ({
    robots: { ...phase.robots, [teamNumber]: toFieldPoint(point) },
  }))
}

/**
 * Onde cada robô está numa fase. Robô que não foi movido nesta fase continua onde estava
 * na fase anterior (AUTO → TELEOP → FINAL); se nunca foi movido, fica na posição inicial.
 */
export function robotsFor(board, phaseKey, starts) {
  const positions = { ...starts }
  for (const { key } of PHASES) {
    Object.assign(positions, board.phases[key]?.robots ?? {})
    if (key === phaseKey) break
  }
  // Só os robôs da simulação atual (troca de equipe não deixa robô "fantasma").
  return Object.fromEntries(Object.keys(starts).map((team) => [team, positions[team]]))
}

// ---------- Desfazer / refazer ----------

const MAX_HISTORY = 50

export function createHistory(board) {
  return { past: [], present: board, future: [] }
}

export function commit(history, board) {
  if (board === history.present) return history
  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: board,
    future: [],
  }
}

export function undo(history) {
  if (!history.past.length) return history
  return {
    past: history.past.slice(0, -1),
    present: history.past.at(-1),
    future: [history.present, ...history.future],
  }
}

export function redo(history) {
  if (!history.future.length) return history
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
  }
}

// ---------- Guardar no aparelho ----------

/**
 * Cada confronto (as 4 equipes escolhidas) tem o próprio quadro.
 * { red: [16053, 8743], blue: [18002, null] } → "r16053-8743_b18002-0"
 */
export function matchupKey(slots) {
  const side = (list) => list.map((n) => n ?? 0).join('-')
  return `r${side(slots.red)}_b${side(slots.blue)}`
}

/** Guarda no máximo `max` quadros: os mais antigos saem (localStorage tem limite). */
export function trimBoards(boards, max = 20) {
  const entries = Object.entries(boards)
  if (entries.length <= max) return boards
  return Object.fromEntries(
    entries.sort(([, a], [, b]) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).slice(0, max),
  )
}

export function hasDrawing(board) {
  return PHASES.some(({ key }) => {
    const phase = board.phases[key]
    return phase && (phase.strokes.length > 0 || Object.keys(phase.robots).length > 0)
  })
}
