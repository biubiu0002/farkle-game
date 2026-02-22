/**
 * Farkle 游戏主文件
 * 连接 UI 和游戏逻辑
 */

console.log('Farkle游戏已加载 - 版本 v6.0 - 模块化重构')

// 游戏状态
let gameState = window.GameLogic.createInitialState()
let selectedDiceIndices = []
let isAnimating = false  // 动画执行标志，防止并发点击

// 初始化音效管理器
async function initSoundManager() {
  try {
    // 初始化 SoundManager
    if (window.SoundManager && !window.SoundManager.isInitialized) {
      await window.SoundManager.init()
      console.log('SoundManager 初始化成功')
    }

    // 初始化 BGMManager（如果存在）
    if (window.BGMManager) {
      window.bgmManager = new window.BGMManager('墙洞bgm_1.mp4')
      console.log('BGMManager 创建成功')
    }

    // 初始化音量控制面板（如果存在）
    if (window.VolumeControlPanel) {
      window.volumePanel = new window.VolumeControlPanel(
        window.SoundManager,
        window.bgmManager
      )
      console.log('VolumeControlPanel 创建成功')
    }

    // 添加用户交互监听器以启用自动播放
    const enableAutoplay = () => {
      if (window.bgmManager) {
        window.bgmManager.enableAutoplay()
        console.log('BGM 自动播放已启用')
      }
      // 移除监听器
      document.removeEventListener('click', enableAutoplay)
      document.removeEventListener('touchstart', enableAutoplay)
    }

    document.addEventListener('click', enableAutoplay)
    document.addEventListener('touchstart', enableAutoplay)

  } catch (error) {
    console.error('初始化音频系统时出错:', error)
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
async function startGame() {
  if (!window.UI || !window.UI.updateUI) {
    console.error('UI module not available')
    return
  }

  // 防止并发点击
  if (isAnimating) {
    console.log('动画执行中，忽略点击')
    return
  }
  isAnimating = true

  // 禁用所有按钮
  setAllButtonsEnabled(false)

  try {
    // 获取骰子区域
    const diceArea = document.getElementById('diceArea')
    const remainingSection = document.getElementById('remainingSection')

    if (!diceArea) {
      // 如果找不到容器，直接执行逻辑
      gameState = window.GameLogic.startGame(gameState)
      selectedDiceIndices = []
      window.UI.updateUI(gameState, selectedDiceIndices)
      // 恢复状态后返回
      isAnimating = false
      setAllButtonsEnabled(true)
      return
    }

    // 创建骰子桶并播放洗牌动画
    const diceBucket = createDiceBucket()
    diceArea.appendChild(diceBucket)

  // 等待一下让骰子桶出现
  await waitForAnimation(100)

  // 播放骰子碰撞音效（摇晃时）
  if (window.SoundManager) {
    window.SoundManager.playRollSound()
  }

  // 开始摇晃动画
  diceBucket.classList.add('shaking')

  // 摇晃1.5秒
  await waitForAnimation(1500)

  // 停止摇晃
  diceBucket.classList.remove('shaking')

  // 等待一小段时间
  await waitForAnimation(200)

  // 移除骰子桶
  diceArea.removeChild(diceBucket)

  // 更新游戏状态
  gameState = window.GameLogic.startGame(gameState)
  selectedDiceIndices = []

  // 显示骰子行并更新UI
  window.UI.updateUI(gameState, selectedDiceIndices)

  // 对新骰子添加弹跳效果
  const newDiceElements = document.querySelectorAll('#remainingDice .die, #heldDice .die')
  newDiceElements.forEach((die, index) => {
    die.style.animation = `die-bounce 0.3s ease-out ${index * 0.05}s`
  })

  // 播放落地音效
  if (window.SoundManager) {
    await waitForAnimation(200)
    window.SoundManager.playDiceSound()
  }

  // 等待动画完成
  await waitForAnimation(500)

  // 清理动画
  newDiceElements.forEach(die => {
    die.style.animation = ''
  })

  // 恢复动画标志和按钮状态
  isAnimating = false
  setAllButtonsEnabled(true)
  } catch (error) {
    console.error('开始游戏时出错:', error)
    // 移除可能残留的骰子桶
    const diceArea = document.getElementById('diceArea')
    const diceBucket = diceArea?.querySelector('.dice-bucket')
    if (diceBucket) {
      diceArea.removeChild(diceBucket)
    }
  } finally {
    // 确保无论成功还是失败都恢复状态
    isAnimating = false
    setAllButtonsEnabled(true)
  }
}

/**
 * 继续摇 - 骰子桶摇晃动画
 */
async function rollAgain() {
  if (gameState.gamePhase !== 'selecting') return
  if (selectedDiceIndices.length === 0) {
    gameState.message = '必须至少选择1个骰子才能继续摇'
    window.UI.updateUI(gameState, selectedDiceIndices)
    return
  }

  // 防止并发点击
  if (isAnimating) {
    console.log('动画执行中，忽略点击')
    return
  }
  isAnimating = true

  // 禁用所有按钮
  setAllButtonsEnabled(false)

  // 获取未选择的骰子数量（即将要摇的骰子）
  const unheldCount = gameState.unheldDice.length - selectedDiceIndices.length
  const diceToRoll = unheldCount === 0 ? 6 : unheldCount

  // 获取骰子区域
  const diceArea = document.getElementById('diceArea')
  const remainingSection = document.getElementById('remainingSection')

  if (!diceArea || !remainingSection) {
    // 如果找不到容器，直接执行逻辑
    gameState = window.GameLogic.rollAgain(gameState, selectedDiceIndices)
    selectedDiceIndices = []
    window.UI.updateUI(gameState, selectedDiceIndices)
    // 恢复状态后返回
    isAnimating = false
    setAllButtonsEnabled(true)
    return
  }

  // 隐藏原来的骰子行
  remainingSection.style.visibility = 'hidden'

  // 创建骰子桶并播放洗牌动画
  const diceBucket = createDiceBucket()
  diceArea.appendChild(diceBucket)

  // 等待一下让骰子桶出现
  await waitForAnimation(100)

  // 播放骰子碰撞音效（摇晃时）
  if (window.SoundManager) {
    window.SoundManager.playRollSound()
  }

  // 开始摇晃动画
  diceBucket.classList.add('shaking')

  // 摇晃1.5秒（与CSS动画时长一致）
  await waitForAnimation(1500)

  // 停止摇晃
  diceBucket.classList.remove('shaking')

  // 等待一小段时间
  await waitForAnimation(200)

  // 移除骰子桶
  diceArea.removeChild(diceBucket)

  // 更新游戏状态
  gameState = window.GameLogic.rollAgain(gameState, selectedDiceIndices)
  selectedDiceIndices = []

  // 显示骰子行并更新UI
  remainingSection.style.visibility = 'visible'
  window.UI.updateUI(gameState, selectedDiceIndices)

  // 对新骰子添加弹跳效果
  const newDiceElements = document.querySelectorAll('#remainingDice .die')
  newDiceElements.forEach((die, index) => {
    die.style.animation = `die-bounce 0.3s ease-out ${index * 0.05}s`
  })

  // 播放落地音效
  if (window.SoundManager) {
    await waitForAnimation(200)
    window.SoundManager.playDiceSound()
  }

  // 等待动画完成
  await waitForAnimation(500)

  // 清理动画
  newDiceElements.forEach(die => {
    die.style.animation = ''
  })

  // 恢复动画标志和按钮状态
  isAnimating = false
  setAllButtonsEnabled(true)
}

/**
 * 结束回合
 */
async function endTurn() {
  if (gameState.gamePhase !== 'selecting') return

  // 防止并发点击
  if (isAnimating) {
    console.log('动画执行中，忽略点击')
    return
  }
  isAnimating = true

  // 禁用所有按钮
  setAllButtonsEnabled(false)

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
      // 恢复状态后返回
      isAnimating = false
      setAllButtonsEnabled(true)
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
    // 恢复状态后返回
    isAnimating = false
    setAllButtonsEnabled(true)
    return
  }

  // 播放存分音效
  if (window.SoundManager) window.SoundManager.playBankSound()

  // 隐藏当前骰子，准备洗牌动画
  const remainingSection = document.getElementById('remainingSection')
  const heldSection = document.getElementById('heldSection')
  if (remainingSection) remainingSection.style.opacity = '0.5'
  if (heldSection) heldSection.style.opacity = '0.5'

  // 等待一小段时间
  await waitForAnimation(300)

  // 获取骰子区域
  const diceArea = document.getElementById('diceArea')
  if (diceArea) {
    // 创建骰子桶并播放洗牌动画
    const diceBucket = createDiceBucket()
    diceArea.appendChild(diceBucket)

    // 等待一下让骰子桶出现
    await waitForAnimation(100)

    // 播放摇骰子音效
    if (window.SoundManager) {
      window.SoundManager.playRollSound()
    }

    // 开始摇晃动画
    diceBucket.classList.add('shaking')

    // 摇晃1.5秒
    await waitForAnimation(1500)

    // 停止摇晃
    diceBucket.classList.remove('shaking')

    // 等待一小段时间
    await waitForAnimation(200)

    // 移除骰子桶
    diceArea.removeChild(diceBucket)
  }

  // 更新游戏状态（切换玩家并摇骰子）
  gameState = window.GameLogic.endTurn(gameState, selectedDiceIndices)
  selectedDiceIndices = []

  // 显示骰子行并更新UI
  window.UI.updateUI(gameState, selectedDiceIndices)

  // 恢复透明度
  if (remainingSection) remainingSection.style.opacity = '1'
  if (heldSection) heldSection.style.opacity = '1'

  // 对新骰子添加弹跳效果
  const newDiceElements = document.querySelectorAll('#remainingDice .die')
  newDiceElements.forEach((die, index) => {
    die.style.animation = `die-bounce 0.3s ease-out ${index * 0.05}s`
  })

  // 播放落地音效
  if (window.SoundManager) {
    await waitForAnimation(200)
    window.SoundManager.playDiceSound()
  }

  // 等待动画完成
  await waitForAnimation(500)

  // 清理动画
  newDiceElements.forEach(die => {
    die.style.animation = ''
  })

  // 恢复动画标志和按钮状态
  isAnimating = false
  setAllButtonsEnabled(true)
}

/**
 * 创建骰子桶DOM结构
 */
function createDiceBucket() {
  const diceBucket = document.createElement('div')
  diceBucket.className = 'dice-bucket'

  const bucket = document.createElement('div')
  bucket.className = 'bucket'

  const bucketBody = document.createElement('div')
  bucketBody.className = 'bucket-body'

  const bucketRim = document.createElement('div')
  bucketRim.className = 'bucket-rim'

  const bucketInner = document.createElement('div')
  bucketInner.className = 'bucket-inner'

  const bucketDice = document.createElement('div')
  bucketDice.className = 'bucket-dice'

  const topBand = document.createElement('div')
  topBand.className = 'bucket-band top'

  const bottomBand = document.createElement('div')
  bottomBand.className = 'bucket-band bottom'

  bucketInner.appendChild(bucketDice)
  bucketBody.appendChild(bucketRim)
  bucketBody.appendChild(bucketInner)
  bucketBody.appendChild(topBand)
  bucketBody.appendChild(bottomBand)
  bucket.appendChild(bucketBody)
  diceBucket.appendChild(bucket)

  return diceBucket
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
 * 设置所有按钮的启用/禁用状态
 */
function setAllButtonsEnabled(enabled) {
  const buttons = document.querySelectorAll('.controls .btn')
  buttons.forEach(btn => {
    if (enabled) {
      // 恢复按钮的原始disabled状态
      if (btn.id === 'btnStart') {
        btn.disabled = (gameState.gamePhase !== 'waiting')
      } else if (btn.id === 'btnRollAgain') {
        btn.disabled = !(
          gameState.gamePhase === 'selecting' &&
          selectedDiceIndices.length > 0
        )
      } else if (btn.id === 'btnEndTurn') {
        const totalScore = gameState.currentRoundScore
        btn.disabled = (totalScore === 0)
      } else if (btn.id === 'btnNext') {
        btn.disabled = (gameState.gamePhase !== 'farkle')
      } else if (btn.id === 'btnNewGame') {
        btn.disabled = (gameState.gamePhase !== 'gameOver')
      }
    } else {
      // 禁用所有按钮
      btn.disabled = true
    }
  })
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
  // 确保 UI 已加载
  if (window.UI && window.UI.updateUI) {
    window.UI.updateUI(gameState, selectedDiceIndices)
  } else {
    console.error('UI module not loaded')
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
