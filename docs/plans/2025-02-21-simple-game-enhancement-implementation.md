# Simple-Game 视觉增强实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 simple-game 添加 3D拟物骰子、木质棋盘界面、真实摇骰子动画和基础音效

**Architecture:** 使用纯CSS 3D transforms实现骰子，CSS渐变实现木质纹理，CSS动画实现摇骰子效果，Web Audio API实现音效

**Tech Stack:** HTML5, CSS3 (3D transforms, keyframes), Vanilla JavaScript (ES6+), Web Audio API

---

## Task 1: 创建3D骰子基础CSS结构

**Files:**
- Modify: `simple-game/style.css`

**Step 1: 在 style.css 底部添加3D骰子容器样式**

在文件末尾添加以下CSS：

```css
/* ===== 3D骰子样式 ===== */

/* 3D场景容器 */
.die-3d-container {
  perspective: 800px;
  width: 80px;
  height: 80px;
}

/* 3D骰子主体 */
.die-3d {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease-out;
  will-change: transform;
}

/* 骰子的6个面 */
.die-face {
  position: absolute;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #d4a574 0%, #c4956a 100%);
  border: 2px solid #a67c52;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
  backface-visibility: hidden;
}

/* 点数样式 */
.die-pips {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  width: 60px;
  height: 60px;
}

.pip {
  width: 10px;
  height: 10px;
  background: #2d1810;
  border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
}

/* 面的3D定位 */
.die-face.front  { transform: rotateY(0deg) translateZ(40px); }
.die-face.back   { transform: rotateY(180deg) translateZ(40px); }
.die-face.right  { transform: rotateY(90deg) translateZ(40px); }
.die-face.left   { transform: rotateY(-90deg) translateZ(40px); }
.die-face.top    { transform: rotateX(90deg) translateZ(40px); }
.die-face.bottom { transform: rotateX(-90deg) translateZ(40px); }
```

**Step 2: 保存并在浏览器中检查CSS加载**

打开浏览器开发者工具，检查 Elements 面板中 `.die-3d` 样式是否包含 `transform-style: preserve-3d`

预期：样式正确加载，无语法错误

**Step 3: 提交**

```bash
git add simple-game/style.css
git commit -m "style: add 3D dice base CSS structure"
```

---

## Task 2: 创建点数布局生成函数

**Files:**
- Modify: `simple-game/utils/ui.js`

**Step 1: 在 ui.js 中添加生成点数布局的辅助函数**

在文件顶部的 `updateUI` 函数之前添加：

```javascript
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
```

**Step 2: 提交**

```bash
git add simple-game/utils/ui.js
git commit -m "feat: add 3D dice HTML generation helper functions"
```

---

## Task 3: 修改 renderDice 函数使用3D骰子

**Files:**
- Modify: `simple-game/utils/ui.js`

**Step 1: 替换 renderDice 函数的实现**

找到 `renderDice` 函数（约第142行），完全替换为：

```javascript
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
      dieElement.style.transform += ' translateY(-10px)'
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
```

**Step 2: 测试3D骰子显示**

在浏览器中打开 `simple-game/index.html`，点击"开始游戏"，验证：
- 骰子显示为3D立方体
- 每个面正确显示点数
- 点击骰子可以选中

预期：3D骰子正常显示，点数正确，可交互

**Step 3: 提交**

```bash
git add simple-game/utils/ui.js
git commit -m "feat: update renderDice to use 3D dice"
```

---

## Task 4: 添加木质棋盘背景样式

**Files:**
- Modify: `simple-game/style.css`

**Step 1: 修改 body 样式为木质背景**

找到 `body` 样式（约第11行），替换为：

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #5d4037;
  background-image:
    repeating-linear-gradient(90deg,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.05) 2px,
      rgba(0,0,0,0.05) 4px
    ),
    repeating-linear-gradient(0deg,
      transparent 0px,
      transparent 50px,
      rgba(0,0,0,0.03) 50px,
      rgba(0,0,0,0.03) 52px
    );
  min-height: 100vh;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

**Step 2: 修改 .container 样式为木质边框卡片**

找到 `.container` 样式（约第21行），替换为：

```css
.container {
  background: linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%);
  border: 12px solid #5d4037;
  border-radius: 20px;
  padding: 32px;
  max-width: 840px;
  width: 100%;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.2);
}
```

