/**
 * Farkle 游戏核心逻辑
 */

import { DieValue, getPossibleScores, isFarkle, validateSelection } from './scorer'

export type PlayerId = 0 | 1

export interface Player {
  id: PlayerId
  name: string
  bankedScore: number
}

export interface GameState {
  players: Player[]
  currentPlayer: PlayerId
  gamePhase: 'waiting' | 'rolling' | 'selecting' | 'farkle' | 'gameOver'
  dice: DieValue[]
  heldDice: DieValue[]
  remainingDice: DieValue[]
  currentRoundScore: number
  isHotDice: boolean
  winner: PlayerId | null
  message: string
}

export interface GameAction {
  type: 'START_GAME' | 'ROLL_DICE' | 'HOLD_DICE' | 'BANK' | 'RESET_TURN' | 'NEW_GAME'
  payload?: any
}

const WINNING_SCORE = 10000

/**
 * 创建初始游戏状态
 */
export function createInitialState(): GameState {
  return {
    players: [
      { id: 0, name: '玩家1', bankedScore: 0 },
      { id: 1, name: '玩家2', bankedScore: 0 }
    ],
    currentPlayer: 0,
    gamePhase: 'waiting',
    dice: [],
    heldDice: [],
    remainingDice: [],
    currentRoundScore: 0,
    isHotDice: false,
    winner: null,
    message: '点击"开始游戏"'
  }
}

/**
 * 生成随机骰子
 */
export function rollDice(count: number): DieValue[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1 as DieValue)
}

/**
 * 开始游戏
 */
export function startGame(state: GameState): GameState {
  return {
    ...state,
    gamePhase: 'rolling',
    message: '玩家1，点击"掷骰子"开始'
  }
}

/**
 * 掷骰子
 */
export function rollDiceAction(state: GameState): GameState {
  if (state.gamePhase !== 'rolling') {
    return state
  }

  // 第一次掷骰子或 Hot Dice（剩余为0）用6个，否则用剩余骰子
  const diceToRoll = state.heldDice.length === 0 || state.remainingDice.length === 0 ? 6 : state.remainingDice.length
  const newDice = rollDice(diceToRoll)

  // 检查是否Farkle
  if (isFarkle(newDice)) {
    return {
      ...state,
      dice: newDice,
      heldDice: [],
      remainingDice: newDice,
      currentRoundScore: 0,
      isHotDice: false,
      gamePhase: 'farkle',
      message: `${state.players[state.currentPlayer].name} Farkle了！失去未存分数，轮到下一位`
    }
  }

  // Hot Dice检查（如果骰子全部可以计分）
  const possibleScores = getPossibleScores(newDice)
  const totalDiceInScores = possibleScores.reduce((max, curr) =>
    curr.diceUsed.length > max ? curr.diceUsed.length : max, 0)

  const isHotDice = totalDiceInScores === newDice.length

  return {
    ...state,
    dice: newDice,
    heldDice: [],
    remainingDice: newDice,
    isHotDice,
    gamePhase: 'selecting',
    message: `选择要保留的骰子${isHotDice ? '（Hot Dice！全部可用）' : ''}`
  }
}

/**
 * 保留骰子
 */
export function holdDice(state: GameState, diceToHold: DieValue[]): GameState {
  if (state.gamePhase !== 'selecting') {
    return state
  }

  // 验证选择
  const validation = validateSelection(state.dice, diceToHold)
  if (!validation.valid) {
    return {
      ...state,
      message: '无效的选择！请选择可计分的骰子'
    }
  }

  // 检查骰子是否足够（不能选择超出可用数量的骰子）
  const diceCounts: { [key: number]: number } = {}
  state.dice.forEach(d => diceCounts[d] = (diceCounts[d] || 0) + 1)
  
  // 统计已保留的骰子
  const heldCounts: { [key: number]: number } = {}
  state.heldDice.forEach(d => heldCounts[d] = (heldCounts[d] || 0) + 1)
  
  // 统计要保留的骰子
  const toHoldCounts: { [key: number]: number } = {}
  diceToHold.forEach(d => toHoldCounts[d] = (toHoldCounts[d] || 0) + 1)
  
  // 验证：已保留 + 要保留 <= 可用骰子
  for (const [value, count] of Object.entries(toHoldCounts)) {
    const v = parseInt(value) as DieValue
    const available = diceCounts[v] - (heldCounts[v] || 0)
    if (count > available) {
      return {
        ...state,
        message: `选择了过多的骰子 ${v}！`
      }
    }
  }

  // 计算新分数
  const newRoundScore = state.currentRoundScore + validation.points
  const newHeldDice = [...state.heldDice, ...diceToHold]

  // 计算剩余骰子（从当前剩余骰子中移除要保留的骰子）
  const usedDice = [...diceToHold]
  const newRemainingDice = state.remainingDice.filter(d => {
    const idx = usedDice.indexOf(d)
    if (idx > -1) {
      usedDice.splice(idx, 1)
      return false
    }
    return true
  })

  // 检查是否所有骰子都被使用（Hot Dice可以重置）
  const canRollAgain = newRemainingDice.length === 0 || state.isHotDice

  return {
    ...state,
    heldDice: newHeldDice,
    remainingDice: newRemainingDice,
    currentRoundScore: newRoundScore,
    gamePhase: canRollAgain ? 'rolling' : 'selecting',
    message: `本轮得分：${newRoundScore}${canRollAgain ? '，可以继续掷' : '，继续选择或存分'}`
  }
}

/**
 * 存分
 */
export function bankScore(state: GameState): GameState {
  if (state.gamePhase !== 'selecting' || state.currentRoundScore === 0) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayer]
  const newScore = currentPlayer.bankedScore + state.currentRoundScore

  // 检查是否获胜
  if (newScore >= WINNING_SCORE) {
    return {
      ...state,
      players: state.players.map((p, idx) =>
        idx === state.currentPlayer
          ? { ...p, bankedScore: newScore }
          : p
      ),
      winner: state.currentPlayer,
      gamePhase: 'gameOver',
      message: `${currentPlayer.name} 获胜！总分：${newScore}`
    }
  }

  // 切换玩家
  const nextPlayer = (state.currentPlayer + 1) as PlayerId

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === state.currentPlayer
        ? { ...p, bankedScore: newScore }
        : p
    ),
    currentPlayer: nextPlayer,
    gamePhase: 'rolling',
    dice: [],
    heldDice: [],
    remainingDice: [],
    currentRoundScore: 0,
    isHotDice: false,
    message: `${state.players[nextPlayer].name}，点击"掷骰子"`
  }
}

/**
 * 处理Farkle后切换玩家
 */
export function switchPlayerAfterFarkle(state: GameState): GameState {
  const nextPlayer = (state.currentPlayer + 1) as PlayerId

  return {
    ...state,
    currentPlayer: nextPlayer,
    gamePhase: 'rolling',
    dice: [],
    heldDice: [],
    remainingDice: [],
    currentRoundScore: 0,
    isHotDice: false,
    message: `${state.players[nextPlayer].name}，点击"掷骰子"`
  }
}

/**
 * 新游戏
 */
export function newGame(state: GameState): GameState {
  return {
    ...createInitialState(),
    message: '点击"开始游戏"'
  }
}

/**
 * 游戏状态机
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return startGame(state)

    case 'ROLL_DICE':
      return rollDiceAction(state)

    case 'HOLD_DICE':
      return holdDice(state, action.payload)

    case 'BANK':
      return bankScore(state)

    case 'RESET_TURN':
      return switchPlayerAfterFarkle(state)

    case 'NEW_GAME':
      return newGame(state)

    default:
      return state
  }
}
