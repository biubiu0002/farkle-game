# Simple-Game 视觉增强设计文档

**日期**: 2025-02-21
**方案**: 方案A - 纯CSS 3D + 内置音效
**目标**: 为 simple-game 添加3D拟物骰子、木质棋盘界面、真实动画和基础音效

---

## 1. 3D骰子组件设计

### 技术方案
使用 CSS 3D transforms (`transform-style: preserve-3d`) 创建立方体骰子，无需依赖3D库。

### 组件结构
```html
<div class="dice-container">
  <div class="die" data-value="1">
    <div class="face front">...</div>
    <div class="face back">...</div>
    <div class="face right">...</div>
    <div class="face left">...</div>
    <div class="face top">...</div>
    <div class="face bottom">...</div>
  </div>
</div>
```

### 关键CSS实现
- `.die` 容器: `transform-style: preserve-3d`, `transition: transform 0.6s ease-out`
- 每个面使用 `rotateX/Y` + `translateZ(40px)` 定位（假设骰子80px）
- 点数使用 CSS grid 布局绘制，避免图片依赖
- 木质纹理: `background: linear-gradient(135deg, #d4a574 0%, #c4956a 100%)`
- 圆角和阴影: `border-radius: 8px`, `box-shadow: inset 0 0 10px rgba(0,0,0,0.3)`

### 点数布局规则
- 1点: 居中
- 2点: 对角
- 3点: 对角 + 居中
- 4点: 四角
- 5点: 四角 + 居中
- 6点: 两列各三点

### 集成方式
修改 `game.js` 中的 `renderDice()` 函数：
- 将现有的 `.die-simple` 替换为3D骰子结构
- 添加 `.held` 和 `.selected` 状态样式
- 根据 `die.value` 旋转骰子显示对应面

---

## 2. 木质棋盘界面设计

### 整体布局
```
┌─────────────────────────────────┐
│  标题: 🎲 Farkle (木质招牌效果)   │
├─────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐       │
│  │玩家1卡片 │  │玩家2卡片 │       │ <- 木质边框
│  └─────────┘  └─────────┘       │
│  ┌─────────────────────────┐   │
│  │  消息提示区 (绒布背景)    │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │    骰子区域 (绒布)       │   │
│  │   [3D骰子展示区]         │   │
│  └─────────────────────────┘   │
│  [按钮们] (木质按钮)            │
└─────────────────────────────────┘
```

### CSS样式实现

#### 背景木纹
```css
body {
  background-color: #5d4037;
  background-image:
    repeating-linear-gradient(90deg,
      transparent 0px,
      transparent 2px,
      rgba(0,0,0,0.1) 2px,
      rgba(0,0,0,0.1) 4px
    );
}
```

#### 绿色绒布台面
```css
.felt-surface {
  background: #2e7d32;
  background-image:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0%, transparent 50%);
}
```

#### 木质卡片边框
```css
.wooden-card {
  border: 8px solid #8d6e63;
  border-radius: 10px;
  box-shadow:
    inset 0 0 10px rgba(0,0,0,0.5),
    0 4px 6px rgba(0,0,0,0.3);
}
```

#### 木质按钮
```css
.wooden-button {
  background: linear-gradient(180deg, #8d6e63 0%, #5d4037 100%);
  border: 2px solid #4e342e;
  border-radius: 8px;
  box-shadow: 0 4px 0 #3e2723;
}
.wooden-button:active {
  box-shadow: 0 2px 0 #3e2723;
  transform: translateY(2px);
}
```

### 集成方式
- 在 `index.html` 中为各区域添加相应的 CSS 类
- 保持现有 HTML 结构不变，通过 CSS 类名改造外观
- 在 `style.css` 中添加新的样式定义

---

## 3. 真实摇骰子动画系统

### 动画阶段划分

#### 阶段1: 准备 (0.2s)
骰子在手中轻微摇晃
```css
@keyframes shake {
  0%, 100% { transform: rotate(0deg) translateX(0); }
  25% { transform: rotate(5deg) translateX(2px); }
  75% { transform: rotate(-5deg) translateX(-2px); }
}
```

#### 阶段2: 投掷 (0.4s)
骰子旋转抛出，快速3D旋转
```css
@keyframes roll {
  0% { transform: rotate3d(1,1,1,0deg) translateY(0); }
  50% { transform: rotate3d(1,1,1,720deg) translateY(-100px); }
  100% { transform: rotate3d(1,1,1,1440deg) translateY(0); }
}
```

#### 阶段3: 落地 (0.2s)
轻微弹跳后停止
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

### JavaScript控制逻辑

修改 `game.js` 中的 `rollDice()` 函数：

