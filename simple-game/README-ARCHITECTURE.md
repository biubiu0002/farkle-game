# Farkle 游戏 - 架构说明

## 📁 新架构（v6.0）

```
simple-game/
├── index-new.html          # 主页面（使用新架构）
├── style.css               # 所有样式
├── game-new.js             # 主入口（事件监听）
└── utils/
    ├── scorer.js           # 计分逻辑（纯函数）
    ├── gameLogic.js        # 游戏状态管理（无DOM）
    └── ui.js               # UI更新逻辑（DOM操作）
```

## 🏗️ 模块职责

### 1. `utils/scorer.js` - 计分模块
**职责：** 所有计分相关的纯函数
- ✅ 无状态
- ✅ 无 DOM 操作
- ✅ 可独立测试

**主要函数：**
```javascript
countDice(dice)                      // 统计骰子
getPossibleScores(dice)              // 获取所有可能的得分
isFarkle(dice)                       // 判断是否Farkle
validateSelection(dice, selected)    // 验证选择的骰子
```

### 2. `utils/gameLogic.js` - 游戏逻辑模块
**职责：** 游戏状态管理和业务逻辑
- ✅ 无 DOM 操作
- ✅ 纯函数式状态更新
- ✅ 返回新的状态对象

**主要函数：**
```javascript
createInitialState()          // 创建初始状态
startGame(state)              // 开始游戏
rollAgain(state, indices)     // 继续摇骰子
endTurn(state, indices)       // 结束回合
switchPlayerAfterFarkle(state) // Farkle后切换玩家
newGame()                     // 新游戏
```

### 3. `utils/ui.js` - UI模块
**职责：** 所有 DOM 操作和 UI 更新
- ✅ 只负责渲染
- ✅ 不修改游戏状态
- ✅ 接收状态并更新视图

**主要函数：**
```javascript
updateUI(gameState, selectedIndices)  // 更新整个UI
renderDice(containerId, dice, ...)    // 渲染骰子
```

### 4. `game-new.js` - 主入口
**职责：** 连接 UI 和游戏逻辑
- ✅ 事件监听
- ✅ 状态管理
- ✅ 调用其他模块

### 5. `style.css` - 样式文件
**职责：** 所有视觉样式
- ✅ 独立的 CSS 文件
- ✅ 便于后续迁移到 uni-app 的样式部分

## 🚀 迁移到 uni-app 的步骤

### Step 1: 直接复用的模块
以下模块可以直接复制到 `src/`：

```bash
# 计分逻辑 - 直接复用
cp simple-game/utils/scorer.js src/utils/scorer.ts
# 改为 TypeScript，添加类型

# 游戏逻辑 - 直接复用
cp simple-game/utils/gameLogic.js src/utils/gameLogic.ts
# 改为 TypeScript，添加类型
```

### Step 2: 转换为 Vue 组件
**原来的 HTML 结构 → Vue 组件：**

```vue
<!-- src/pages/index/index.vue -->
<template>
  <view class="container">
    <!-- 得分表格 -->
    <view class="scores-table">
      <!-- ... -->
    </view>

    <!-- 骰子区域 -->
    <view class="dice-area">
      <Die
        v-for="die in unheldDice"
        :key="die.index"
        :value="die.value"
        :selected="isSelected(die.index)"
        @click="toggleDie(die.index)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createInitialState, startGame, rollAgain } from '@/utils/gameLogic'
import { validateSelection } from '@/utils/scorer'

const gameState = ref(createInitialState())
const selectedDiceIndices = ref<number[]>([])

function toggleDie(index: number) {
  // 逻辑保持不变
}
</script>

<style scoped>
/* 复用 style.css 中的样式 */
</style>
```

### Step 3: 骰子组件
**创建独立的骰子组件：**

```vue
<!-- src/components/Die.vue -->
<template>
  <view
    class="die"
    :class="{ selected, held }"
    @click="handleClick"
  >
    {{ value }}
  </view>
</template>

<script setup lang="ts">
defineProps<{
  value: number
  selected?: boolean
  held?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>
```

### Step 4: 样式适配
**CSS → uni-app 样式：**

```css
/* 原始 CSS */
.die {
  width: 70px;
  height: 70px;
}

/* uni-app 适配（使用 rpx 单位） */
.die {
  width: 140rpx;  /* 70px * 2 = 140rpx */
  height: 140rpx;
}
```

## 🔧 关键差异对照

| 特性 | simple-game (HTML/JS) | uni-app (Vue) |
|------|----------------------|---------------|
| DOM 操作 | `document.getElementById()` | Vue 响应式数据 |
| 事件处理 | `addEventListener` | `@click` 绑定 |
| 样式单位 | `px` | `rpx` |
| 状态管理 | 全局变量 | `ref` / `reactive` |
| 组件复用 | 函数 | Vue 组件 |

## ✅ 优势

1. **逻辑复用**：`scorer.js` 和 `gameLogic.js` 可以直接复用
2. **易于测试**：纯函数，便于单元测试
3. **维护性强**：模块清晰，职责分明
4. **迁移方便**：核心逻辑无需修改，只需转换 UI 层

## 📝 迁移清单

- [x] 提取计分逻辑到 `scorer.js`
- [x] 提取游戏逻辑到 `gameLogic.js`
- [x] 提取 UI 逻辑到 `ui.js`
- [x] 分离样式到 `style.css`
- [ ] 转换为 TypeScript（添加类型）
- [ ] 创建 Vue 组件
- [ ] 适配 uni-app 样式
- [ ] 测试多端运行（H5、微信小程序）

## 🎵 音频系统

游戏支持背景音乐和音效：

- **背景音乐**：自动循环播放，可在左上角控制面板调整音量或关闭
- **游戏音效**：摇骰子、选中骰子、得分等音效，可在控制面板调整

### 音量控制

点击左上角 🔊 图标展开音量控制面板：
- 背景音乐开关和音量
- 游戏音效开关和音量

所有设置会自动保存到浏览器本地存储。

### 音频模块

```
utils/
├── sound-manager.js    # 音效管理器（播放骰子、得分、Farkle等音效）
├── bgm-manager.js      # 背景音乐管理器（循环播放、音量控制）
└── volume-panel.js     # 音量控制面板（UI组件）
```

### 使用方法

音频系统已自动集成，无需额外配置。如需测试或修改，请参考 `TESTING-AUDIO.md` 测试文档。

## 🎯 下一步

1. **测试新架构**：打开 `index-new.html` 验证功能
2. **对比旧版本**：确保 `index.html` 和 `index-new.html` 功能一致
3. **开始迁移**：将模块逐步迁移到 `src/` 目录
4. **类型化**：将 JavaScript 改为 TypeScript
5. **组件化**：创建 Vue 组件
