/**
 * Farkle UI 模块
 * 所有 UI 更新逻辑
 */

/**
 * 根据骰子数值生成点数布局数组
 * @param {number} value - 骰子数值 (1-6)
 * @returns {Array} - 9个元素的数组，1表示有点，0表示无点
 */
function getPipLayout(value) {
  // 3x3网格索引:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  const layouts = {
    1: [0,0,0, 0,1,0, 0,0,0],           // 中心1个
    2: [1,0,0, 0,0,0, 0,0,1],           // 对角2个
    3: [1,0,0, 0,1,0, 0,0,1],           // 对角+中心
    4: [1,0,1, 0,0,0, 1,0,1],           // 四角
    5: [1,0,1, 0,1,0, 1,0,1],           // 四角+中心
    6: [1,0,1, 1,0,1, 1,0,1]            // 两列
  }
  return layouts[value] || layouts[1]
}

/**
 * 创建3D骰子的HTML结构
 * @param {number} value - 骰子数值 (1-6)
 * @param {number} index - 骰子索引
 * @returns {HTMLElement} - 3D骰子DOM元素
 */
function create2DDie(value, index) {
  // 简化版2D骰子 - 使用图片方式
  const container = document.createElement('div')
  container.className = 'die-2d-container'

  const die = document.createElement('div')
  die.className = 'die-2d'
  die.dataset.value = value
  die.dataset.index = index

  // 使用背景图片或CSS绘制点数
  die.textContent = value

  container.appendChild(die)
  return container
}

function updateUI(gameState, selectedDiceIndices) {
  // 更新玩家得分表格
  document.getElementById('player0LastScore').textContent = gameState.players[0].lastRoundScore || 0
  document.getElementById('player1LastScore').textContent = gameState.players[1].lastRoundScore || 0
  document.getElementById('player0TotalScore').textContent = gameState.players[0].bankedScore
  document.getElementById('player1TotalScore').textContent = gameState.players[1].bankedScore

  // 高亮当前玩家的列
  const player0Header = document.getElementById('player0Header')
  const player1Header = document.getElementById('player1Header')
  const player0LastScoreCell = document.getElementById('player0LastScoreCell')
  const player1LastScoreCell = document.getElementById('player1LastScoreCell')
  const player0TotalScoreCell = document.getElementById('player0TotalScoreCell')
  const player1TotalScoreCell = document.getElementById('player1TotalScoreCell')

  player0Header.classList.remove('active')
  player1Header.classList.remove('active')
  player0LastScoreCell.classList.remove('active')
  player1LastScoreCell.classList.remove('active')
  player0TotalScoreCell.classList.remove('active')
  player1TotalScoreCell.classList.remove('active')

  if (gameState.currentPlayer === 0) {
    player0Header.classList.add('active')
    player0LastScoreCell.classList.add('active')
    player0TotalScoreCell.classList.add('active')
  } else {
    player1Header.classList.add('active')
    player1LastScoreCell.classList.add('active')
    player1TotalScoreCell.classList.add('active')
  }

  // 更新消息
  document.getElementById('message').textContent = gameState.message

  // 计算选中骰子的得分
  let selectedScore = 0
  if (selectedDiceIndices.length > 0 && gameState.gamePhase === 'selecting') {
    const selectedValues = selectedDiceIndices.map(index => {
      const die = gameState.unheldDice.find(d => d.index === index)
      return die.value
    })
    const validation = window.Scorer.validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)
    if (validation.valid) {
      selectedScore = validation.points
    }
  }

  // 更新选中得分预览
  const selectedScorePreview = document.getElementById('selectedScorePreview')
  if (selectedScore > 0) {
    selectedScorePreview.style.display = 'inline'
    document.getElementById('selectedScoreValue').textContent = selectedScore
  } else {
    selectedScorePreview.style.display = 'none'
  }

  // 更新骰子显示
  const heldSection = document.getElementById('heldSection')
  const remainingSection = document.getElementById('remainingSection')

  // 始终显示区域，避免UI跳动
  if (gameState.heldDice.length > 0) {
    renderDice('heldDice', gameState.heldDice, true, selectedDiceIndices)
  } else {
    document.getElementById('heldDice').innerHTML = ''
  }

  if (gameState.unheldDice.length > 0 && gameState.gamePhase === 'selecting') {
    renderDice('remainingDice', gameState.unheldDice, false, selectedDiceIndices)
  } else {
    document.getElementById('remainingDice').innerHTML = ''
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
  visibleButtons.forEach(btnId => {
    document.getElementById(btnId).style.display = 'inline-block'
  })

  // 更新"结束回合"按钮
  const btnEndTurn = document.getElementById('btnEndTurn')
  if (gameState.gamePhase === 'selecting') {
    const totalScore = gameState.currentRoundScore + selectedScore

    // 检查是否选中了骰子
    if (selectedDiceIndices.length > 0) {
      // 有选中骰子
      if (selectedScore > 0) {
        // 选中有效，可以结束回合
        btnEndTurn.textContent = `结束回合 (${totalScore}分)`
        btnEndTurn.disabled = false
      } else {
        // 选中无效，禁用按钮
        btnEndTurn.textContent = '结束回合（无效选择）'
        btnEndTurn.disabled = true
      }
    } else {
      // 没有选中骰子
      if (totalScore > 0) {
        // 已有保留分数，可以结束回合
        btnEndTurn.textContent = `结束回合 (${totalScore}分)`
        btnEndTurn.disabled = false
      } else {
        // 没有分数，不能结束回合
        btnEndTurn.textContent = '结束回合 (0分)'
        btnEndTurn.disabled = true
      }
    }
  }

  // 检查是否可以继续摇（必须至少选1个骰子且选择有效）
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
      const validation = window.Scorer.validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)

      if (validation.valid) {
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

  // 检查游戏是否结束并播放胜利音效
  if (gameState.gamePhase === 'gameOver' && window.SoundManager) {
    const winner = gameState.players.find(p => p.bankedScore >= 10000)
    if (winner) {
      setTimeout(() => {
        window.SoundManager.playWinSound()
      }, 500)
    }
  }
}