```javascript
async function rollDice() {
  // 添加动画类
  diceElements.forEach(die => {
    die.classList.add('shaking');
  });

  // 等待摇晃完成
  await waitForAnimation(200);

  // 移除摇晃，添加滚动
  diceElements.forEach(die => {
    die.classList.remove('shaking');
    die.classList.add('rolling');
  });

  // 等待滚动完成
  await waitForAnimation(400);

  // 添加弹跳
  diceElements.forEach(die => {
    die.classList.remove('rolling');
    die.classList.add('bouncing');
  });

  // 等待弹跳完成
  await waitForAnimation(200);

  // 更新骰子数值
  // ... 原有逻辑 ...

  // 移除所有动画类
  diceElements.forEach(die => {
    die.classList.remove('bouncing');
  });
}

function waitForAnimation(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 性能优化
- 使用 `will-change: transform` 提示浏览器优化
- 动画结束后移除动画类，避免持续重绘
- 使用 `transform` 而非 `top/left` 实现移动，启用GPU加速

---

## 4. 内置音效系统（Web Audio API）

### SoundManager类设计

```javascript
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.volume = 0.5;
    this.muted = false;
    this.initAudioContext();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
  }

  // 点击音效（短促高频音）
  playClick() {
    if (this.muted) return;
    this.playTone(800, 0.1, 'sine', 0.3);
  }

  // 摇骰子音效（随机低频噪点）
  playRoll() {
    if (this.muted) return;
    const frequencies = [200, 250, 300, 350, 400];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
        this.playTone(freq, 0.05, 'square', 0.2);
      }, i * 80);
    }
  }

  // 得分音效（上升音调）
  playScore() {
    if (this.muted) return;
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(800, now + 0.2);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  // Farkle音效（下降音调）
  playFarkle() {
    if (this.muted) return;
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(200, now + 0.3);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // 胜利音效（和弦）
  playWin() {
    if (this.muted) return;
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    frequencies.forEach(freq => {
      this.playTone(freq, 0.5, 'sine', 0.2);
    });
  }

  // 通用音调播放器
  playTone(frequency, duration, type = 'sine', volumeMultiplier = 0.3) {
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(this.volume * volumeMultiplier, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
```

### 集成点

在 `index.html` 中：
```html
<script>
  const soundManager = new SoundManager();
</script>
```

在 `game.js` 中的关键事件：
```javascript
// 选择骰子
function selectDie(index) {
  soundManager.playClick();
  // ... 原有逻辑 ...
}

// 摇骰子
function rollDice() {
  soundManager.playRoll();
  // ... 原有逻辑 ...
}

// 结束回合
function endTurn() {
  if (score > 0) {
    soundManager.playScore();
  } else {
    soundManager.playFarkle();
  }
  // ... 原有逻辑 ...
}

// 游戏胜利
function checkWin() {
  if (winner) {
    soundManager.playWin();
    // ... 原有逻辑 ...
  }
}
```

### UI集成

在 `index.html` 中添加静音按钮：
```html
<button id="mute-button" onclick="toggleMute()">🔊</button>
```

```javascript
function toggleMute() {
  const muted = soundManager.toggleMute();
  document.getElementById('mute-button').textContent = muted ? '🔇' : '🔊';
}
```

### 浏览器兼容性
- Chrome/Firefox/Safari/Edge 现代版本全面支持
- 需要用户首次交互后才能播放（浏览器自动播放策略）
- 提供静音开关避免用户困扰

---

## 5. 实现文件结构

```
simple-game/
├── index.html          (添加音效类和静音按钮)
├── game.js             (修改 renderDice, rollDice, 集成音效)
├── style.css           (新增3D骰子、木质棋盘、动画样式)
└── sound-manager.js    (新增音效管理器)
```

---

## 6. 测试计划

### 功能测试
- [ ] 3D骰子正确显示各面点数
- [ ] 骰子旋转动画流畅
- [ ] 选中/保留状态视觉反馈清晰
- [ ] 所有音效正常播放
- [ ] 静音功能正常
- [ ] 跨浏览器兼容性

### 性能测试
- [ ] 动画帧率稳定60fps
- [ ] 无内存泄漏
- [ ] 音效播放无卡顿

---

## 7. 实施顺序

1. **阶段1**: 3D骰子组件（基础结构+点数渲染）
2. **阶段2**: 木质棋盘界面（背景+卡片样式）
3. **阶段3**: 摇骰子动画（摇晃+滚动+弹跳）
4. **阶段4**: 音效系统（SoundManager+集成）
5. **阶段5**: 测试和优化

---

**设计状态**: ✅ 已批准
**下一步**: 调用 writing-plans skill 创建详细实现计划
