import { FIELD_SIZE } from './board-model.js'
import { ALLIANCE_COLORS, FIELD, ROBOT_SIZE, TILE, VIEW } from './field-layout.js'

/**
 * Um quadro desenhado: campo + traços + robôs, em SVG.
 *
 * As cores vão em atributos (fill/stroke), não em classes CSS, de propósito:
 * assim o mesmo SVG vira imagem PNG ("Baixar imagem") sem perder nada.
 *
 * rotated: gira 180° para ver o campo do lado da outra aliança.
 * O <g data-field> é a camada em polegadas: o quadro usa ela para converter o toque.
 */
export default function FieldScene({
  strokes,
  liveStroke,
  robots,
  alliances,
  ownTeam,
  rotated = false,
  svgRef,
  fieldRef,
  label,
  ...svgProps
}) {
  return (
    <svg
      ref={svgRef}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      {...svgProps}
    >
      <g ref={fieldRef} data-field transform={rotated ? `rotate(180 72 72)` : undefined}>
        <Field rotated={rotated} />
        <ArrowMarkers />
        {strokes.map((stroke) => (
          <Stroke key={stroke.id} stroke={stroke} />
        ))}
        {liveStroke && <Stroke stroke={liveStroke} />}
        {Object.entries(robots).map(([team, position]) => (
          <Robot
            key={team}
            team={team}
            position={position}
            color={ALLIANCE_COLORS[alliances[team]] ?? '#5f5d8a'}
            own={Number(team) === ownTeam}
            rotated={rotated}
          />
        ))}
      </g>
    </svg>
  )
}

const FONT = 'Saira, system-ui, sans-serif'
const POLLEN = '#e8b500'

/** Texto que continua de pé quando o campo gira. */
function Label({ x, y, rotated, children, ...props }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontWeight={800}
      transform={rotated ? `rotate(180 ${x} ${y})` : undefined}
      dominantBaseline="middle"
      {...props}
    >
      {children}
    </text>
  )
}

/** CELL em forma de seta (como no campo): ponta para a direita ou esquerda. */
function cellPolygon({ x, width }, y, height, points) {
  const tip = 4
  const mid = y + height / 2
  return points === 'right'
    ? `${x},${y} ${x + width - tip},${y} ${x + width},${mid} ${x + width - tip},${y + height} ${x},${y + height}`
    : `${x + tip},${y} ${x + width},${y} ${x + width},${y + height} ${x + tip},${y + height} ${x},${mid}`
}

