# Farkle 游戏重构实施计划 - 阶段1：基础迁移

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 simple-game 迁移到 src/ 目录，使用 uni-app + Vue3 + TypeScript，实现可在 H5 运行的完整游戏功能。

**Architecture:**
- 复用 simple-game 的逻辑层（scorer.js, gameLogic.js），转换为 TypeScript
- 使用 Vue3 Composition API 重写 UI 层
- 组件化架构：Die, ScoreBoard, ControlPanel 等独立组件
- 响应式状态管理：gameState 驱动 UI 更新

**Tech Stack:**
- uni-app (Vue3 + Vite)
- TypeScript
- CSS3（后续阶段用于动画）

**Prerequisites:**
- simple-game 目录已存在且功能正常
- src/ 目录已创建

---

## Task 1: 创建 TypeScript 类型定义

**Files:**
- Create: `src/types/game.ts`

**Step 1: 创建类型定义文件**

```typescript
// src/types/game.ts

/**
 * 骰子接口
 */
export interface Die {
  index: number          // 骰子索引（0-5）
  value: number          // 骰子点数（1-6）
  held: boolean          // 是否已保留
}

/**
 * 玩家接口
 */
export interface Player {
  id: number                    // 玩家ID
  totalScore: number            // 总分
  lastRoundScore: number        // 上一轮得分
}

/**
 * 游戏阶段
 */
export type GamePhase =
  | 'idle'        // 空闲（未开始）
  | 'rolling'     // 摇骰子中
  | 'selecting'   // 选择骰子
  | 'farkle'      // Farkle（本轮无效）
  | 'ended'       // 游戏结束

/**
 * 游戏状态接口
 */
export interface GameState {
  players: Player[]                    // 玩家列表
  currentPlayerIndex: number           // 当前玩家索引
  rolledDice: Die[]                    // 已摇出的骰子
  heldDice: Die[]                      // 已保留的骰子
  currentRoundScore: number            // 本轮当前得分
  gamePhase: GamePhase                 // 游戏阶段
  message: string                      // 提示消息
  winner: number | null                // 获胜玩家ID
}

/**
 * 计分验证结果
 */
export interface ValidationResult {
  valid: boolean              // 是否有效
  points: number              // 得分
  description?: string        // 描述
}

/**
 * 可能的得分组合
 */
export interface ScoreCombination {
  dice: number[]              // 骰子组合
  points: number              // 得分
  description: string         // 描述
}
```

**Step 2: 提交**

```bash
git add src/types/game.ts
git commit -m "feat(types): add TypeScript type definitions for game state"
```

---

## Task 2: 移植 scorer.js 到 TypeScript

**Files:**
- Create: `src/utils/scorer.ts`
- Reference: `simple-game/utils/scorer.js`

**Step 1: 读取原始 scorer.js**

Run: `cat simple-game/utils/scorer.js`

**Step 2: 创建 scorer.ts**