**Step 3: 提交**

```bash
git add simple-game/style.css
git commit -m "style: add wooden board background and container styling"
```

---

## Task 5: 添加绿色绒布台面样式

**Files:**
- Modify: `simple-game/style.css`

**Step 1: 添加绒布纹理样式**

在 `/* ===== 3D骰子样式 ===== */` 之前添加：

```css
/* ===== 绒布台面样式 ===== */

.felt-surface {
  background: #2e7d32;
  background-image:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(0,0,0,0.15) 0%, transparent 50%);
  border-radius: 12px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
}
```

**Step 2: 修改 .scores-table 样式应用绒布效果**

找到 `.scores-table` 样式（约第31行），替换为：

```css
.scores-table {
  margin-bottom: 24px;
  padding: 20px;
  background: #1b5e20;
  background-image:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(0,0,0,0.15) 0%, transparent 50%);
  border-radius: 16px;
  border: 3px solid #4e342e;
  box-shadow:
    inset 0 2px 8px rgba(0,0,0,0.4),
    0 4px 12px rgba(0,0,0,0.3);
}
```

**Step 3: 修改 .dice-area 样式应用绒布效果**

找到 `.dice-area` 样式（约第108行），替换为：

```css
.dice-area {
  background: #2e7d32;
  background-image:
    radial-gradient(circle at 50% 30%, rgba(255,255,255,0.1) 0%, transparent 60%),
    radial-gradient(circle at 30% 70%, rgba(0,0,0,0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(0,0,0,0.1) 0%, transparent 50%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 200px;
  border: 2px solid #1b5e20;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
}
```

**Step 4: 提交**

```bash
git add simple-game/style.css
git commit -m "style: add felt surface textures to game areas"
```

---

## Task 6: 改造按钮为木质样式

**Files:**
- Modify: `simple-game/style.css`

**Step 1: 修改基础按钮样式为木质效果**

找到 `.btn` 样式（约第190行），替换为：

```css
.btn {
  padding: 15px 40px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  border: 2px solid #4e342e;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
  background: linear-gradient(180deg, #8d6e63 0%, #6d4c41 100%);
  color: #fff8e1;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  box-shadow:
    0 4px 0 #4e342e,
    0 6px 12px rgba(0,0,0,0.3);
}
```

**Step 2: 修改按钮激活状态**

找到 `.btn:active` 样式（约第201行），替换为：

```css
.btn:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 #4e342e,
    0 3px 6px rgba(0,0,0,0.3);
}
```

**Step 3: 更新各颜色按钮为木质变体**

替换所有 `.btn-*` 颜色变体（约第205-232行）为：

```css
.btn-primary {
  background: linear-gradient(180deg, #7e57c2 0%, #5e35b1 100%);
}

.btn-secondary {
  background: linear-gradient(180deg, #78909c 0%, #546e7a 100%);
}

.btn-info {
  background: linear-gradient(180deg, #42a5f5 0%, #1976d2 100%);
}

.btn-success {
  background: linear-gradient(180deg, #66bb6a 0%, #388e3c 100%);
}

.btn-warning {
  background: linear-gradient(180deg, #ffa726 0%, #f57c00 100%);
}

.btn-danger {
  background: linear-gradient(180deg, #ef5350 0%, #d32f2f 100%);
}
```

**Step 4: 测试木质按钮效果**

刷新浏览器，验证按钮显示为木质纹理，点击有按压效果

预期：按钮显示木质渐变，点击时有下沉动画

**Step 5: 提交**

```bash
git add simple-game/style.css
git commit -m "style: update buttons to wooden gradient design"
```

---

## Task 7: 添加摇骰子动画CSS

**Files:**
- Modify: `simple-game/style.css`

**Step 1: 在3D骰子样式部分添加动画**

在 `.die-face.bottom` 样式之后添加：

