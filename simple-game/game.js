/**
 * Farkle 游戏主文件
 * 连接 UI 和游戏逻辑
 */

console.log('Farkle游戏已加载 - 版本 v6.0 - 模块化重构')

// 游戏状态
let gameState = window.GameLogic.createInitialState()
let selectedDiceIndices = []

// 初始化音效管理器
async function initSoundManager() {
  if (window.SoundManager && !window.SoundManager.isInitialized) {
    await window.SoundManager.init()
  }
}

/**
 * 切换骰子选中状态
 */
function toggleDie(index) {
  if (gameState.gamePhase !== 'selecting') return

  const idx = selectedDiceIndices.indexOf(index)
  if (idx > -1) {
    selectedDiceIndices.splice(idx, 1)
    if (window.SoundManager) window.SoundManager.playDeselectSound()
  } else {
    selectedDiceIndices.push(index)
    if (window.SoundManager) window.SoundManager.playSelectSound()
  }

  window.UI.updateUI(gameState, selectedDiceIndices)
}

// 导出到全局，供 UI 模块调用
window.gameToggleDie = toggleDie

/**
 * 等待动画完成
 */
function waitForAnimation(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 开始游戏
 */
function startGame() {
  gameState = window.GameLogic.startGame(gameState)
  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}

/**
 * 继续摇 - 简化版
 */
async function rollAgain() {
  if (gameState.gamePhase !== 'selecting') return
  if (selectedDiceIndices.length === 0) {
    gameState.message = '必须至少选择1个骰子才能继续摇'
    window.UI.updateUI(gameState, selectedDiceIndices)
    return
  }

  // 播放摇骰子音效
  if (window.SoundManager) window.SoundManager.playRollSound()

  // 简单的缩放动画
  const diceElements = document.querySelectorAll('.dice-row .die')

  diceElements.forEach(die => {
    die.style.transform = 'scale(0.8)'
  })

  await waitForAnimation(150)

  diceElements.forEach(die => {
    die.style.transform = 'scale(1.1)'
  })

  await waitForAnimation(150)

  diceElements.forEach(die => {
    die.style.transform = 'scale(1)'
  })

  // 更新游戏状态
  gameState = window.GameLogic.rollAgain(gameState, selectedDiceIndices)
  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}

/**
 * 结束回合
 */
function endTurn() {
  if (gameState.gamePhase !== 'selecting') return

  let totalScore = gameState.currentRoundScore

  // 如果有选中的骰子，需要先保留它们
  if (selectedDiceIndices.length > 0) {
    const selectedValues = selectedDiceIndices.map(index => {
      const die = gameState.rolledDice.find(d => d.index === index)
      return die.value
    })

    const validation = window.Scorer.validateSelection(gameState.rolledDice.map(d => d.value), selectedValues)
    if (!validation.valid) {
      gameState.message = validation.description || '无效的选择！请选择可计分的骰子'
      window.UI.updateUI(gameState, selectedDiceIndices)
      return
    }

    totalScore = gameState.currentRoundScore + validation.points

    // 播放得分音效
    if (window.SoundManager) window.SoundManager.playScoreSound()
  }

  // 如果总分为0，不能结束回合
  if (totalScore === 0) {
    gameState.message = '必须选择骰子并保留后才能结束回合'
    window.UI.updateUI(gameState, selectedDiceIndices)
    return
  }

  // 播放存分音效
  if (window.SoundManager) window.SoundManager.playBankSound()

  gameState = window.GameLogic.endTurn(gameState, selectedDiceIndices)
  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}

/**
 * 切换玩家（Farkle后）
 */
function switchPlayer() {
  if (gameState.gamePhase !== 'farkle') return

  // 播放Farkle音效
  if (window.SoundManager) window.SoundManager.playFarkleSound()

  gameState = window.GameLogic.switchPlayerAfterFarkle(gameState)
  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}

/**
 * 新游戏
 */
function newGame() {
  gameState = window.GameLogic.newGame()
  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}

/**
 * 显示规则
 */
function showRules() {
  document.getElementById('rulesModal').classList.add('show')
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
  document.getElementById('btnStart').addEventListener('click', () => {
    initSoundManager().then(startGame)
  })
  document.getElementById('btnRollAgain').addEventListener('click', rollAgain)
  document.getElementById('btnEndTurn').addEventListener('click', endTurn)
  document.getElementById('btnNext').addEventListener('click', switchPlayer)
  document.getElementById('btnNewGame').addEventListener('click', () => {
    initSoundManager().then(newGame)
  })
  document.getElementById('btnRules').addEventListener('click', showRules)
  document.getElementById('btnMute').addEventListener('click', toggleMute)
}

/**
 * 切换静音状态
 */
function toggleMute() {
  if (window.SoundManager) {
    const btnMute = document.getElementById('btnMute')
    const isMuted = !window.SoundManager.enabled

    window.SoundManager.setEnabled(!isMuted)
    btnMute.textContent = isMuted ? '🔇' : '🔊'
  }
}

/**
 * 初始化游戏
 */
function init() {
  initEventListeners()
  window.UI.updateUI(gameState, selectedDiceIndices)
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