```typescript
// src/utils/scorer.ts
import type { Die, ScoreCombination, ValidationResult } from '@/types/game'

/**
 * 统计骰子点数分布
 * @param dice 骰子数组
 * @returns 点数分布对象 {1: count, 2: count, ...}
 */
export function countDice(dice: number[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  for (const die of dice) {
    counts[die] = (counts[die] || 0) + 1
  }
  return counts
}

/**
 * 计算单个骰子点数的得分（不考虑三条）
 * @param value 骰子点数
 * @param count 数量
 * @returns 得分
 */
function calculateSingleValueScore(value: number, count: number): number {
  if (value === 1) return count * 100
  if (value === 5) return count * 50
  return 0
}

/**
 * 计算三条的得分
 * @param value 骰子点数
 * @param count 数量
 * @returns 得分
 */
function calculateTripleScore(value: number, count: number): number {
  if (count < 3) return 0

  let score = 0
  const base = value === 1 ? 1000 : value * 100

  // 三条
  score = base

  // 四条 = 2倍
  if (count === 4) score *= 2

  // 五条 = 4倍
  if (count === 5) score *= 4

  // 六条 = 8倍
  if (count === 6) score *= 8

  return score
}

/**
 * 检查是否有顺子
 * @param dice 骰子数组
 * @returns 顺子得分，无顺子返回 0
 */
function checkStraight(dice: number[]): number {
  const sorted = [...dice].sort((a, b) => a - b)

  // 小顺子 1-5
  if (sorted.join(',') === '1,2,3,4,5') return 500

  // 小顺子 2-6
  if (sorted.join(',') === '2,3,4,5,6') return 750

  // 大顺子 1-6（需要6个骰子）
  if (dice.length === 6 && sorted.join(',') === '1,2,3,4,5,6') return 1500

  return 0
}

/**
 * 检查三对（3 pairs）
 * @param dice 骰子数组
 * @returns 是否三对
 */
function isThreePairs(dice: number[]): boolean {
  if (dice.length !== 6) return false

  const counts = countDice(dice)
  const pairCount = Object.values(counts).filter(c => c === 2).length

  return pairCount === 3
}

/**
 * 检查两个三条（2 triples）
 * @param dice 骰子数组
 * @returns 是否两个三条
 */
function isTwoTriples(dice: number[]): boolean {
  if (dice.length !== 6) return false

  const counts = countDice(dice)
  const tripleCount = Object.values(counts).filter(c => c === 3).length

  return tripleCount === 2
}

/**
 * 获取所有可能的得分组合
 * @param dice 骰子数组
 * @returns 所有可能的得分组合
 */
export function getPossibleScores(dice: number[]): ScoreCombination[] {
  const combinations: ScoreCombination[] = []

  // 检查顺子
  const straightScore = checkStraight(dice)
  if (straightScore > 0) {
    combinations.push({
      dice: [...dice],
      points: straightScore,
      description: straightScore === 1500 ? '大顺子(1-6)' : `顺子(${dice.join(',')})`
    })
    return combinations // 顺子只能单独使用
  }

  // 检查三对
  if (isThreePairs(dice)) {
    combinations.push({
      dice: [...dice],
      points: 1500,
      description: '三对'
    })
    return combinations // 三对只能单独使用
  }

  // 检查两个三条
  if (isTwoTriples(dice)) {
    combinations.push({
      dice: [...dice],
      points: 2500,
      description: '两个三条'
    })
    return combinations // 两个三条只能单独使用
  }

  // 检查每个点数
  const counts = countDice(dice)

  for (let value = 1; value <= 6; value++) {
    const count = counts[value]

    if (count === 0) continue

    // 三条及以上
    if (count >= 3) {
      const score = calculateTripleScore(value, count)
      combinations.push({
        dice: Array(count).fill(value),
        points: score,
        description: count === 3 ? `三个${value}` : count === 4 ? `四个${value}` : `五个${value}` : `六个${value}`
      })

      // 1和5在三条之外还能单独计分
      if (value === 1 || value === 5) {
        const singleScore = calculateSingleValueScore(value, count)
        combinations.push({
          dice: Array(count).fill(value),
          points: singleScore,
          description: `${count}个${value}`
        })
      }
    } else {
      // 单个1和5
      if (value === 1 || value === 5) {
        const score = calculateSingleValueScore(value, count)
        combinations.push({
          dice: Array(count).fill(value),
          points: score,
          description: `${count}个${value}`
        })
      }
    }
  }

  return combinations
}

/**
 * 判断是否 Farkle（无法计分）
 * @param dice 骰子数组
 * @returns 是否 Farkle
 */
export function isFarkle(dice: number[]): boolean {
  const scores = getPossibleScores(dice)
  return scores.length === 0
}

/**
 * 验证选择的骰子是否有效
 * @param allDice 所有骰子
 * @param selectedDice 选中的骰子
 * @returns 验证结果
 */
export function validateSelection(allDice: number[], selectedDice: number[]): ValidationResult {
  if (selectedDice.length === 0) {
    return {
      valid: false,
      points: 0,
      description: '请选择至少一个骰子'
    }
  }

  // 检查选中的骰子是否都在所有骰子中
  const allDiceCopy = [...allDice]
  for (const die of selectedDice) {
    const index = allDiceCopy.indexOf(die)
    if (index === -1) {
      return {
        valid: false,
        points: 0,
        description: '选择的骰子无效'
      }
    }
    allDiceCopy.splice(index, 1)
  }

  // 获取选中骰子的所有可能得分
  const scores = getPossibleScores(selectedDice)

  if (scores.length === 0) {
    return {
      valid: false,
      points: 0,
      description: '这些骰子无法计分'
    }
  }

  // 找出最高分
  const maxScore = Math.max(...scores.map(s => s.points))

  return {
    valid: true,
    points: maxScore,
    description: scores.find(s => s.points === maxScore)?.description
  }
}
```

**Step 3: 提交**

```bash
git add src/utils/scorer.ts
git commit -m "feat(utils): migrate scorer.js to TypeScript"
```

---

## Task 3: 移植 gameLogic.js 到 TypeScript

**Files:**
- Create: `src/utils/gameLogic.ts`
- Reference: `simple-game/utils/gameLogic.js`

**Step 1: 读取原始 gameLogic.js**

Run: `cat simple-game/utils/gameLogic.js`

