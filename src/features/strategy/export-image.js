import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { OWN_TEAM } from '../../config/team.js'
import { PHASES, robotsFor } from './board-model.js'
import FieldScene from './FieldScene.jsx'
import { VIEW } from './field-layout.js'

const PANEL = 640
/** Altura de cada painel, na mesma proporção do campo com os nomes das alianças. */
const PANEL_H = Math.round((PANEL * VIEW.height) / VIEW.width)
const GAP = 28
const MARGIN = 32
const HEADER = 96
const FONT = "'Saira Variable', system-ui, sans-serif"

/**
 * Desenha as 3 fases do quadro lado a lado numa imagem PNG e entrega ao usuário.
 *
 * Reaproveita o MESMO componente do quadro (FieldScene): renderiza fora da tela,
 * transforma cada SVG em imagem e junta tudo num canvas. No celular, abre o menu de
 * compartilhar (dá para mandar direto no grupo); no computador, baixa o arquivo.
 */
export async function exportBoardImage({ board, starts, alliances, rotated, title }) {
  const svgs = renderPhases({ board, starts, alliances, rotated })

  const width = MARGIN * 2 + PANEL * PHASES.length + GAP * (PHASES.length - 1)
  const height = MARGIN * 2 + HEADER + PANEL_H
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#15142c'
  ctx.font = `800 34px ${FONT}`
  ctx.fillText(title, MARGIN, MARGIN + 30)

  for (const [index, phase] of PHASES.entries()) {
    const x = MARGIN + index * (PANEL + GAP)
    const y = MARGIN + HEADER
    ctx.fillStyle = '#3f3d6a'
    ctx.font = `700 24px ${FONT}`
    ctx.fillText(phase.label, x, y - 16)
    const image = await svgToImage(svgs[index])
    ctx.drawImage(image, x, y, PANEL, PANEL_H)
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const name = `estrategia-${title.replace(/[^\w-]+/g, '-').toLowerCase()}.png`
  const file = new File([blob], name, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return
    } catch (error) {
      // Fechou o menu de compartilhar sem escolher: tudo bem, não baixa nada.
      if (error.name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Renderiza cada fase num <div> fora da tela e devolve o texto SVG de cada uma. */
function renderPhases({ board, starts, alliances, rotated }) {
  const host = document.createElement('div')
  const root = createRoot(host)
  try {
    return PHASES.map(({ key }) => {
      flushSync(() => {
        root.render(
          createElement(FieldScene, {
            strokes: board.phases[key]?.strokes ?? [],
            robots: robotsFor(board, key, starts),
            alliances,
            ownTeam: OWN_TEAM.number,
            rotated,
            width: PANEL,
            height: PANEL_H,
          }),
        )
      })
      return host.innerHTML
    })
  } finally {
    root.unmount()
  }
}

function svgToImage(markup) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = reject
    image.src = url
  })
}
