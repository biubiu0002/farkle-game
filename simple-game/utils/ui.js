/**
 * Farkle UI 模块
 * 所有 UI 更新逻辑
 */

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
}

function renderDice(containerId, dice, isHeld, selectedDiceIndices) {
  const container = document.getElementById(containerId)
  if (!container) return

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
      die.addEventListener('click', () => {
        if (window.gameToggleDie) {
          window.gameToggleDie(dieObj.index)
        }
      })
    }

    container.appendChild(die)
  })
}

// 导出为模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateUI,
    renderDice
  }
} else {
  window.UI = {
    updateUI,
    renderDice
  }
}