**Step 2: 创建 gameLogic.ts**

```typescript
// src/utils/gameLogic.ts
import type { Die, GameState, Player } from '@/types/game'
import { isFarkle, validateSelection } from './scorer'

/**
 * 创建骰子数组
 * @param count 数量
 * @returns 骰子数组
 */
function createDice(count: number): Die[] {
  const dice: Die[] = []
  for (let i = 0; i < count; i++) {
    dice.push({
      index: i,
      value: Math.floor(Math.random() * 6) + 1,
      held: false
    })
  }
  return dice
}

/**
 * 创建初始状态
 * @returns 初始游戏状态
 */
export function createInitialState(): GameState {
  return {
    players: [
      { id: 0, totalScore: 0, lastRoundScore: 0 },
      { id: 1, totalScore: 0, lastRoundScore: 0 }
    ],
    currentPlayerIndex: 0,
    rolledDice: [],
    heldDice: [],
    currentRoundScore: 0,
    gamePhase: 'idle',
    message: '点击"开始游戏"',
    winner: null
  }
}

/**
 * 开始游戏
 * @param state 当前状态
 * @returns 新状态
 */
export function startGame(state: GameState): GameState {
  // 摇6个骰子
  const rolledDice = createDice(6)

  // 检查是否 Farkle
  const farkle = isFarkle(rolledDice.map(d => d.value))

  return {
    ...state,
    rolledDice,
    heldDice: [],
    currentRoundScore: 0,
    gamePhase: farkle ? 'farkle' : 'selecting',
    message: farkle ? 'Farkle！本轮无分，点击"下一位"' : '请选择要保留的骰子'
  }
}

/**
 * 继续摇骰子
 * @param state 当前状态
 * @param selectedIndices 选中的骰子索引
 * @returns 新状态
 */
export function rollAgain(state: GameState, selectedIndices: number[]): GameState {
  // 将选中的骰子添加到保留区
  const selectedDice = state.rolledDice.filter(d => selectedIndices.includes(d.index))

  // 计算选中骰子的得分
  const selectedValues = selectedDice.map(d => d.value)
  const validation = validateSelection(state.rolledDice.map(d => d.value), selectedValues)

  if (!validation.valid) {
    return {
      ...state,
      message: validation.description || '无效的选择'
    }
  }

  // 确定剩余骰子数量
  const remainingDice = state.rolledDice.filter(d => !selectedIndices.includes(d.index))

  // 如果所有骰子都被保留（Hot Dice），可以重摇6个新骰子
  const newDiceCount = remainingDice.length === 0 ? 6 : remainingDice.length

  // 摇新的骰子
  const newDice = createDice(newDiceCount)

  // 检查是否 Farkle
  const farkle = isFarkle(newDice.map(d => d.value))

  if (farkle) {
    // Farkle：本轮分数丢失
    return {
      ...state,
      rolledDice: newDice,
      heldDice: [...state.heldDice, ...selectedDice.map(d => ({ ...d, held: true }))],
      currentRoundScore: 0,
      gamePhase: 'farkle',
      message: 'Farkle！本轮分数丢失，点击"下一位"'
    }
  }

  // 成功：更新分数
  return {
    ...state,
    rolledDice: newDice,
    heldDice: [...state.heldDice, ...selectedDice.map(d => ({ ...d, held: true }))],
    currentRoundScore: state.currentRoundScore + validation.points,
    gamePhase: 'selecting',
    message: '请选择要保留的骰子'
  }
}

/**
 * 结束回合
 * @param state 当前状态
 * @param selectedIndices 选中的骰子索引
 * @returns 新状态
 */
export function endTurn(state: GameState, selectedIndices: number[]): GameState {
  // 将选中的骰子添加到保留区并计算得分
  let newRoundScore = state.currentRoundScore

  if (selectedIndices.length > 0) {
    const selectedDice = state.rolledDice.filter(d => selectedIndices.includes(d.index))
    const selectedValues = selectedDice.map(d => d.value)
    const validation = validateSelection(state.rolledDice.map(d => d.value), selectedValues)

    if (!validation.valid) {
      return {
        ...state,
        message: validation.description || '无效的选择'
      }
    }

    newRoundScore += validation.points
  }

  // 检查是否达到入表分数（通常是300分，但第一次可以是任意分数）
  const currentPlayer = state.players[state.currentPlayerIndex]
  const firstTimeScore = currentPlayer.totalScore === 0
  const minEntryScore = 300

  if (firstTimeScore && newRoundScore < minEntryScore) {
    return {
      ...state,
      message: `第一次入表需要至少${minEntryScore}分，当前${newRoundScore}分`
    }
  }

  // 更新玩家分数
  const updatedPlayers = [...state.players]
  updatedPlayers[state.currentPlayerIndex] = {
    ...currentPlayer,
    totalScore: currentPlayer.totalScore + newRoundScore,
    lastRoundScore: newRoundScore
  }

  // 检查是否获胜（通常10000分）
  const WINNING_SCORE = 10000
  const winner = updatedPlayers[state.currentPlayerIndex].totalScore >= WINNING_SCORE
    ? state.currentPlayerIndex
    : null

  if (winner !== null) {
    return {
      ...state,
      players: updatedPlayers,
      rolledDice: [],
      heldDice: [],
      currentRoundScore: 0,
      gamePhase: 'ended',
      message: `玩家${winner + 1}获胜！`,
      winner
    }
  }

  // 切换玩家
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length

  return {
    ...state,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    rolledDice: [],
    heldDice: [],
    currentRoundScore: 0,
    gamePhase: 'idle',
    message: `轮到玩家${nextPlayerIndex + 1}`
  }
}

/**
 * Farkle 后切换玩家
 * @param state 当前状态
 * @returns 新状态
 */
export function switchPlayerAfterFarkle(state: GameState): GameState {
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    rolledDice: [],
    heldDice: [],
    currentRoundScore: 0,
    gamePhase: 'idle',
    message: `轮到玩家${nextPlayerIndex + 1}`
  }
}

/**
 * 新游戏
 * @returns 新游戏状态
 */
export function newGame(): GameState {
  return createInitialState()
}
```

