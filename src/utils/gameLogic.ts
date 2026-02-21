/**
 * Farkle 游戏逻辑模块
 * 游戏状态管理，无 DOM 操作
 */

import type { GameState, Die, DieValue } from '@/types/game'
import { isFarkle, validateSelection, getPossibleScores } from './scorer'

/**
 * 获胜所需分数
 */
export const WINNING_SCORE = 10000

/**
 * 创建初始游戏状态
 * @returns 初始游戏状态
 */
export function createInitialState(): GameState {
  return {
    players: [
      { id: 0, name: '玩家1', bankedScore: 0, lastRoundScore: 0 },
      { id: 1, name: '玩家2', bankedScore: 0, lastRoundScore: 0 }
    ],
    currentPlayer: 0,
    gamePhase: 'waiting',
    rolledDice: [],
    heldDice: [],
    unheldDice: [],
    currentRoundScore: 0,
    winner: null,
    message: '点击"开始游戏"'
  }
}

/**
 * 生成随机骰子
 * @param count - 要生成的骰子数量
 * @returns 骰子值数组
 */
export function rollDice(count: number): DieValue[] {
  const dice: DieValue[] = []
  for (let i = 0; i < count; i++) {
    dice.push((Math.floor(Math.random() * 6) + 1) as DieValue)
  }
  return dice
}

/**
 * 创建带索引的骰子对象数组
 * @param values - 骰子值数组
 * @param startIndex - 起始索引
 * @returns 带索引的骰子对象数组
 */
function createDiceWithIndex(values: DieValue[], startIndex: number): Die[] {
  return values.map((value, idx) => ({
    value,
    index: startIndex + idx,
    held: false
  }))
}

/**
 * 开始游戏
 * @param state - 当前游戏状态
 * @returns 新的游戏状态
 */
export function startGame(state: GameState): GameState {
  const rawDice = rollDice(6)
  const rolledDiceWithIndex = createDiceWithIndex(rawDice, 0)

  // 检查初始骰子是否是 Farkle
  if (isFarkle(rawDice)) {
    return {
      ...state,
      rolledDice: rolledDiceWithIndex,
      unheldDice: rolledDiceWithIndex,
      heldDice: [],
      currentRoundScore: 0,
      gamePhase: 'farkle',
      message: `${state.players[state.currentPlayer].name} 初始摇骰子 Farkle！骰子 ${rawDice.join(', ')} 无法计分`
    }
  }

  return {
    ...state,
    rolledDice: rolledDiceWithIndex,
    unheldDice: rolledDiceWithIndex,
    heldDice: [],
    currentRoundScore: 0,
    gamePhase: 'selecting',
    message: '选择要保留的骰子（至少选1个）'
  }
}

/**
 * 继续摇（保留骰子后摇剩余骰子）
 * @param state - 当前游戏状态
 * @param selectedIndices - 选中的骰子索引数组
 * @returns 新的游戏状态
 */
export function rollAgain(state: GameState, selectedIndices: number[]): GameState {
  // 获取选中的骰子值
  const selectedValues = selectedIndices.map(index => {
    const die = state.unheldDice.find(d => d.index === index)
    if (!die) {
      throw new Error(`骰子索引 ${index} 未找到`)
    }
    return die.value as DieValue
  })

  const allDiceValues = state.rolledDice.map(d => d.value as DieValue)
  const validation = validateSelection(allDiceValues, selectedValues)

  if (!validation.valid) {
    return {
      ...state,
      message: validation.description || '无效的选择！请选择可计分的骰子'
    }
  }

  // 计算新的得分
  const newRoundScore = state.currentRoundScore + validation.points

  // 更新上轮得分为本次选中的骰子得分
  const updatedPlayers = [...state.players]
  updatedPlayers[state.currentPlayer] = {
    ...updatedPlayers[state.currentPlayer],
    lastRoundScore: validation.points
  }

  // 获取要保留的骰子对象
  const diceToHold = selectedIndices
    .map(index => state.unheldDice.find(d => d.index === index))
    .filter((die): die is Die => die !== undefined)

  const newHeldDice = [...state.heldDice, ...diceToHold]

  // 计算要摇的骰子数量
  const unselectedDice = state.unheldDice.filter(d => !selectedIndices.includes(d.index))
  const diceToRoll = unselectedDice.length === 0 ? 6 : unselectedDice.length

  // 摇新骰子
  const newDice = rollDice(diceToRoll)

  // 检查新摇出的骰子是否 Farkle
  if (isFarkle(newDice)) {
    const rolledDiceWithIndex = createDiceWithIndex(newDice, state.rolledDice.length)

    return {
      ...state,
      players: updatedPlayers,
      rolledDice: rolledDiceWithIndex,
      heldDice: [],
      unheldDice: rolledDiceWithIndex,
      currentRoundScore: 0,
      gamePhase: 'farkle',
      message: `${state.players[state.currentPlayer].name} Farkle了！新摇出的骰子 ${newDice.join(', ')} 无法计分，本轮得分清空`
    }
  }

  // 正常：更新游戏状态
  const isHotDiceTurn = unselectedDice.length === 0
  const startIndex = isHotDiceTurn ? state.rolledDice.length : state.rolledDice.length + newHeldDice.length
  const rolledDiceWithIndex = createDiceWithIndex(newDice, startIndex)

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    currentRoundScore: newRoundScore,
    gamePhase: 'selecting'
  }

  if (isHotDiceTurn) {
    // Hot Dice：所有骰子都能计分，重置并摇6个新骰子
    newState.rolledDice = rolledDiceWithIndex
    newState.heldDice = []
    newState.unheldDice = rolledDiceWithIndex
  } else {
    // 普通情况：保留已选骰子，添加新骰子
    newState.rolledDice = [...newHeldDice, ...rolledDiceWithIndex]
    newState.heldDice = newHeldDice
    newState.unheldDice = rolledDiceWithIndex
  }

  // 检查新骰子是否全部能计分
  const newDiceScores = getPossibleScores(newDice)
  const maxDiceUsed = newDiceScores.length > 0 ? Math.max(...newDiceScores.map(s => s.diceUsed.length)) : 0
  const isAllScorable = newDiceScores.length > 0 && maxDiceUsed === newDice.length

  if (isAllScorable) {
    const bestScore = newDiceScores[0]
    newState.message = `Hot Dice！${bestScore.description}`
  } else {
    newState.message = '选择要保留的骰子（至少选1个）'
  }

  return newState
}