function Field({ rotated }) {
  const tiles = []
  for (let i = 1; i < FIELD_SIZE / TILE; i += 1) {
    tiles.push(
      <line key={`v${i}`} x1={i * TILE} y1={0} x2={i * TILE} y2={FIELD_SIZE} />,
      <line key={`h${i}`} x1={0} y1={i * TILE} x2={FIELD_SIZE} y2={i * TILE} />,
    )
  }
  const frame = FIELD.hiveFrame

  return (
    <g>
      <rect x={0} y={0} width={FIELD_SIZE} height={FIELD_SIZE} fill="#f1f0f6" />
      <g stroke="#d6d4e6" strokeWidth={0.5}>
        {tiles}
      </g>

      {/* GARDENS: faixa na parede com os 4 POLLEN do começo */}
      {FIELD.gardens.map((g) => (
        <g key={`garden-${g.alliance}`}>
          <rect
            x={g.x}
            y={g.y}
            width={g.width}
            height={g.height}
            fill={ALLIANCE_COLORS[g.alliance]}
          />
          {[0.15, 0.38, 0.62, 0.85].map((t) => (
            <circle
              key={t}
              cx={g.x + g.width / 2}
              cy={g.y + g.height * t}
              r={1.4}
              fill={POLLEN}
              stroke="#ffffff"
              strokeWidth={0.4}
            />
          ))}
        </g>
      ))}

      {/* LOADING ZONES: "U" aberto para a parede */}
      {FIELD.loadingZones.map((z) => {
        const wallY = z.wall === 'top' ? 0 : FIELD_SIZE
        const innerY = z.wall === 'top' ? z.height : FIELD_SIZE - z.height
        return (
          <path
            key={`load-${z.alliance}`}
            d={`M${z.x} ${wallY} V${innerY} H${z.x + z.width} V${wallY}`}
            fill="none"
            stroke={ALLIANCE_COLORS[z.alliance]}
            strokeWidth={1.6}
          />
        )
      })}

      {/* Estrutura das HIVES: linhas de cima e de baixo */}
      <g stroke="#9a98b8" strokeWidth={1.2}>
        <line x1={frame.x} y1={frame.y} x2={frame.x + frame.width} y2={frame.y} />
        <line
          x1={frame.x}
          y1={frame.y + frame.height}
          x2={frame.x + frame.width}
          y2={frame.y + frame.height}
        />
      </g>

      {/* HIVES: CELL para cima (branco, aceita lançamento) e para baixo (cheio) */}
      {FIELD.hives.map((hive) => {
        const color = ALLIANCE_COLORS[hive.alliance]
        const [left, right] = hive.cells
        const mid = hive.y + hive.height / 2
        return (
          <g key={hive.alliance}>
            <line
              x1={left.x + left.width}
              y1={mid}
              x2={right.x}
              y2={mid}
              stroke={color}
              strokeWidth={1.6}
            />
            {hive.cells.map((cell) => (
              <g key={cell.x}>
                <polygon
                  points={cellPolygon(cell, hive.y, hive.height, hive.points)}
                  fill={cell.up ? '#ffffff' : color}
                  fillOpacity={cell.up ? 1 : 0.25}
                  stroke={color}
                  strokeWidth={cell.up ? 1.4 : 0.9}
                />
                <Label
                  x={cell.x + cell.width / 2}
                  y={mid}
                  rotated={rotated}
                  fontSize={3.6}
                  fill={cell.up ? color : '#3f3d6a'}
                >
                  {cell.up ? 'CIMA' : 'BAIXO'}
                </Label>
              </g>
            ))}
          </g>
        )
      })}

      {/* FLOWERS nas paredes */}
      {FIELD.flowers.map((f, i) => (
        <g key={`flower-${i}`}>
          <circle cx={f.x} cy={f.y} r={3.4} fill={POLLEN} stroke="#a37800" strokeWidth={0.6} />
          <circle cx={f.x} cy={f.y} r={1.3} fill="#3f3d6a" />
        </g>
      ))}

      {/* Borda do campo */}
      <rect
        x={0}
        y={0}
        width={FIELD_SIZE}
        height={FIELD_SIZE}
        fill="none"
        stroke="#15142c"
        strokeWidth={1.5}
      />

      {/* Lado de cada aliança, fora do campo */}
      <Label x={FIELD_SIZE / 2} y={-4.5} rotated={rotated} fontSize={5} fill={ALLIANCE_COLORS.blue}>
        ALIANÇA AZUL
      </Label>
      <Label
        x={FIELD_SIZE / 2}
        y={FIELD_SIZE + 4.5}
        rotated={rotated}
        fontSize={5}
        fill={ALLIANCE_COLORS.red}
      >
        ALIANÇA VERMELHA
      </Label>
    </g>
  )
}

function ArrowMarkers() {
  // Uma ponta de seta por cor (o marker do SVG não herda a cor do traço).
  const colors = ['#15142c', ALLIANCE_COLORS.red, ALLIANCE_COLORS.blue, '#e8a300']
  return (
    <defs>
      {colors.map((color) => (
        <marker
          key={color}
          id={`arrow-${color.slice(1)}`}
          viewBox="0 0 10 10"
          refX={6}
          refY={5}
          markerWidth={4}
          markerHeight={4}
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill={color} />
        </marker>
      ))}
    </defs>
  )
}

function Stroke({ stroke }) {
  const d = stroke.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke.color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      markerEnd={stroke.kind === 'arrow' ? `url(#arrow-${stroke.color.slice(1)})` : undefined}
    />
  )
}

function Robot({ team, position, color, own, rotated }) {
  const [x, y] = position
  const half = ROBOT_SIZE / 2
  return (
    <g data-team={team} style={{ cursor: 'grab' }}>
      {/* Área de toque maior que o robô: fácil de pegar com o dedo */}
      <rect
        x={x - half - 4}
        y={y - half - 4}
        width={ROBOT_SIZE + 8}
        height={ROBOT_SIZE + 8}
        fill="transparent"
      />
      <rect
        x={x - half}
        y={y - half}
        width={ROBOT_SIZE}
        height={ROBOT_SIZE}
        rx={3}
        fill={color}
        stroke={own ? '#15142c' : '#ffffff'}
        strokeWidth={own ? 1.6 : 1}
      />
      {/* O texto gira junto com o campo; desvira para continuar legível */}
      <text
        x={x}
        y={y + 2}
        textAnchor="middle"
        fontSize={team.length > 4 ? 5.4 : 6.2}
        fontWeight={800}
        fill="#ffffff"
        fontFamily="Saira, system-ui, sans-serif"
        transform={rotated ? `rotate(180 ${x} ${y})` : undefined}
      >
        {team}
      </text>
    </g>
  )
}