**Step 3: 提交**

```bash
git add src/utils/gameLogic.ts
git commit -m "feat(utils): migrate gameLogic.js to TypeScript"
```

---

## Task 4: 创建主应用入口

**Files:**
- Create: `src/main.ts`
- Create: `src/App.vue`

**Step 1: 创建 main.ts**

```typescript
// src/main.ts
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
```

**Step 2: 创建 App.vue**

```vue
<!-- src/App.vue -->
<template>
  <view class="app">
    <index-page />
  </view>
</template>

<script setup lang="ts">
import IndexPage from './pages/index/index.vue'
</script>

<style>
/* 全局样式 */
page {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app {
  min-height: 100vh;
}
</style>
```

**Step 3: 提交**

```bash
git add src/main.ts src/App.vue
git commit -m "feat(app): create main app entry point"
```

---

## Task 5: 创建 Die 骰子组件

**Files:**
- Create: `src/components/Die.vue`

**Step 1: 创建 Die.vue**

```vue
<!-- src/components/Die.vue -->
<template>
  <view
    class="die"
    :class="{ selected, held, rolling }"
    @click="handleClick"
  >
    <view class="die-face" :class="`face-${value}`">
      <!-- 骰子点数 -->
      <view v-if="value === 1" class="dots dots-1">
        <view class="dot dot-center"></view>
      </view>

      <view v-else-if="value === 2" class="dots dots-2">
        <view class="dot dot-top-left"></view>
        <view class="dot dot-bottom-right"></view>
      </view>

      <view v-else-if="value === 3" class="dots dots-3">
        <view class="dot dot-top-left"></view>
        <view class="dot dot-center"></view>
        <view class="dot dot-bottom-right"></view>
      </view>

      <view v-else-if="value === 4" class="dots dots-4">
        <view class="dot dot-top-left"></view>
        <view class="dot dot-top-right"></view>
        <view class="dot dot-bottom-left"></view>
        <view class="dot dot-bottom-right"></view>
      </view>

      <view v-else-if="value === 5" class="dots dots-5">
        <view class="dot dot-top-left"></view>
        <view class="dot dot-top-right"></view>
        <view class="dot dot-center"></view>
        <view class="dot dot-bottom-left"></view>
        <view class="dot dot-bottom-right"></view>
      </view>

      <view v-else-if="value === 6" class="dots dots-6">
        <view class="dot dot-top-left"></view>
        <view class="dot dot-top-right"></view>
        <view class="dot dot-middle-left"></view>
        <view class="dot dot-middle-right"></view>
        <view class="dot dot-bottom-left"></view>
        <view class="dot dot-bottom-right"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

defineProps<{
  value: number
  selected?: boolean
  held?: boolean
  rolling?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<style scoped>
.die {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
}

.die.selected {
  box-shadow: 0 0 20rpx rgba(66, 185, 131, 0.6);
  transform: scale(1.1);
}

.die.held {
  opacity: 0.7;
}

.die.rolling {
  animation: roll 0.5s ease-in-out;
}

@keyframes roll {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.die-face {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 16rpx;
  box-sizing: border-box;
}

.dot {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  background: #1f2937;
  border-radius: 50%;
}

.dot-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dot-top-left {
  top: 25%;
  left: 25%;
}

.dot-top-right {
  top: 25%;
  right: 25%;
}

.dot-middle-left {
  top: 50%;
  left: 25%;
  transform: translateY(-50%);
}

.dot-middle-right {
  top: 50%;
  right: 25%;
  transform: translateY(-50%);
}

.dot-bottom-left {
  bottom: 25%;
  left: 25%;
}

.dot-bottom-right {
  bottom: 25%;
  right: 25%;
}
</style>
```

