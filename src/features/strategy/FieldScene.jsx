import { FIELD_SIZE } from './board-model.js'
import { ALLIANCE_COLORS, FIELD, ROBOT_SIZE, TILE } from './field-layout.js'

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
  const pad = 2
  const box = FIELD_SIZE + pad * 2

  return (
    <svg
      ref={svgRef}
      viewBox={`${-pad} ${-pad} ${box} ${box}`}
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

function Field({ rotated }) {
  const tiles = []
  for (let i = 1; i < FIELD_SIZE / TILE; i += 1) {
    tiles.push(
      <line key={`v${i}`} x1={i * TILE} y1={0} x2={i * TILE} y2={FIELD_SIZE} />,
      <line key={`h${i}`} x1={0} y1={i * TILE} x2={FIELD_SIZE} y2={i * TILE} />,
    )
  }
  const { hive } = FIELD
  const half = hive.width / 2

  return (
    <g>
      <rect x={0} y={0} width={FIELD_SIZE} height={FIELD_SIZE} fill="#f1f0f6" />
      <g stroke="#d6d4e6" strokeWidth={0.5}>
        {tiles}
      </g>

      {FIELD.gardens.map((g) => (
        <rect
          key={`garden-${g.alliance}`}
          x={g.x}
          y={g.y}
          width={g.width}
          height={g.height}
          fill={ALLIANCE_COLORS[g.alliance]}
          fillOpacity={0.12}
          stroke={ALLIANCE_COLORS[g.alliance]}
          strokeWidth={1}
        />
      ))}
      {FIELD.loadingZones.map((z) => (
        <rect
          key={`load-${z.alliance}`}
          x={z.x}
          y={z.y}
          width={z.width}
          height={z.height}
          fill="none"
          stroke={ALLIANCE_COLORS[z.alliance]}
          strokeWidth={1.5}
        />
      ))}

      {/* HIVE: estrutura no centro, metade de cada aliança */}
      <rect
        x={hive.x}
        y={hive.y}
        width={hive.width}
        height={hive.height}
        rx={3}
        fill="#ffffff"
        stroke="#3f3d6a"
        strokeWidth={1}
      />
      {['red', 'blue'].map((alliance, i) => (
        <rect
          key={alliance}
          x={hive.x + 4 + i * half}
          y={hive.y + 8}
          width={half - 8}
          height={hive.height - 16}
          rx={3}
          fill={ALLIANCE_COLORS[alliance]}
          fillOpacity={0.18}
          stroke={ALLIANCE_COLORS[alliance]}
          strokeWidth={1}
        />
      ))}
      <text
        x={FIELD_SIZE / 2}
        y={hive.y + hive.height / 2 + 2}
        textAnchor="middle"
        fontSize={6}
        fontWeight={700}
        fill="#3f3d6a"
        fontFamily="Saira, system-ui, sans-serif"
        transform={
          rotated ? `rotate(180 ${FIELD_SIZE / 2} ${hive.y + hive.height / 2})` : undefined
        }
      >
        HIVE
      </text>

      {FIELD.flowers.map((f, i) => (
        <g key={`flower-${i}`}>
          <circle cx={f.x} cy={f.y} r={5} fill="#ffffff" stroke="#167a4c" strokeWidth={1.2} />
          <circle cx={f.x} cy={f.y} r={1.8} fill="#e8b500" />
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
