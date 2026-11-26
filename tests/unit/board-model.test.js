import { describe, expect, it } from 'vitest'
import {
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
} from '../../src/features/strategy/board-model.js'

const line = (id, points) => ({ id, kind: 'pen', color: '#000', points })

describe('traços', () => {
  it('adiciona traço só na fase certa e ignora toque sem arrasto', () => {
    let board = addStroke(
      emptyBoard(),
      'auto',
      line('a', [
        [0, 0],
        [10, 10],
      ]),
    )
    board = addStroke(board, 'auto', line('ponto', [[5, 5]]))
    expect(board.phases.auto.strokes.map((s) => s.id)).toEqual(['a'])
    expect(board.phases.teleop.strokes).toEqual([])
  })

  it('borracha acha o traço perto do toque, mesmo no meio de um segmento', () => {
    const strokes = [
      line('reta', [
        [0, 0],
        [100, 0],
      ]),
      line('longe', [
        [0, 50],
        [10, 50],
      ]),
    ]
    expect(strokesNear(strokes, [50, 2], 3)).toEqual(['reta'])
    expect(strokesNear(strokes, [50, 20], 3)).toEqual([])
  })

  it('apaga e limpa', () => {
    let board = addStroke(
      emptyBoard(),
      'auto',
      line('a', [
        [0, 0],
        [1, 1],
      ]),
    )
    board = addStroke(
      board,
      'auto',
      line('b', [
        [0, 0],
        [1, 1],
      ]),
    )
    expect(removeStrokes(board, 'auto', ['a']).phases.auto.strokes.map((s) => s.id)).toEqual(['b'])
    expect(clearPhase(board, 'auto').phases.auto.strokes).toEqual([])
  })

  it('simplifica traço reto feito no dedo para só as pontas', () => {
    const shaky = Array.from({ length: 50 }, (_, i) => [i, i % 2 === 0 ? 0 : 0.2])
    expect(simplifyPoints(shaky)).toEqual([
      [0, 0],
      [49, 0.2],
    ])
  })

  it('mantém a curva quando ela importa', () => {
    const corner = [
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 5],
      [10, 10],
    ]
    expect(simplifyPoints(corner)).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
    ])
  })

  it('ponto fica dentro do campo, com uma casa decimal', () => {
    expect(toFieldPoint([-3, 200.456])).toEqual([0, 144])
    expect(toFieldPoint([10.04, 20.06])).toEqual([10, 20.1])
  })
})

describe('robôs por fase', () => {
  const starts = { 16053: [10, 40], 8743: [10, 100] }

  it('sem movimento, fica na posição inicial', () => {
    expect(robotsFor(emptyBoard(), 'final', starts)).toEqual(starts)
  })

  it('posição movida no AUTO continua no TELEOP até ser movida de novo', () => {
    let board = moveRobot(emptyBoard(), 'auto', 16053, [60, 60])
    expect(robotsFor(board, 'teleop', starts)[16053]).toEqual([60, 60])
    board = moveRobot(board, 'teleop', 16053, [100, 20])
    expect(robotsFor(board, 'auto', starts)[16053]).toEqual([60, 60])
    expect(robotsFor(board, 'final', starts)[16053]).toEqual([100, 20])
  })

  it('robô que saiu da simulação não aparece', () => {
    const board = moveRobot(emptyBoard(), 'auto', 99999, [1, 1])
    expect(Object.keys(robotsFor(board, 'auto', starts))).toEqual(['8743', '16053'])
  })
})

describe('desfazer e refazer', () => {
  it('volta e avança entre versões', () => {
    const a = addStroke(
      emptyBoard(),
      'auto',
      line('a', [
        [0, 0],
        [1, 1],
      ]),
    )
    const b = addStroke(
      a,
      'auto',
      line('b', [
        [0, 0],
        [1, 1],
      ]),
    )
    let history = commit(commit(createHistory(emptyBoard()), a), b)
    history = undo(history)
    expect(history.present).toBe(a)
    history = redo(history)
    expect(history.present).toBe(b)
  })

  it('desenhar depois de desfazer descarta o "refazer"', () => {
    const a = addStroke(
      emptyBoard(),
      'auto',
      line('a', [
        [0, 0],
        [1, 1],
      ]),
    )
    const c = addStroke(
      emptyBoard(),
      'auto',
      line('c', [
        [0, 0],
        [1, 1],
      ]),
    )
    const history = commit(undo(commit(createHistory(emptyBoard()), a)), c)
    expect(history.future).toEqual([])
  })
})

describe('guardar no aparelho', () => {
  it('cada confronto tem uma chave própria', () => {
    expect(matchupKey({ red: [16053, 8743], blue: [18002, null] })).toBe('r16053-8743_b18002-0')
  })

  it('guarda só os quadros mais recentes', () => {
    const boards = {
      velho: { updatedAt: 1 },
      novo: { updatedAt: 3 },
      meio: { updatedAt: 2 },
    }
    expect(Object.keys(trimBoards(boards, 2))).toEqual(['novo', 'meio'])
  })

  it('sabe se o quadro tem algo desenhado', () => {
    expect(hasDrawing(emptyBoard())).toBe(false)
    expect(hasDrawing(moveRobot(emptyBoard(), 'final', 1, [2, 2]))).toBe(true)
  })
})