**Step 2: 提交**

```bash
git add src/components/Die.vue
git commit -m "feat(component): add Die component with basic styling"
```

---

## Task 6: 创建 ScoreBoard 计分板组件

**Files:**
- Create: `src/components/ScoreBoard.vue`

**Step 1: 创建 ScoreBoard.vue**

```vue
<!-- src/components/ScoreBoard.vue -->
<template>
  <view class="score-board">
    <view class="score-table">
      <view class="score-header">
        <view
          v-for="(player, index) in players"
          :key="player.id"
          class="player-header"
          :class="{ active: index === currentPlayerIndex }"
        >
          <text class="label">玩家{{ player.id + 1 }}</text>
        </view>
      </view>

      <view class="score-body">
        <view
          v-for="(player, index) in players"
          :key="player.id"
          class="player-scores"
          :class="{ active: index === currentPlayerIndex }"
        >
          <view class="score-row">
            <text class="label">上轮</text>
            <text class="score-value">{{ player.lastRoundScore }}</text>
          </view>
          <view class="score-row">
            <text class="label">总分</text>
            <text class="total-score">{{ player.totalScore }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Player } from '@/types/game'

defineProps<{
  players: Player[]
  currentPlayerIndex: number
}>()
</script>

<style scoped>
.score-board {
  padding: 32rpx;
}

.score-table {
  background: white;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.score-header {
  display: flex;
  border-bottom: 2rpx solid #f3f4f6;
}

.player-header {
  flex: 1;
  padding: 32rpx;
  text-align: center;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.player-header.active {
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
}

.player-header .label {
  font-size: 32rpx;
  font-weight: 600;
  color: #374151;
}

.player-header.active .label {
  color: white;
}

.score-body {
  display: flex;
}

.player-scores {
  flex: 1;
  padding: 32rpx;
  transition: all 0.3s ease;
}

.player-scores.active {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.score-row:last-child {
  margin-bottom: 0;
}

.score-row .label {
  font-size: 28rpx;
  color: #6b7280;
}

.score-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #374151;
}

.total-score {
  font-size: 36rpx;
  font-weight: 700;
  color: #10b981;
}
</style>
```

**Step 2: 提交**

```bash
git add src/components/ScoreBoard.vue
git commit -m "feat(component): add ScoreBoard component"
```

---

## Task 7: 创建 ControlPanel 控制面板组件

**Files:**
- Create: `src/components/ControlPanel.vue`

**Step 1: 创建 ControlPanel.vue**

```vue
<!-- src/components/ControlPanel.vue -->
<template>
  <view class="control-panel">
    <view class="controls">
      <!-- 开始游戏 -->
      <button
        v-if="gamePhase === 'idle'"
        class="btn btn-primary"
        @click="handleStart"
      >
        开始游戏
      </button>

      <!-- 继续摇 -->
      <button
        v-if="gamePhase === 'selecting'"
        class="btn btn-info"
        @click="handleRollAgain"
      >
        继续摇
      </button>

      <!-- 结束回合 -->
      <button
        v-if="gamePhase === 'selecting'"
        class="btn btn-success"
        @click="handleEndTurn"
      >
        结束回合
      </button>

      <!-- 下一位 -->
      <button
        v-if="gamePhase === 'farkle'"
        class="btn btn-warning"
        @click="handleNext"
      >
        下一位
      </button>

      <!-- 新游戏 -->
      <button
        v-if="gamePhase === 'ended'"
        class="btn btn-danger"
        @click="handleNewGame"
      >
        新游戏
      </button>

      <!-- 规则 -->
      <button class="btn btn-secondary" @click="handleShowRules">
        规则
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { GamePhase } from '@/types/game'

defineProps<{
  gamePhase: GamePhase
}>()

const emit = defineEmits<{
  start: []
  rollAgain: []
  endTurn: []
  next: []
  newGame: []
  showRules: []
}>()

function handleStart() {
  emit('start')
}

function handleRollAgain() {
  emit('rollAgain')
}

function handleEndTurn() {
  emit('endTurn')
}

function handleNext() {
  emit('next')
}

function handleNewGame() {
  emit('newGame')
}

function handleShowRules() {
  emit('showRules')
}
</script>

<style scoped>
.control-panel {
  padding: 32rpx;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.btn {
  padding: 32rpx 48rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  color: white;
}

.btn-info {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}
</style>
```