/**
 * 结束回合
 * @param state - 当前游戏状态
 * @param selectedIndices - 选中的骰子索引数组（可选）
 * @returns 新的游戏状态
 */
export function endTurn(state: GameState, selectedIndices: number[]): GameState {
  let totalScore = state.currentRoundScore

  // 如果有选中的骰子，需要先保留它们
  if (selectedIndices.length > 0) {
    const selectedValues = selectedIndices.map(index => {
      const die = state.rolledDice.find(d => d.index === index)
      if (!die) {
        throw new Error(`骰子索引 ${index} 未找到`)
      }
      return die.value as DieValue
    })

    const allDiceValues = state.rolledDice.map(d => d.value as DieValue)
    const validation = validateSelection(allDiceValues, selectedValues)

    if (!validation.valid) {
      return {
        ...state,
        message: validation.description || '无效的选择！请选择可计分的骰子'
      }
    }

    totalScore = state.currentRoundScore + validation.points
  }

  // 如果总分为0，不能结束回合
  if (totalScore === 0) {
    return {
      ...state,
      message: '必须选择骰子并保留后才能结束回合'
    }
  }

  const currentPlayer = state.players[state.currentPlayer]
  const newScore = currentPlayer.bankedScore + totalScore

  // 检查是否获胜
  if (newScore >= WINNING_SCORE) {
    const updatedPlayers = [...state.players]
    updatedPlayers[state.currentPlayer] = {
      ...currentPlayer,
      bankedScore: newScore
    }

    return {
      ...state,
      players: updatedPlayers,
      winner: state.currentPlayer,
      gamePhase: 'gameOver',
      message: `${currentPlayer.name} 获胜！总分：${newScore}`
    }
  }

  // 切换到下一个玩家
  const previousPlayer = state.currentPlayer
  const nextPlayer = (state.currentPlayer + 1) % 2

  const updatedPlayers = [...state.players]
  updatedPlayers[previousPlayer] = {
    ...currentPlayer,
    bankedScore: newScore,
    lastRoundScore: 0 // 清空上轮得分
  }

  // 为新玩家摇骰子
  const rawDice = rollDice(6)
  const rolledDiceWithIndex = createDiceWithIndex(rawDice, 0)

  return {
    ...state,
    players: updatedPlayers,
    currentPlayer: nextPlayer,
    gamePhase: 'selecting',
    rolledDice: rolledDiceWithIndex,
    heldDice: [],
    unheldDice: rolledDiceWithIndex,
    currentRoundScore: 0,
    message: '选择要保留的骰子（至少选1个）'
  }
}

/**
 * Farkle后切换玩家
 * @param state - 当前游戏状态
 * @returns 新的游戏状态
 */
export function switchPlayerAfterFarkle(state: GameState): GameState {
  // Farkle：上轮得分为0
  const currentPlayer = state.players[state.currentPlayer]
  const updatedPlayers = [...state.players]
  updatedPlayers[state.currentPlayer] = {
    ...currentPlayer,
    lastRoundScore: 0
  }

  const nextPlayer = (state.currentPlayer + 1) % 2
  const rawDice = rollDice(6)
  const rolledDiceWithIndex = createDiceWithIndex(rawDice, 0)

  // 检查新玩家是否也 Farkle
  if (isFarkle(rawDice)) {
    return {
      ...state,
      players: updatedPlayers,
      currentPlayer: nextPlayer,
      rolledDice: rolledDiceWithIndex,
      heldDice: [],
      unheldDice: rolledDiceWithIndex,
      currentRoundScore: 0,
      gamePhase: 'farkle',
      message: `${state.players[nextPlayer].name} 初始摇骰子也 Farkle！骰子 ${rawDice.join(', ')} 无法计分`
    }
  }

  return {
    ...state,
    players: updatedPlayers,
    currentPlayer: nextPlayer,
    rolledDice: rolledDiceWithIndex,
    heldDice: [],
    unheldDice: rolledDiceWithIndex,
    currentRoundScore: 0,
    gamePhase: 'selecting',
    message: '选择要保留的骰子（至少选1个）'
  }
}

/**
 * 新游戏
 * @returns 新的游戏状态
 */
export function newGame(): GameState {
  return createInitialState()
}
