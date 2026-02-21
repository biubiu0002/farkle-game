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
function create3DDie(value, index) {
  const container = document.createElement('div')
  container.className = 'die-3d-container'

  const die = document.createElement('div')
  die.className = 'die-3d'
  die.dataset.value = value
  die.dataset.index = index

  // 根据 value 旋转骰子显示对应面
  const rotations = {
    1: 'rotateX(0deg) rotateY(0deg)',      // front
    2: 'rotateX(0deg) rotateY(-90deg)',    // left
    3: 'rotateX(0deg) rotateY(90deg)',     // right
    4: 'rotateX(-90deg) rotateY(0deg)',    // top
    5: 'rotateX(90deg) rotateY(0deg)',     // bottom
    6: 'rotateX(180deg) rotateY(0deg)'     // back
  }
  die.style.transform = rotations[value] || rotations[1]

  // 创建6个面，每个面显示1点
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom']
  const faceValues = [1, 6, 3, 2, 4, 5] // 每个面对应的数值

  faces.forEach((faceName, i) => {
    const face = document.createElement('div')
    face.className = `die-face ${faceName}`

    const pipsContainer = document.createElement('div')
    pipsContainer.className = 'die-pips'

    const layout = getPipLayout(faceValues[i])
    layout.forEach(hasPip => {
      const pip = document.createElement('div')
      pip.className = 'pip'
      if (hasPip) {
        pip.style.visibility = 'visible'
      } else {
        pip.style.visibility = 'hidden'
      }
      pipsContainer.appendChild(pip)
    })

    face.appendChild(pipsContainer)
    die.appendChild(face)
  })

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

  if (gameState.heldDice.length > 0) {
    heldSection.style.display = 'block'
    renderDice('heldDice', gameState.heldDice, true, selectedDiceIndices)
  } else {
    heldSection.style.display = 'none'
  }

  if (gameState.unheldDice.length > 0 && gameState.gamePhase === 'selecting') {
    remainingSection.style.display = 'block'
    renderDice('remainingDice', gameState.unheldDice, false, selectedDiceIndices)
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
  visibleButtons.forEach(btnId => {
    document.getElementById(btnId).style.display = 'inline-block'
  })

  // 更新"结束回合"按钮
  const btnEndTurn = document.getElementById('btnEndTurn')
  if (gameState.gamePhase === 'selecting') {
    const totalScore = gameState.currentRoundScore + selectedScore
    if (selectedDiceIndices.length > 0 && selectedScore > 0) {
      btnEndTurn.textContent = `结束回合 (${totalScore}分)`
      btnEndTurn.disabled = false
    } else if (totalScore > 0) {
      btnEndTurn.textContent = `结束回合 (${totalScore}分)`
      btnEndTurn.disabled = false
    } else {
      btnEndTurn.textContent = '结束回合 (0分)'
      btnEndTurn.disabled = true
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
    const die3D = create3DDie(dieObj.value, dieObj.index)
    const dieElement = die3D.querySelector('.die-3d')

    // 添加选中/保留状态
    if (isHeld) {
      dieElement.classList.add('held')
      dieElement.style.filter = 'brightness(0.7) opacity(0.8)'
    } else if (selectedDiceIndices.includes(dieObj.index)) {
      dieElement.classList.add('selected')
      dieElement.style.filter = 'brightness(1.2) saturate(1.2)'
      // 在容器上应用位移，不影响骰子的旋转
      die3D.style.transform = 'translateY(-10px)'
    }

    // 添加点击事件
    if (!isHeld) {
      dieElement.style.cursor = 'pointer'
      dieElement.addEventListener('click', () => {
        if (window.gameToggleDie) {
          window.gameToggleDie(dieObj.index)
        }
      })
    } else {
      dieElement.style.cursor = 'default'
    }

    container.appendChild(die3D)
  })
}

// 导出为模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateUI,
    renderDice,
    getPipLayout,
    create3DDie
  }
} else {
  window.UI = {
    updateUI,
    renderDice,
    getPipLayout,
    create3DDie
  }
}