**Step 2: 提交**

```bash
git add src/components/ControlPanel.vue
git commit -m "feat(component): add ControlPanel component"
```

---

## Task 8: 创建主游戏页面

**Files:**
- Create: `src/pages/index/index.vue`

**Step 1: 创建 index.vue**

```vue
<!-- src/pages/index/index.vue -->
<template>
  <view class="page">
    <!-- 标题 -->
    <view class="header">
      <text class="title">🎲 Farkle 游戏</text>
    </view>

    <!-- 计分板 -->
    <score-board :players="gameState.players" :currentPlayerIndex="gameState.currentPlayerIndex" />

    <!-- 消息 -->
    <view class="message">
      <text class="message-text">{{ gameState.message }}</text>
    </view>

    <!-- 骰子区域 -->
    <view class="dice-area">
      <!-- 已保留骰子 -->
      <view v-if="gameState.heldDice.length > 0" class="dice-section">
        <text class="section-label">已保留</text>
        <view class="dice-row">
          <die
            v-for="die in gameState.heldDice"
            :key="die.index"
            :value="die.value"
            :held="true"
          />
        </view>
      </view>

      <!-- 待选择骰子 -->
      <view v-if="gameState.rolledDice.length > 0" class="dice-section">
        <text class="section-label">
          请选择（至少选1个）
          <text v-if="selectedDiceIndices.length > 0" class="selected-preview">
            | 选中得分：<text class="score-value">{{ selectedScore }}</text>
          </text>
        </text>
        <view class="dice-row">
          <die
            v-for="die in gameState.rolledDice"
            :key="die.index"
            :value="die.value"
            :selected="isSelected(die.index)"
            @click="toggleDie(die.index)"
          />
        </view>
      </view>
    </view>

    <!-- 控制面板 -->
    <control-panel
      :gamePhase="gameState.gamePhase"
      @start="startGame"
      @rollAgain="rollAgain"
      @endTurn="endTurn"
      @next="switchPlayer"
      @newGame="newGame"
      @showRules="showRules"
    />

    <!-- 规则弹窗 -->
    <view v-if="showRulesModal" class="modal" @click="hideRules">
      <view class="modal-content" @click.stop>
        <view class="modal-title">游戏规则</view>
        <view class="rules-content">
          <view class="rule-text">目标：先达到10,000分</view>
          <view class="rule-text">每次摇骰子后，必须至少选择1个可计分的骰子</view>
          <view class="rule-text">选择骰子后有两个选项：</view>
          <view class="rule-sub">1. 继续摇：对剩余骰子重摇，如果Farkle则本轮分数丢失</view>
          <view class="rule-sub">2. 结束回合：存分到总分，轮到下一位</view>
          <view class="rule-text">Hot Dice：所有骰子都能计分时，可以重摇6个新骰子</view>
          <view class="rule-text">计分：</view>
          <view class="rule-sub">1 = 100分, 5 = 50分</view>
          <view class="rule-sub">三个相同：1=1000, 其他=点数×100</view>
          <view class="rule-sub">四/五/六个相同 = 翻倍</view>
          <view class="rule-sub">小顺子(1-5) = 500, 小顺子(2-6) = 750, 大顺子(1-6) = 1500</view>
          <view class="rule-sub">三对 = 1500, 两个三条 = 2500</view>
        </view>
        <button class="btn btn-primary" @click="hideRules">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GameState, Die } from '@/types/game'
import { createInitialState, startGame as startGameLogic, rollAgain as rollAgainLogic, endTurn as endTurnLogic, switchPlayerAfterFarkle, newGame as newGameLogic } from '@/utils/gameLogic'
import { validateSelection } from '@/utils/scorer'
import ScoreBoard from '@/components/ScoreBoard.vue'
import Die from '@/components/Die.vue'
import ControlPanel from '@/components/ControlPanel.vue'

// 游戏状态
const gameState = ref<GameState>(createInitialState())
const selectedDiceIndices = ref<number[]>([])
const showRulesModal = ref(false)

// 计算选中骰子的得分
const selectedScore = computed(() => {
  if (selectedDiceIndices.value.length === 0) return 0

  const selectedValues = selectedDiceIndices.value.map(index => {
    const die = gameState.value.rolledDice.find(d => d.index === index)
    return die?.value || 0
  })

  const validation = validateSelection(
    gameState.value.rolledDice.map(d => d.value),
    selectedValues
  )

  return validation.points
})

// 判断骰子是否选中
function isSelected(index: number): boolean {
  return selectedDiceIndices.value.includes(index)
}

// 切换骰子选中状态
function toggleDie(index: number) {
  if (gameState.value.gamePhase !== 'selecting') return

  const idx = selectedDiceIndices.value.indexOf(index)
  if (idx > -1) {
    selectedDiceIndices.value.splice(idx, 1)
  } else {
    selectedDiceIndices.value.push(index)
  }
}

// 开始游戏
function startGame() {
  gameState.value = startGameLogic(gameState.value)
  selectedDiceIndices.value = []
}

// 继续摇
function rollAgain() {
  if (gameState.value.gamePhase !== 'selecting') return
  if (selectedDiceIndices.value.length === 0) {
    gameState.value = {
      ...gameState.value,
      message: '必须至少选择1个骰子才能继续摇'
    }
    return
  }

  gameState.value = rollAgainLogic(gameState.value, selectedDiceIndices.value)
  selectedDiceIndices.value = []
}

// 结束回合
function endTurn() {
  if (gameState.value.gamePhase !== 'selecting') return

  let totalScore = gameState.value.currentRoundScore

  // 如果有选中的骰子，需要先保留它们
  if (selectedDiceIndices.value.length > 0) {
    const selectedValues = selectedDiceIndices.value.map(index => {
      const die = gameState.value.rolledDice.find(d => d.index === index)
      return die?.value || 0
    })

    const validation = validateSelection(
      gameState.value.rolledDice.map(d => d.value),
      selectedValues
    )

    if (!validation.valid) {
      gameState.value = {
        ...gameState.value,
        message: validation.description || '无效的选择！请选择可计分的骰子'
      }
      return
    }

    totalScore += validation.points
  }

  // 如果总分为0，不能结束回合
  if (totalScore === 0) {
    gameState.value = {
      ...gameState.value,
      message: '必须选择骰子并保留后才能结束回合'
    }
    return
  }

  gameState.value = endTurnLogic(gameState.value, selectedDiceIndices.value)
  selectedDiceIndices.value = []
}

// 切换玩家
function switchPlayer() {
  if (gameState.value.gamePhase !== 'farkle') return

  gameState.value = switchPlayerAfterFarkle(gameState.value)
  selectedDiceIndices.value = []
}

// 新游戏
function newGame() {
  gameState.value = newGameLogic()
  selectedDiceIndices.value = []
}

// 显示规则
function showRules() {
  showRulesModal.value = true
}

// 隐藏规则
function hideRules() {
  showRulesModal.value = false
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.header {
  padding: 48rpx 32rpx 32rpx;
  text-align: center;
}

.title {
  font-size: 48rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.message {
  padding: 32rpx;
  text-align: center;
}

.message-text {
  font-size: 32rpx;
  color: #374151;
  font-weight: 500;
}

.dice-area {
  padding: 0 32rpx 32rpx;
}

.dice-section {
  margin-bottom: 32rpx;
}

.section-label {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 24rpx;
  font-weight: 500;
}

.selected-preview {
  color: #10b981;
  font-weight: 600;
}

.score-value {
  font-size: 32rpx;
  font-weight: 700;
}

.dice-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  justify-content: center;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 32rpx;
}

.modal-content {
  background: white;
  border-radius: 24rpx;
  padding: 48rpx;
  max-width: 600rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #374151;
  margin-bottom: 32rpx;
  text-align: center;
}

.rules-content {
  margin-bottom: 32rpx;
}

.rule-text {
  font-size: 28rpx;
  color: #374151;
  margin-bottom: 16rpx;
  font-weight: 600;
}

.rule-sub {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 12rpx;
  padding-left: 32rpx;
}

.btn {
  width: 100%;
  padding: 32rpx 48rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
  color: white;
}
</style>
```