```css
/* 摇晃动画 - 准备阶段 */
@keyframes shake {
  0%, 100% { transform: rotateX(0deg) rotateY(0deg) translateX(0); }
  25% { transform: rotateX(2deg) rotateY(2deg) translateX(2px); }
  50% { transform: rotateX(-2deg) rotateY(-2deg) translateX(-2px); }
  75% { transform: rotateX(2deg) rotateY(-2deg) translateX(2px); }
}

/* 滚动动画 - 投掷阶段 */
@keyframes roll {
  0% {
    transform: rotate3d(1,1,1,0deg) translateY(0);
  }
  50% {
    transform: rotate3d(1,1,1,720deg) translateY(-80px);
  }
  100% {
    transform: rotate3d(1,1,1,1440deg) translateY(0);
  }
}

/* 弹跳动画 - 落地阶段 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

/* 动画状态类 */
.die-3d.shaking {
  animation: shake 0.2s ease-in-out;
}

.die-3d.rolling {
  animation: roll 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.die-3d.bouncing {
  animation: bounce 0.2s ease-in-out;
}
```

**Step 2: 提交**

```bash
git add simple-game/style.css
git commit -m "style: add dice rolling animations (shake, roll, bounce)"
```

---

## Task 8: 修改 rollAgain 函数添加动画控制

**Files:**
- Modify: `simple-game/game.js`

**Step 1: 添加动画辅助函数**

在文件顶部的 `toggleDie` 函数之后添加：

```javascript
/**
 * 等待指定毫秒数
 */
function waitForAnimation(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

**Step 2: 完全替换 rollAgain 函数**

找到 `rollAgain` 函数（约第43行），完全替换为：

```javascript
/**
 * 继续摇（带动画）
 */
async function rollAgain() {
  if (gameState.gamePhase !== 'selecting') return
  if (selectedDiceIndices.length === 0) {
    gameState.message = '必须至少选择1个骰子才能继续摇'
    window.UI.updateUI(gameState, selectedDiceIndices)
    return
  }

  // 获取所有骰子元素
  const diceElements = document.querySelectorAll('.dice-row .die-3d')

  // 阶段1: 摇晃动画
  diceElements.forEach(die => {
    die.classList.add('shaking')
  })
  await waitForAnimation(200)

  // 阶段2: 滚动动画
  diceElements.forEach(die => {
    die.classList.remove('shaking')
    die.classList.add('rolling')
  })
  await waitForAnimation(400)

  // 阶段3: 弹跳动画
  diceElements.forEach(die => {
    die.classList.remove('rolling')
    die.classList.add('bouncing')
  })
  await waitForAnimation(200)

  // 移除所有动画类
  diceElements.forEach(die => {
    die.classList.remove('bouncing')
  })

  // 更新游戏状态
  gameState = window.GameLogic.rollAgain(gameState, selectedDiceIndices)
  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}
```

**Step 3: 测试摇骰子动画**

在浏览器中打开游戏，点击"开始游戏"，然后点击"继续摇"

预期：骰子先摇晃(0.2s)，然后旋转滚动(0.4s)，最后弹跳(0.2s)，然后显示新点数

**Step 4: 提交**

```bash
git add simple-game/game.js
git commit -m "feat: add dice rolling animation to rollAgain function"
```

---

## Task 9: 创建 SoundManager 类

**Files:**
- Create: `simple-game/utils/sound-manager.js`

**Step 1: 创建 sound-manager.js 文件**

```javascript
/**
 * Farkle 游戏音效管理器
 * 使用 Web Audio API 生成音效，无需外部音频文件
 */
class SoundManager {
  constructor() {
    this.audioContext = null
    this.volume = 0.5
    this.muted = false
    this.initAudioContext()
  }

