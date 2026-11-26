import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { OWN_TEAM } from '../../config/team.js'
import { createLocalStore } from '../../lib/local-store.js'
import { createId } from '../../lib/ids.js'
import {
  PHASES,
  addStroke,
  clearPhase,
  commit,
  createHistory,
  emptyBoard,
  hasDrawing,
  matchupKey,
  moveRobot,
  redo,
  removeStrokes,
  robotsFor,
  simplifyPoints,
  strokesNear,
  toFieldPoint,
  trimBoards,
  undo,
} from './board-model.js'
import { exportBoardImage } from './export-image.js'
import FieldScene from './FieldScene.jsx'
import { ALLIANCE_COLORS, LAYOUT_CONFIRMED, allianceOf, startPositions } from './field-layout.js'

const COLORS = [
  { value: '#15142c', label: 'Preto' },
  { value: ALLIANCE_COLORS.red, label: 'Vermelho' },
  { value: ALLIANCE_COLORS.blue, label: 'Azul' },
  { value: '#e8a300', label: 'Amarelo' },
]

const TOOLS = [
  { value: 'pen', label: 'Caneta' },
  { value: 'arrow', label: 'Seta' },
  { value: 'eraser', label: 'Borracha' },
]

/** Raio da borracha e distância mínima entre pontos do traço, em polegadas do campo. */
const ERASER_RADIUS = 4
const MIN_STEP = 0.5

/** Quadros guardados por evento, no aparelho (não vão para o banco). */
const stores = new Map()
function boardsStoreFor(eventId) {
  if (!stores.has(eventId)) stores.set(eventId, createLocalStore(`scouting:boards:${eventId}`, {}))
  return stores.get(eventId)
}

/**
 * Quadro da arena para rabiscar a estratégia da partida simulada.
 * Cada confronto (as 4 equipes) tem o próprio quadro, guardado só neste aparelho.
 * O pai troca a `key` quando as equipes mudam, e o quadro recomeça do certo.
 */
