console.log('Farkle游戏已加载 - 版本 v1.9 - 修复玩家2骰子显示问题');

// 骰子计分逻辑
function countDice(dice) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  dice.forEach(d => {
    if (d !== undefined && d !== null) {
      counts[d]++
    }
  })
  return counts
}

function isStraight(counts) {
  return Object.values(counts).every(c => c === 1)
}

function isThreePairs(counts) {
  const pairs = Object.values(counts).filter(c => c === 2)
  return pairs.length === 3
}

function getTripleScore(value) {
  if (value === 1) return 1000
  return value * 100
}

function getNOfAKindScore(value, count) {
  if (count === 4) return 1000
  if (count === 5) return 2000
  if (count === 6) return 3000
  return 0
}

function getSingleScore(value) {
  if (value === 1) return 100
  if (value === 5) return 50
  return 0
}

function getPossibleScores(dice) {
  if (!dice || dice.length === 0) return []

  const counts = countDice(dice)
  const results = []

  // 顺子 (1-2-3-4-5-6) = 2500分
  if (isStraight(counts)) {
    results.push({ points: 2500, diceUsed: [...dice], description: '顺子' })
    return results
  }

  // 三对 = 1500分
  if (isThreePairs(counts)) {
    results.push({ points: 1500, diceUsed: [...dice], description: '三对' })
    return results
  }

  // 四/五/六个相同
  Object.entries(counts).forEach(([value, count]) => {
    const dieValue = parseInt(value)
    if (count >= 4) {
      const score = getNOfAKindScore(dieValue, count)
      const usedDice = Array(count).fill(dieValue)
      results.push({ points: score, diceUsed: usedDice, description: `${count}个${dieValue}` })
    }
  })

  // 三个相同
  Object.entries(counts).forEach(([value, count]) => {
    const dieValue = parseInt(value)
    if (count >= 3) {
      const score = getTripleScore(dieValue)
      const usedDice = Array(3).fill(dieValue)
      results.push({ points: score, diceUsed: usedDice, description: `三个${dieValue}` })
    }
  })

  // 单个1和5
  Object.entries(counts).forEach(([value, count]) => {
    const dieValue = parseInt(value)
    if (dieValue === 1 || dieValue === 5) {
      const singleScore = getSingleScore(dieValue)
      const usedDice = Array(count).fill(dieValue)
      results.push({ points: singleScore * count, diceUsed: usedDice, description: count > 1 ? `${count}个${dieValue}` : `${dieValue}` })
    }
  })

  // 去重 - 使用Set避免重复组合
  const uniqueResults = []
  const seen = new Set()

  for (const result of results) {
    const key = `${result.diceUsed.sort().join(',')}-${result.points}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueResults.push(result)
    }
  }

  return uniqueResults.sort((a, b) => b.points - a.points)
}

function isFarkle(dice) {
  if (!dice || dice.length === 0) return true
  return getPossibleScores(dice).length === 0
}

function validateSelection(dice, selected) {
  if (!dice || !selected || dice.length === 0 || selected.length === 0) {
    return { valid: false, points: 0, description: '无效选择' }
  }

  const selectedCounts = countDice(selected)

  // 顺子
  if (selected.length === 6 && isStraight(selectedCounts)) {
    return { valid: true, points: 2500, description: '顺子' }
  }

  // 三对
  if (selected.length === 6 && isThreePairs(selectedCounts)) {
    return { valid: true, points: 1500, description: '三对' }
  }

  // 四/五/六个相同
  for (const [value, count] of Object.entries(selectedCounts)) {
    const dieValue = parseInt(value)
    if (count >= 4) {
      const score = getNOfAKindScore(dieValue, count)
      return { valid: true, points: score, description: `${count}个${dieValue}` }
    }
  }

  // 三个相同
  for (const [value, count] of Object.entries(selectedCounts)) {
    const dieValue = parseInt(value)
    if (count >= 3) {
      const score = getTripleScore(dieValue)
      return { valid: true, points: score, description: `三个${dieValue}` }
    }
  }

  // 单个1和5
  let totalScore = 0
  for (const [value, count] of Object.entries(selectedCounts)) {
    const dieValue = parseInt(value)
    if (dieValue === 1 || dieValue === 5) {
      totalScore += getSingleScore(dieValue) * count
    }
  }

  if (totalScore > 0) {
    return { valid: true, points: totalScore, description: totalScore.toString() }
  }

  return { valid: false, points: 0, description: '无效选择' }
}

// 游戏逻辑
const WINNING_SCORE = 10000

let gameState = {
  players: [
    { id: 0, name: '玩家1', bankedScore: 0 },
    { id: 1, name: '玩家2', bankedScore: 0 }
  ],
  currentPlayer: 0,
  gamePhase: 'waiting',  // waiting, selecting, farkle, gameOver
  rolledDice: [],      // 当前摇出的骰子（带索引）
  heldDice: [],        // 已保留的骰子（带索引）
  unheldDice: [],      // 未保留的骰子（带索引）
  currentRoundScore: 0,
  winner: null,
  message: '点击"开始游戏"'
}

let selectedDiceIndices = []  // 当前选中的骰子索引

function rollDice(count) {
  console.log('rollDice 被调用，生成', count, '个骰子');
  const dice = []
  for (let i = 0; i < count; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1)
  }
  console.log('rollDice 生成的骰子:', dice);
  return dice
}

function updateUI() {
  console.log('更新UI - 当前状态:', gameState.gamePhase);
  
  // 更新玩家分数
  document.getElementById('score0').textContent = gameState.players[0].bankedScore
  document.getElementById('score1').textContent = gameState.players[1].bankedScore

  // 更新当前玩家高亮
  document.getElementById('player0').classList.toggle('active', gameState.currentPlayer === 0)
  document.getElementById('player1').classList.toggle('active', gameState.currentPlayer === 1)

  // 更新消息
  document.getElementById('message').textContent = gameState.message

  // 更新回合得分
  const roundScoreEl = document.getElementById('roundScore')
  if (gameState.currentRoundScore > 0) {
    roundScoreEl.style.display = 'block'
    document.getElementById('roundScoreValue').textContent = gameState.currentRoundScore
  } else {
    roundScoreEl.style.display = 'none'
  }

  // 更新骰子显示
  const heldSection = document.getElementById('heldSection')
  const remainingSection = document.getElementById('remainingSection')

  if (gameState.heldDice.length > 0) {
    heldSection.style.display = 'block'
    renderDice('heldDice', gameState.heldDice, true)
  } else {
    heldSection.style.display = 'none'
  }

  if (gameState.unheldDice.length > 0 && gameState.gamePhase === 'selecting') {
    remainingSection.style.display = 'block'
    renderDice('remainingDice', gameState.unheldDice, false)
  } else {
    remainingSection.style.display = 'none'
  }

  // 更新按钮显示
  const phases = {
    'waiting': ['btnStart', 'btnRules'],
    'selecting': ['btnRollAgain', 'btnEndTurn', 'btnRules'],
    'farkle': ['btnNext', 'btnRules'],
    'gameOver': ['btnNewGame', 'btnRules']
  }

  const allButtons = ['btnStart', 'btnRollAgain', 'btnEndTurn', 'btnNext', 'btnNewGame', 'btnRules']
  allButtons.forEach(btnId => {
    document.getElementById(btnId).style.display = 'none'
  })

  const visibleButtons = phases[gameState.gamePhase] || []
  console.log('可见按钮:', visibleButtons);
  visibleButtons.forEach(btnId => {
    document.getElementById(btnId).style.display = 'inline-block'
  })

  // 更新"结束回合"按钮 - farkle时禁用
  const btnEndTurn = document.getElementById('btnEndTurn')
  if (gameState.gamePhase === 'farkle') {
    btnEndTurn.textContent = '下一位'
    btnEndTurn.disabled = false
  } else if (gameState.gamePhase === 'selecting') {
    const totalScore = gameState.currentRoundScore
    if (selectedDiceIndices.length > 0) {
      const selectedValues = selectedDiceIndices.map(index => {
        const die = gameState.unheldDice.find(d => d.index === index)
        return die.value
      })
      const validation = validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)
      if (validation.valid) {
        btnEndTurn.textContent = `结束回合 (${totalScore + validation.points}分)`
        btnEndTurn.disabled = false
      } else {
        btnEndTurn.textContent = '结束回合（无效选择）'
        btnEndTurn.disabled = true
      }
    } else if (totalScore > 0) {
      btnEndTurn.textContent = `结束回合 (${totalScore}分)`
      btnEndTurn.disabled = false
    } else {
      btnEndTurn.textContent = '结束回合 (0分)'
      btnEndTurn.disabled = true
    }
  }

  // 检查是否可以继续摇（必须至少选1个骰子）
  const btnRollAgain = document.getElementById('btnRollAgain')
  if (gameState.gamePhase === 'selecting') {
    if (selectedDiceIndices.length === 0) {
      btnRollAgain.disabled = true
      btnRollAgain.textContent = '继续摇（请先选择骰子）'
    } else {
      const selectedValues = selectedDiceIndices.map(index => {
        const die = gameState.unheldDice.find(d => d.index === index)
        return die.value
      })
      const validation = validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)
      
      // 检查剩余骰子是否会Farkle
      const unselectedDice = gameState.rolledDice.filter(d => !selectedDiceIndices.includes(d.index))
      const unselectedValues = unselectedDice.map(d => d.value)
      const willFarkle = isFarkle(unselectedValues)
      
      if (willFarkle) {
        btnRollAgain.disabled = true
        btnRollAgain.textContent = '继续摇（剩余骰子会Farkle）'
      } else if (validation.valid) {
        btnRollAgain.disabled = false
        btnRollAgain.textContent = '继续摇'
      } else {
        btnRollAgain.disabled = true
        btnRollAgain.textContent = '继续摇（无效选择）'
      }
    }
  } else {
    btnRollAgain.disabled = true
    btnRollAgain.textContent = '继续摇'
  }
}

function renderDice(containerId, dice, isHeld) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error('找不到容器:', containerId);
    return
  }
  container.innerHTML = ''

  dice.forEach((dieObj, index) => {
    const die = document.createElement('div')
    die.className = 'die'
    die.textContent = dieObj.value

    if (isHeld) {
      die.classList.add('held')
    } else if (selectedDiceIndices.includes(dieObj.index)) {
      die.classList.add('selected')
    }

    if (!isHeld) {
      die.addEventListener('click', () => toggleDie(dieObj.index))
    }

    container.appendChild(die)
  })
}

function toggleDie(index) {
  if (gameState.gamePhase !== 'selecting') {
    console.log('不是selecting状态，不能选择骰子');
    return
  }

  const idx = selectedDiceIndices.indexOf(index)
  if (idx > -1) {
    selectedDiceIndices.splice(idx, 1)
  } else {
    selectedDiceIndices.push(index)
  }

  console.log('选中骰子索引:', selectedDiceIndices);
  updateUI()
}

function startGame() {
  console.log('startGame 被调用');
  gameState.gamePhase = 'selecting'

  // 生成带索引的骰子对象
  const rawDice = rollDice(6)
  gameState.rolledDice = rawDice.map((value, idx) => ({ value, index: idx }))
  gameState.unheldDice = [...gameState.rolledDice]
  gameState.heldDice = []
  gameState.currentRoundScore = 0
  selectedDiceIndices = []
  console.log('开始游戏，摇出骰子:', gameState.rolledDice.map(d => d.value));
  updateUI()
}

function rollDiceAction() {
  if (gameState.gamePhase !== 'selecting') {
    console.log('无法掷骰子 - 当前状态:', gameState.gamePhase);
    return
  }

  console.log('rollDiceAction 被调用');
  
  // 摇6个骰子
  const newDice = rollDice(6)
  console.log('新生成的骰子:', newDice);

  // 创建带索引的骰子对象
  const rolledDiceWithIndex = newDice.map((value, idx) => ({
    value,
    index: gameState.rolledDice.length + idx
  }))

  if (isFarkle(newDice)) {
    console.log('Farkle！骰子:', newDice);
    // Farkle了，失去本轮所有分数
    gameState.rolledDice = rolledDiceWithIndex
    gameState.unheldDice = rolledDiceWithIndex
    gameState.currentRoundScore = 0
    gameState.heldDice = []
    gameState.gamePhase = 'farkle'
    gameState.message = `${gameState.players[gameState.currentPlayer].name} Farkle了！失去本轮所有未存分数，轮到下一位`
  } else {
    console.log('正常摇骰子:', newDice);
    // 正常摇骰子
    gameState.rolledDice = rolledDiceWithIndex
    gameState.unheldDice = rolledDiceWithIndex
    gameState.gamePhase = 'selecting'

    // 检查是否Hot Dice
    const possibleScores = getPossibleScores(newDice)
    console.log('可能的得分:', possibleScores);
    const totalDiceInScores = Math.max(...possibleScores.map(s => s.diceUsed.length))
    const isHotDice = totalDiceInScores === newDice.length
    console.log('是否Hot Dice:', isHotDice);

    if (isHotDice && possibleScores.length > 0) {
      // 是全骰子都能计分的牌型，自动提示
      const score = possibleScores[0]
      gameState.message = `特殊牌型：${score.description} = ${score.points}分！可以选择保留或结束回合`
    } else if (isHotDice) {
      gameState.message = `Hot Dice！选择要保留的骰子（至少选1个）`
    } else {
      gameState.message = `选择要保留的骰子（至少选1个）`
    }
  }

  selectedDiceIndices = []
  console.log('掷骰子完成，进入selecting状态');
  updateUI()
}

function rollAgain() {
  if (gameState.gamePhase !== 'selecting') {
    console.log('无法继续摇 - 当前状态:', gameState.gamePhase);
    return
  }

  // 必须至少选择1个骰子
  if (selectedDiceIndices.length === 0) {
    gameState.message = '必须至少选择1个骰子才能继续摇'
    console.log('没有选择骰子');
    updateUI()
    return
  }

  console.log('rollAgain 被调用，选中骰子索引:', selectedDiceIndices);

  // 获取选中的骰子值
  const selectedValues = selectedDiceIndices.map(index => {
    const die = gameState.unheldDice.find(d => d.index === index)
    return die.value
  })
  console.log('选中的骰子值:', selectedValues);

  const validation = validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)
  console.log('选择验证:', validation);

  if (!validation.valid) {
    gameState.message = '无效的选择！请选择可计分的骰子'
    console.log('无效选择:', selectedValues);
    updateUI()
    return
  }

  // 暂存选中骰子的分数
  const newRoundScore = gameState.currentRoundScore + validation.points
  console.log('新的本轮得分:', newRoundScore);

  // 获取要保留的骰子对象
  const diceToHold = selectedDiceIndices.map(index => {
    return gameState.unheldDice.find(d => d.index === index)
  }).filter(Boolean)

  console.log('要保留的骰子:', diceToHold.map(d => d.value));

  const newHeldDice = [...gameState.heldDice, ...diceToHold]
  console.log('新的heldDice:', newHeldDice.map(d => d.value));

  // 直接摇剩余骰子
  const unselectedDice = gameState.rolledDice.filter(d => !selectedDiceIndices.includes(d.index))
  console.log('未选中的骰子:', unselectedDice.map(d => d.value));
  const diceToRoll = unselectedDice.length
  const newDice = rollDice(diceToRoll)
  console.log('将摇的骰子数量:', diceToRoll);

  // 创建带索引的骰子对象
  const rolledDiceWithIndex = newDice.map((value, idx) => ({
    value,
    index: gameState.rolledDice.length + newHeldDice.length + idx
  }))

  if (isFarkle(newDice)) {
    console.log('剩余骰子Farkle！新的骰子:', newDice);
    // 剩余骰子Farkle了，直接失败
    gameState.rolledDice = rolledDiceWithIndex
    gameState.heldDice = newHeldDice
    gameState.unheldDice = rolledDiceWithIndex
    gameState.currentRoundScore = 0
    gameState.gamePhase = 'farkle'
    gameState.message = `${gameState.players[gameState.currentPlayer].name} Farkle了！剩余骰子无法计分，本轮结束，轮到下一位`
    console.log('进入farkle状态');
  } else {
    console.log('正常摇骰子，新的骰子:', newDice);
    // 正常摇骰子
    gameState.rolledDice = [...newHeldDice, ...rolledDiceWithIndex]
    gameState.heldDice = newHeldDice
    gameState.unheldDice = rolledDiceWithIndex
    gameState.currentRoundScore = newRoundScore
    gameState.gamePhase = 'selecting'

    const allDice = gameState.rolledDice.map(d => d.value)
    console.log('所有骰子:', allDice);
    const possibleScores = getPossibleScores(allDice)
    console.log('可能的得分:', possibleScores);
    const totalDiceInScores = Math.max(...possibleScores.map(s => s.diceUsed.length))
    const isHotDice = totalDiceInScores === allDice.length
    console.log('是否Hot Dice:', isHotDice);

    if (isHotDice) {
      gameState.message = `Hot Dice！所有骰子都能计分，可以继续摇或结束回合（本轮得分：${newRoundScore}）`
    } else if (diceToRoll > 0) {
      gameState.message = `本轮得分：${newRoundScore}，剩余${diceToRoll}个骰子可摇`
    } else {
      gameState.message = `本轮得分：${newRoundScore}，Hot Dice！准备摇6个新骰子`
    }
  }

  selectedDiceIndices = []
  console.log('继续摇完成，新骰子:', gameState.rolledDice.map(d => d.value), '本轮得分:', gameState.currentRoundScore);
  updateUI()
}

function endTurn() {
  if (gameState.gamePhase !== 'selecting') {
    console.log('无法结束回合 - 当前状态:', gameState.gamePhase);
    return
  }

  // 计算总分（已保留的骰子分数 + 当前选择的骰子分数）
  let totalScore = gameState.currentRoundScore
  console.log('当前回合得分:', totalScore);

  // 如果有选中的骰子，需要先保留它们
  if (selectedDiceIndices.length > 0) {
    const selectedValues = selectedDiceIndices.map(index => {
      const die = gameState.rolledDice.find(d => d.index === index)
      return die.value
    })

    const validation = validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)
    console.log('选中的骰子值:', selectedValues);
    console.log('选择验证:', validation);

    if (!validation.valid) {
      gameState.message = '无效的选择！请选择可计分的骰子'
      console.log('无效选择:', selectedValues);
      updateUI()
      return
    }

    // 加上选中骰子的分数
    totalScore = gameState.currentRoundScore + validation.points
    console.log('最终得分:', totalScore);
  }

  // 如果总分为0，不能结束回合
  if (totalScore === 0) {
    gameState.message = '必须选择骰子并保留后才能结束回合'
    console.log('0分，不能结束回合');
    updateUI()
    return
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const newScore = currentPlayer.bankedScore + totalScore
  console.log('玩家', gameState.currentPlayer, '新总分:', newScore);

  if (newScore >= WINNING_SCORE) {
    currentPlayer.bankedScore = newScore
    gameState.winner = gameState.currentPlayer
    gameState.gamePhase = 'gameOver'
    gameState.message = `${currentPlayer.name} 获胜！总分：${newScore}`
  } else {
    currentPlayer.bankedScore = newScore
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 2
    gameState.gamePhase = 'selecting'
    // 生成带索引的骰子对象
    const rawDice = rollDice(6)
    gameState.rolledDice = rawDice.map((value, idx) => ({ value, index: idx }))
    gameState.heldDice = []
    gameState.unheldDice = [...gameState.rolledDice]
    gameState.currentRoundScore = 0
    gameState.message = `${gameState.players[gameState.currentPlayer].name}，点击"开始新回合"`
    console.log('回合结束，切换玩家，新玩家:', gameState.currentPlayer);
  }

  selectedDiceIndices = []
  console.log('回合结束，切换玩家');
  updateUI()
}

function switchPlayer() {
  if (gameState.gamePhase !== 'farkle') {
    console.log('无法切换玩家 - 当前状态:', gameState.gamePhase);
    return
  }

  console.log('switchPlayer 被调用');
  gameState.currentPlayer = (gameState.currentPlayer + 1) % 2
  gameState.gamePhase = 'selecting'
  // 生成带索引的骰子对象
  const rawDice = rollDice(6)
  gameState.rolledDice = rawDice.map((value, idx) => ({ value, index: idx }))
  gameState.heldDice = []
  gameState.unheldDice = [...gameState.rolledDice]
  gameState.currentRoundScore = 0
  gameState.message = `${gameState.players[gameState.currentPlayer].name}，点击"开始新回合"`

  selectedDiceIndices = []
  console.log('切换玩家，新玩家:', gameState.currentPlayer);
  updateUI()
}

function newGame() {
  console.log('newGame 被调用');
  gameState = {
    players: [
      { id: 0, name: '玩家1', bankedScore: 0 },
      { id: 1, name: '玩家2', bankedScore: 0 }
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

  selectedDiceIndices = []
  console.log('新游戏');
  updateUI()
}

// 事件监听
document.getElementById('btnStart').addEventListener('click', startGame)
document.getElementById('btnRollAgain').addEventListener('click', rollDiceAction)
document.getElementById('btnEndTurn').addEventListener('click', endTurn)
document.getElementById('btnNext').addEventListener('click', switchPlayer)
document.getElementById('btnNewGame').addEventListener('click', newGame)
document.getElementById('btnRules').addEventListener('click', () => {
  document.getElementById('rulesModal').classList.add('show')
})

// 初始化UI
console.log('初始化UI');
updateUI()