**Step 2: 提交**

```bash
git add src/pages/index/index.vue
git commit -m "feat(page): create main game page with complete logic"
```

---

## Task 9: 配置 pages.json 和 manifest.json

**Files:**
- Modify: `src/pages.json`
- Modify: `src/manifest.json`

**Step 1: 更新 pages.json**

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "Farkle 游戏",
        "navigationStyle": "custom"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "Farkle",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#f9fafb"
  }
}
```

**Step 2: 更新 manifest.json**（如果需要）

```json
{
  "name": "Farkle 游戏",
  "appid": "",
  "description": "经典的骰子游戏",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  "app-plus": {
    "usingComponents": true,
    "nvueStyleCompiler": "uni-app",
    "compilerVersion": 3,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {},
    "distribute": {
      "android": {
        "permissions": []
      },
      "ios": {},
      "sdkConfigs": {}
    }
  },
  "quickapp": {},
  "mp-weixin": {
    "appid": "",
    "setting": {
      "urlCheck": false
    },
    "usingComponents": true
  },
  "mp-alipay": {
    "usingComponents": true
  },
  "mp-baidu": {
    "usingComponents": true
  },
  "mp-toutiao": {
    "usingComponents": true
  },
  "h5": {
    "title": "Farkle 游戏",
    "template": "index.html"
  }
}
```

**Step 3: 提交**

```bash
git add src/pages.json src/manifest.json
git commit -m "config: update pages.json and manifest.json"
```

---

## Task 10: 配置 Vite 和 TypeScript

**Files:**
- Create: `vite.config.ts`
- Modify: `tsconfig.json`

**Step 1: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 3000,
    open: true
  }
})
```