export default function StrategyBoard({ eventId, slots, title }) {
  const store = boardsStoreFor(eventId)
  const key = matchupKey(slots)
  const [history, setHistory] = useState(() => createHistory(store.get()[key] ?? emptyBoard()))
  const [phase, setPhase] = useState('auto')
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(COLORS[0].value)
  const [rotated, setRotated] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [exporting, setExporting] = useState(false)
  // Gesto em andamento: traço sendo feito, robô sendo arrastado ou borracha passando.
  const [gesture, setGesture] = useState(null)

  const svgRef = useRef(null)
  const fieldRef = useRef(null)

  const board = gesture?.board ?? history.present
  const starts = startPositions(slots)
  const alliances = allianceOf(slots)
  const robots = robotsFor(board, phase, starts)
  if (gesture?.robot) robots[gesture.robot] = gesture.position
  const strokes = board.phases[phase]?.strokes ?? []

  /** Guarda cada versão nova no aparelho e no histórico (para desfazer). */
  function save(next) {
    setHistory((h) => commit(h, next))
    store.set((all) => trimBoards({ ...all, [key]: next }))
  }

  function travel(move) {
    setHistory((h) => {
      const next = move(h)
      store.set((all) => ({ ...all, [key]: next.present }))
      return next
    })
  }

  /** Posição do dedo na tela → polegadas do campo (já desfaz o giro do campo). */
  function toField(event) {
    const svg = svgRef.current
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const field = point.matrixTransform(fieldRef.current.getScreenCTM().inverse())
    return toFieldPoint([field.x, field.y])
  }

  function onPointerDown(event) {
    if (!event.isPrimary || event.button > 0) return
    event.preventDefault()
    svgRef.current.setPointerCapture(event.pointerId)
    setConfirmClear(false)
    const point = toField(event)
    const robot = event.target.closest?.('[data-team]')?.dataset.team

    if (robot && tool !== 'eraser') {
      setGesture({ robot, position: point })
    } else if (tool === 'eraser') {
      setGesture({
        board: removeStrokes(history.present, phase, strokesNear(strokes, point, ERASER_RADIUS)),
      })
    } else {
      setGesture({ points: [point] })
    }
  }

  function onPointerMove(event) {
    if (!gesture || !event.isPrimary) return
    const point = toField(event)
    if (gesture.robot) {
      setGesture({ ...gesture, position: point })
    } else if (gesture.board) {
      const current = gesture.board.phases[phase].strokes
      setGesture({
        board: removeStrokes(gesture.board, phase, strokesNear(current, point, ERASER_RADIUS)),
      })
    } else if (gesture.points) {
      const last = gesture.points.at(-1)
      if (Math.hypot(point[0] - last[0], point[1] - last[1]) >= MIN_STEP) {
        setGesture({ points: [...gesture.points, point] })
      }
    }
  }

  function onPointerUp() {
    if (!gesture) return
    if (gesture.robot) {
      save(moveRobot(history.present, phase, gesture.robot, gesture.position))
    } else if (gesture.board) {
      if (gesture.board !== history.present) save(gesture.board)
    } else if (gesture.points?.length > 1) {
      save(
        addStroke(history.present, phase, {
          id: createId(),
          kind: tool === 'arrow' ? 'arrow' : 'pen',
          color,
          points: simplifyPoints(gesture.points),
        }),
      )
    }
    setGesture(null)
  }

  // Tela cheia: Esc sai, e a página atrás não rola.
  useEffect(() => {
    if (!fullscreen) return undefined
    const onKey = (event) => event.key === 'Escape' && setFullscreen(false)
    window.addEventListener('keydown', onKey)
    document.body.classList.add('no-scroll')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('no-scroll')
    }
  }, [fullscreen])

  async function download() {
    setExporting(true)
    try {
      await exportBoardImage({ board: history.present, starts, alliances, rotated, title })
    } finally {
      setExporting(false)
    }
  }

  const liveStroke = gesture?.points
    ? { id: 'live', kind: tool === 'arrow' ? 'arrow' : 'pen', color, points: gesture.points }
    : null
  const empty = !hasDrawing(history.present)

  return (
    <section
      className={`strategy-board ${fullscreen ? 'is-fullscreen' : ''}`}
      aria-label="Quadro da arena"
    >
      <div className="strategy-board__top">
        <div className="board-phases" role="tablist" aria-label="Fase da partida">
          {PHASES.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={phase === p.key}
              className={phase === p.key ? 'is-selected' : ''}
              onClick={() => {
                setPhase(p.key)
                setConfirmClear(false)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="board-actions">
          <IconButton
            label={rotated ? 'Ver do lado vermelho' : 'Ver do lado azul'}
            icon="swap"
            onClick={() => setRotated((r) => !r)}
          />
          <IconButton
            label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            icon={fullscreen ? 'close' : 'expand'}
            onClick={() => setFullscreen((f) => !f)}
          />
        </div>
      </div>

      <div className="strategy-board__canvas">
        <FieldScene
          svgRef={svgRef}
          fieldRef={fieldRef}
          strokes={strokes}
          liveStroke={liveStroke}
          robots={robots}
          alliances={alliances}
          ownTeam={OWN_TEAM.number}
          rotated={rotated}
          label={`Campo, fase ${PHASES.find((p) => p.key === phase).label}`}
          className={`board-svg tool-${tool}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      <div className="board-toolbar">
        <div className="board-tools" role="group" aria-label="Ferramenta">
          {TOOLS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={tool === t.value ? 'is-selected' : ''}
              aria-pressed={tool === t.value}
              onClick={() => setTool(t.value)}
            >
              <Icon name={t.value} size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="board-colors" role="group" aria-label="Cor">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={color === c.value ? 'is-selected' : ''}
              aria-pressed={color === c.value}
              aria-label={c.label}
              title={c.label}
              style={{ '--swatch': c.value }}
              onClick={() => {
                setColor(c.value)
                if (tool === 'eraser') setTool('pen')
              }}
            />
          ))}
        </div>
        <div className="board-history">
          <IconButton
            label="Desfazer"
            icon="undo"
            disabled={!history.past.length}
            onClick={() => travel(undo)}
          />
          <IconButton
            label="Refazer"
            icon="redo"
            disabled={!history.future.length}
            onClick={() => travel(redo)}
          />
          {confirmClear ? (
            <button
              type="button"
              className="button button--small board-clear-confirm"
              onClick={() => {
                save(clearPhase(history.present, phase))
                setConfirmClear(false)
              }}
            >
              Limpar {PHASES.find((p) => p.key === phase).label}?
            </button>
          ) : (
            <IconButton
              label="Limpar esta fase"
              icon="trash"
              disabled={
                !strokes.length && !Object.keys(history.present.phases[phase]?.robots ?? {}).length
              }
              onClick={() => setConfirmClear(true)}
            />
          )}
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={download}
            disabled={exporting || empty}
          >
            <Icon name="download" size={18} />
            {exporting ? 'Gerando…' : 'Baixar imagem'}
          </button>
        </div>
      </div>

      <p className="muted board-hint">
        Arraste os robôs com o dedo. Cada fase tem o próprio desenho; robô não movido continua onde
        estava na fase anterior. Fica salvo só neste aparelho.
        {!LAYOUT_CONFIRMED &&
          ' Campo em esquema provisório: as posições das FLOWERS, GARDENS e LOADING ZONES ainda serão conferidas com o manual.'}
      </p>
    </section>
  )
}

function IconButton({ label, icon, onClick, disabled }) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={20} />
    </button>
  )
}