  /**
   * 初始化音频上下文
   */
  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
    } catch (e) {
      console.warn('Web Audio API not supported:', e)
    }
  }

  /**
   * 确保音频上下文已恢复（浏览器自动播放策略）
   */
  async ensureContextResumed() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * 点击音效（短促高频音）
   */
  async playClick() {
    if (this.muted || !this.audioContext) return
    await this.ensureContextResumed()
    this.playTone(800, 0.1, 'sine', 0.3)
  }

  /**
   * 摇骰子音效（随机低频噪点）
   */
  async playRoll() {
    if (this.muted || !this.audioContext) return
    await this.ensureContextResumed()
    const frequencies = [200, 250, 300, 350, 400]
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const freq = frequencies[Math.floor(Math.random() * frequencies.length)]
        this.playTone(freq, 0.05, 'square', 0.2)
      }, i * 80)
    }
  }

  /**
   * 得分音效（上升音调）
   */
  async playScore() {
    if (this.muted || !this.audioContext) return
    await this.ensureContextResumed()
    const now = this.audioContext.currentTime
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(400, now)
    oscillator.frequency.linearRampToValueAtTime(800, now + 0.2)

    gainNode.gain.setValueAtTime(this.volume * 0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

    oscillator.start(now)
    oscillator.stop(now + 0.2)
  }

  /**
   * Farkle音效（下降音调）
   */
  async playFarkle() {
    if (this.muted || !this.audioContext) return
    await this.ensureContextResumed()
    const now = this.audioContext.currentTime
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(400, now)
    oscillator.frequency.linearRampToValueAtTime(200, now + 0.3)

    gainNode.gain.setValueAtTime(this.volume * 0.3, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    oscillator.start(now)
    oscillator.stop(now + 0.3)
  }

  /**
   * 胜利音效（和弦）
   */
  async playWin() {
    if (this.muted || !this.audioContext) return
    await this.ensureContextResumed()
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
    frequencies.forEach(freq => {
      this.playTone(freq, 0.5, 'sine', 0.2)
    })
  }

  /**
   * 通用音调播放器
   */
  playTone(frequency, duration, type = 'sine', volumeMultiplier = 0.3) {
    if (!this.audioContext) return
    const now = this.audioContext.currentTime
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)

    gainNode.gain.setValueAtTime(this.volume * volumeMultiplier, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  /**
   * 设置音量
   */
  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level))
  }

  /**
   * 切换静音
   */
  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }
}

// 导出为模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager
} else {
  window.SoundManager = SoundManager
}
```

**Step 2: 提交**

```bash
git add simple-game/utils/sound-manager.js
git commit -m "feat: create SoundManager class with Web Audio API"
```

---

## Task 10: 在 HTML 中引入 SoundManager

**Files:**
- Modify: `simple-game/index.html`

**Step 1: 在模块加载部分添加 sound-manager.js**

找到 `<!-- 模块加载（按依赖顺序） -->` 部分（约第100行），在 `game.js` 之前添加：

```html
  <!-- 模块加载（按依赖顺序） -->
  <script src="utils/scorer.js"></script>
  <script src="utils/gameLogic.js"></script>
  <script src="utils/ui.js"></script>
  <script src="utils/sound-manager.js"></script>
  <script src="game.js"></script>
```

**Step 2: 在控制按钮区域添加静音按钮**

找到 `<!-- 控制按钮 -->` 部分（约第68行），在最后一个按钮后添加：

```html
    <!-- 控制按钮 -->
    <div class="controls">
      <button class="btn btn-primary" id="btnStart">开始游戏</button>
      <button class="btn btn-info" id="btnRollAgain" style="display: none;">继续摇</button>
      <button class="btn btn-success" id="btnEndTurn" style="display: none;">结束回合</button>
      <button class="btn btn-warning" id="btnNext" style="display: none;">下一位</button>
      <button class="btn btn-danger" id="btnNewGame" style="display: none;">新游戏</button>
      <button class="btn btn-secondary" id="btnRules">规则</button>
      <button class="btn btn-secondary" id="btnMute">🔊</button>
    </div>