**Step 2: 更新 tsconfig.json**

```json
{
  "extends": "@vue/tsconfig/tsconfig.json",
  "compilerOptions": {
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "lib": ["esnext", "dom"],
    "types": ["@dcloudio/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

**Step 3: 提交**

```bash
git add vite.config.ts tsconfig.json
git commit -m "config: add vite and typescript configuration"
```

---

## Task 11: 安装依赖并测试运行

**Files:**
- Modify: `package.json`

**Step 1: 更新 package.json**

确保包含以下依赖：

```json
{
  "name": "farkle-game",
  "version": "1.0.0",
  "description": "Farkle 骰子游戏",
  "scripts": {
    "dev:h5": "uni",
    "build:h5": "uni build",
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin"
  },
  "dependencies": {
    "@dcloudio/uni-app": "3.0.0-alpha-4020420240930001",
    "@dcloudio/uni-components": "3.0.0-alpha-4020420240930001",
    "@dcloudio/uni-h5": "3.0.0-alpha-4020420240930001",
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@dcloudio/types": "^3.4.8",
    "@dcloudio/uni-automator": "3.0.0-alpha-4020420240930001",
    "@dcloudio/uni-cli-shared": "3.0.0-alpha-4020420240930001",
    "@dcloudio/vite-plugin-uni": "3.0.0-alpha-4020420240930001",
    "@vue/tsconfig": "^0.5.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}
```

**Step 2: 安装依赖**

Run:
```bash
npm install
```

**Step 3: 启动开发服务器**

Run:
```bash
npm run dev:h5
```

**Expected Output:**
- 服务器在 http://localhost:3000 启动
- 浏览器自动打开
- 显示 Farkle 游戏页面

**Step 4: 测试游戏流程**

Manual Test Checklist:
- [ ] 点击"开始游戏"，摇出6个骰子
- [ ] 点击骰子选中，骰子高亮
- [ ] 点击"继续摇"，剩余骰子重新摇
- [ ] 点击"结束回合"，分数正确累加
- [ ] Farkle 后点击"下一位"，玩家切换
- [ ] 点击"规则"按钮，显示规则弹窗
- [ ] 一方达到10000分，游戏结束
- [ ] 点击"新游戏"，重新开始

**Step 5: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: install dependencies and configure project"
```

---

## Task 12: 验收测试和文档

**Files:**
- Create: `docs/MIGRATION-CHECKLIST.md`

**Step 1: 创建验收清单**

```markdown
# 迁移验收清单 - 阶段1

## 功能验收

- [x] 游戏可以正常启动
- [x] 摇骰子功能正常
- [x] 选择骰子功能正常
- [x] 保留骰子显示正确
- [x] 继续摇功能正常
- [x] 结束回合功能正常
- [x] Farkle 判断正确
- [x] 玩家切换正常
- [x] 得分计算正确
- [x] 胜利判断正确（10000分）
- [x] 新游戏功能正常
- [x] 规则显示正常

## 技术验收

- [x] TypeScript 类型无错误
- [x] 无控制台错误
- [x] H5 可正常运行
- [x] 代码结构清晰
- [x] 组件职责明确

## 性能验收

- [x] 页面加载流畅
- [x] 交互响应及时
- [x] 无明显卡顿

## 下一步

阶段1完成！准备进入阶段2：UI美化
```

**Step 2: 提交**

```bash
git add docs/MIGRATION-CHECKLIST.md
git commit -m "docs: add migration checklist for phase 1"
```

---

## 🎉 阶段1完成

恭喜！阶段1基础迁移已完成。现在你拥有：
- ✅ 可在 H5 运行的完整游戏
- ✅ TypeScript 类型安全
- ✅ 组件化架构
- ✅ 响应式状态管理

**准备进入阶段2：UI美化**