function renderDice(containerId, dice, isHeld, selectedDiceIndices) {
  const container = document.getElementById(containerId)
  if (!container) return

  container.innerHTML = ''

  dice.forEach((dieObj) => {
    const dieContainer = document.createElement('div')
    dieContainer.className = 'die'

    // 点数容器
    const pipsContainer = document.createElement('div')
    pipsContainer.className = 'die-pips-2d'

    // 获取点数布局
    const layout = getPipLayout(dieObj.value)
    layout.forEach(hasPip => {
      const pip = document.createElement('div')
      pip.className = 'pip-2d'
      if (hasPip) {
        pip.classList.add('visible')
      }
      pipsContainer.appendChild(pip)
    })

    dieContainer.appendChild(pipsContainer)

    // 添加选中/保留状态
    if (isHeld) {
      dieContainer.classList.add('held')
    } else if (selectedDiceIndices.includes(dieObj.index)) {
      dieContainer.classList.add('selected')
    }

    // 添加点击事件
    if (!isHeld) {
      dieContainer.addEventListener('click', () => {
        if (window.gameToggleDie) {
          window.gameToggleDie(dieObj.index)
        }
      })
    }

    container.appendChild(dieContainer)
  })
}

// 导出为模块
console.log('UI module: exporting functions...')
if (typeof module !== 'undefined' && module.exports) {
  console.log('UI module: using CommonJS')
  module.exports = {
    updateUI,
    renderDice,
    getPipLayout
  }
} else {
  console.log('UI module: using window.UI')
  window.UI = {
    updateUI,
    renderDice,
    getPipLayout
  }
  console.log('UI module: window.UI =', window.UI)
}
