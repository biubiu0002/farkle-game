/**
 * Farkle 游戏逻辑模块
 * 游戏状态管理，无 DOM 操作
 */

// 使用全局胜利分数（可在游戏选项中设置）
const WINNING_SCORE = 10000

// 获取当前胜利分数
function getWinningScore() {
  return window.WINNING_SCORE || WINNING_SCORE
}

/**
 * 创建初始游戏状态
 */
function createInitialState() {
  return {
    players: [
      { id: 0, name: '玩家1', bankedScore: 0, lastRoundScore: 0 },
      { id: 1, name: '玩家2', bankedScore: 0, lastRoundScore: 0 }
    ],
    currentPlayer: 0,
    gamePhase: 'waiting',  // waiting, selecting, farkle, gameOver
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
 */
function rollDice(count) {
  const dice = []
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1)
  }
  return dice
}

/**
 * 开始游戏
 */
function startGame(state) {
  const rawDice = rollDice(6)
  const rolledDiceWithIndex = rawDice.map((value, idx) => ({ value, index: idx }))

  // 检查初始骰子是否是 Farkle
  if (window.Scorer.isFarkle(rawDice)) {
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
 */
function rollAgain(state, selectedIndices) {
  // 获取选中的骰子值
  const selectedValues = selectedIndices.map(index => {
    const die = state.unheldDice.find(d => d.index === index)
    return die.value
  })

  const validation = window.Scorer.validateSelection(state.rolledDice.map(d => d.value), selectedValues)
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
  const diceToHold = selectedIndices.map(index => {
    return state.unheldDice.find(d => d.index === index)
  }).filter(Boolean)

  const newHeldDice = [...state.heldDice, ...diceToHold]

  // 计算要摇的骰子数量
  const unselectedDice = state.unheldDice.filter(d => !selectedIndices.includes(d.index))
  const diceToRoll = unselectedDice.length === 0 ? 6 : unselectedDice.length

  // 摇新骰子
  const newDice = rollDice(diceToRoll)

  // 调试信息
  console.log('🎲 新摇出的骰子:', newDice)
  const farkleCheck = window.Scorer.isFarkle(newDice)
  console.log('🔍 isFarkle结果:', farkleCheck)
  const possibleScores = window.Scorer.getPossibleScores(newDice)
  console.log('📊 getPossibleScores返回:', possibleScores)

  // 检查新摇出的骰子是否 Farkle
  if (farkleCheck) {
    const rolledDiceWithIndex = newDice.map((value, idx) => ({
      value,
      index: state.rolledDice.length + idx
    }))

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
  const rolledDiceWithIndex = newDice.map((value, idx) => ({
    value,
    index: state.rolledDice.length + newHeldDice.length + idx
  }))

  const isHotDiceTurn = unselectedDice.length === 0

  let newState = {
    ...state,
    players: updatedPlayers,
    currentRoundScore: newRoundScore,
    gamePhase: 'selecting'
  }

  if (isHotDiceTurn) {
    newState.rolledDice = rolledDiceWithIndex
    newState.heldDice = []
    newState.unheldDice = rolledDiceWithIndex
  } else {
    newState.rolledDice = [...newHeldDice, ...rolledDiceWithIndex]
    newState.heldDice = newHeldDice
    newState.unheldDice = rolledDiceWithIndex
  }

  // 检查新骰子是否全部能计分
  const newDiceScores = window.Scorer.getPossibleScores(newDice)
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
 */
function endTurn(state, selectedIndices) {
  let totalScore = state.currentRoundScore

  // 如果有选中的骰子，需要先保留它们
  if (selectedIndices.length > 0) {
    const selectedValues = selectedIndices.map(index => {
      const die = state.rolledDice.find(d => d.index === index)
      return die.value
    })

    const validation = window.Scorer.validateSelection(state.rolledDice.map(d => d.value), selectedValues)
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
  if (newScore >= getWinningScore()) {
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
    lastRoundScore: 0  // 清空上轮得分
  }

  // 为新玩家摇骰子
  const rawDice = rollDice(6)
  const rolledDiceWithIndex = rawDice.map((value, idx) => ({ value, index: idx }))

  // 调试信息
  console.log('🎲 endTurn - 新玩家摇出的骰子:', rawDice)
  const farkleCheck = window.Scorer.isFarkle(rawDice)
  console.log('🔍 endTurn - isFarkle结果:', farkleCheck)
  const possibleScores = window.Scorer.getPossibleScores(rawDice)
  console.log('📊 endTurn - getPossibleScores返回:', possibleScores)

  // 检查新玩家的初始骰子是否Farkle
  if (farkleCheck) {
    return {
      ...state,
      players: updatedPlayers,
      currentPlayer: nextPlayer,
      gamePhase: 'farkle',
      rolledDice: rolledDiceWithIndex,
      heldDice: [],
      unheldDice: rolledDiceWithIndex,
      currentRoundScore: 0,
      message: `${state.players[nextPlayer].name} 初始摇骰子 Farkle！骰子 ${rawDice.join(', ')} 无法计分`
    }
  }

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
 */
function switchPlayerAfterFarkle(state) {
  // Farkle：上轮得分为0
  const currentPlayer = state.players[state.currentPlayer]
  const updatedPlayers = [...state.players]
  updatedPlayers[state.currentPlayer] = {
    ...currentPlayer,
    lastRoundScore: 0
  }

  const nextPlayer = (state.currentPlayer + 1) % 2
  const rawDice = rollDice(6)
  const rolledDiceWithIndex = rawDice.map((value, idx) => ({ value, index: idx }))

  // 检查新玩家是否也 Farkle
  if (window.Scorer.isFarkle(rawDice)) {
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
 */
function newGame() {
  return createInitialState()
}

// 导出为模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWinningScore,
    createInitialState,
    rollDice,
    startGame,
    rollAgain,
    endTurn,
    switchPlayerAfterFarkle,
    newGame
  }
} else {
  window.GameLogic = {
    getWinningScore,
    createInitialState,
    rollDice,
    startGame,
    rollAgain,
    endTurn,
    switchPlayerAfterFarkle,
    newGame
  }
}