```

**Step 3: 提交**

```bash
git add simple-game/index.html
git commit -m "feat: add SoundManager script and mute button to HTML"
```

---

## Task 11: 在 game.js 中初始化和集成音效

**Files:**
- Modify: `simple-game/game.js`

**Step 1: 在文件顶部初始化 SoundManager**

在 `let selectedDiceIndices = []` 之后添加：

```javascript
// 音效管理器
let soundManager = new SoundManager()
```

**Step 2: 修改 toggleDie 函数添加点击音效**

找到 `toggleDie` 函数（约第15行），在函数体的最后添加音效调用：

```javascript
function toggleDie(index) {
  if (gameState.gamePhase !== 'selecting') return

  const idx = selectedDiceIndices.indexOf(index)
  if (idx > -1) {
    selectedDiceIndices.splice(idx, 1)
  } else {
    selectedDiceIndices.push(index)
    soundManager.playClick() // 添加音效
  }

  window.UI.updateUI(gameState, selectedDiceIndices)
}
```

**Step 3: 修改 rollAgain 函数添加摇骰子音效**

在 `rollAgain` 函数开头添加音效调用：

```javascript
async function rollAgain() {
  if (gameState.gamePhase !== 'selecting') return
  if (selectedDiceIndices.length === 0) {
    gameState.message = '必须至少选择1个骰子才能继续摇'
    window.UI.updateUI(gameState, selectedDiceIndices)
    return
  }

  soundManager.playRoll() // 添加音效

  // 获取所有骰子元素
  const diceElements = document.querySelectorAll('.dice-row .die-3d')
  // ... 其余代码 ...
}
```

**Step 4: 修改 endTurn 函数添加得分/Farkle音效**

找到 `endTurn` 函数（约第59行），在验证成功后添加音效：

```javascript
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
  }

  // 如果总分为0，不能结束回合
  if (totalScore === 0) {
    gameState.message = '必须选择骰子并保留后才能结束回合'
    window.UI.updateUI(gameState, selectedDiceIndices)
    return
  }

  gameState = window.GameLogic.endTurn(gameState, selectedDiceIndices)

  // 添加音效
  if (gameState.gamePhase === 'farkle') {
    soundManager.playFarkle()
  } else if (gameState.gamePhase === 'gameOver') {
    soundManager.playWin()
  } else {
    soundManager.playScore()
  }

  selectedDiceIndices = []
  window.UI.updateUI(gameState, selectedDiceIndices)
}
```

**Step 5: 在 initEventListeners 中添加静音按钮事件**

找到 `initEventListeners` 函数（约第123行），在最后添加：

```javascript
function initEventListeners() {
  document.getElementById('btnStart').addEventListener('click', startGame)
  document.getElementById('btnRollAgain').addEventListener('click', rollAgain)
  document.getElementById('btnEndTurn').addEventListener('click', endTurn)
  document.getElementById('btnNext').addEventListener('click', switchPlayer)
  document.getElementById('btnNewGame').addEventListener('click', newGame)
  document.getElementById('btnRules').addEventListener('click', showRules)
  document.getElementById('btnMute').addEventListener('click', () => {
    const muted = soundManager.toggleMute()
    document.getElementById('btnMute').textContent = muted ? '🔇' : '🔊'
  })
}
```

**Step 6: 测试所有音效**

在浏览器中打开游戏，测试：
- 点击骰子 → 短促"嘟"声
- 继续摇 → 连续低频音
- 结束回合得分 → 上升音调
- Farkle → 下降音调
- 点击静音按钮 → 图标切换，后续音效停止

预期：所有音效正常播放，静音功能正常

**Step 7: 提交**

```bash
git add simple-game/game.js
git commit -m "feat: integrate sound effects into game interactions"
```

---

## Task 12: 最终测试和优化

**Files:**
- Test: `simple-game/index.html` (browser testing)

**Step 1: 完整游戏流程测试**

在浏览器中打开游戏，执行完整流程：
1. 点击"开始游戏" → 验证3D骰子显示
2. 摇骰子 → 验证动画流畅
3. 选择骰子 → 验证音效和选中状态
4. 继续摇 → 验证动画和音效
5. 结束回合 → 验证得分音效
6. 测试Farkle情况 → 验证Farkle音效
7. 测试游戏胜利 → 验证胜利音效

预期：所有功能正常，无控制台错误

**Step 2: 跨浏览器测试**

在以下浏览器中测试（如可用）：
- Chrome/Edge (Chromium)
- Firefox
- Safari

预期：所有浏览器功能一致

**Step 3: 性能检查**

打开浏览器开发者工具 Performance 面板：
1. 录制一次摇骰子动画
2. 检查帧率是否稳定在60fps
3. 检查是否有内存泄漏

预期：帧率稳定，无内存泄漏

**Step 4: 响应式测试**

调整浏览器窗口大小，验证在移动设备尺寸下正常显示

预期：小屏幕下布局正常，骰子大小自适应

**Step 5: 代码清理**

检查是否有console.log调试语句需要移除，注释是否完整

**Step 6: 最终提交**

```bash
git add simple-game/
git commit -m "test: complete visual enhancement implementation - all features tested"
```

---

## 验收标准

- ✅ 3D骰子正确显示各面点数
- ✅ 骰子旋转流畅（摇晃→滚动→弹跳）
- ✅ 选中/保留状态视觉反馈清晰
- ✅ 木质棋盘背景和绒布台面
- ✅ 所有音效正常播放
- ✅ 静音功能正常
- ✅ 跨浏览器兼容性良好
- ✅ 动画帧率稳定60fps
- ✅ 移动端响应式正常

---

**计划完成！准备开始实施。**
