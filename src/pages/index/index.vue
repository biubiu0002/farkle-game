<template>
  <view class="page">
    <view class="header">
      <text class="title">🎲 Farkle 游戏</text>
    </view>

    <!-- 计分板 -->
    <view class="score-board">
      <view v-for="(player, index) in gameState.players" :key="player.id"
            :class="['player-card', { active: index === gameState.currentPlayer }]">
        <text class="player-name">{{ player.name }}</text>
        <text>上轮: {{ player.lastRoundScore }}</text>
        <text>总分: {{ player.bankedScore }}</text>
      </view>
    </view>

    <!-- 消息 -->
    <view class="message">
      <text>{{ gameState.message }}</text>
    </view>

    <!-- 回合得分 -->
    <view class="round-score" v-if="gameState.currentRoundScore > 0">
      <text>本轮得分: {{ gameState.currentRoundScore }}</text>
    </view>

    <!-- 骰子区域 - 简化版 -->
    <view class="dice-area">
      <text v-if="gameState.heldDice.length > 0">已保留:</text>
      <view class="dice-row">
        <view v-for="die in gameState.heldDice" :key="die.index" class="die-simple held">
          <text>{{ die.value }}</text>
        </view>
      </view>

      <text v-if="gameState.rolledDice.length > 0">请选择:</text>
      <view class="dice-row">
        <view v-for="die in gameState.rolledDice" :key="die.index"
              :class="['die-simple', { selected: isSelected(die.index) }]"
              @click="toggleDie(die.index)">
          <text>{{ die.value }}</text>
        </view>
      </view>
    </view>

    <!-- 控制按钮 -->
    <view class="controls">
      <button v-if="gameState.gamePhase === 'waiting'" @click="startGame">开始游戏</button>
      <button v-if="gameState.gamePhase === 'selecting'" @click="rollAgain">继续摇</button>
      <button v-if="gameState.gamePhase === 'selecting'" @click="endTurn">结束回合</button>
      <button v-if="gameState.gamePhase === 'farkle'" @click="switchPlayer">下一位</button>
      <button v-if="gameState.gamePhase === 'gameOver'" @click="newGame">新游戏</button>
      <button @click="showRules = true">规则</button>
    </view>

    <!-- 规则弹窗 -->
    <view v-if="showRules" class="modal" @click="showRules = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">游戏规则</text>
        <text>目标：先达到10,000分</text>
        <text>每次摇骰子后，必须至少选择1个可计分的骰子</text>
        <text>选择骰子后有两个选项：</text>
        <text>1. 继续摇：对剩余骰子重摇，如果Farkle则本轮分数丢失</text>
        <text>2. 结束回合：存分到总分，轮到下一位</text>
        <button @click="showRules = false">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GameState, DieValue } from '@/types/game'
import {
  createInitialState,
  startGame as startGameLogic,
  rollAgain as rollAgainLogic,
  endTurn as endTurnLogic,
  switchPlayerAfterFarkle,
  newGame as newGameLogic
} from '@/utils/gameLogic'
import { validateSelection } from '@/utils/scorer'

const gameState = ref<GameState>(createInitialState())
const selectedDiceIndices = ref<number[]>([])
const showRules = ref(false)

function isSelected(index: number): boolean {
  return selectedDiceIndices.value.includes(index)
}

function toggleDie(index: number) {
  if (gameState.value.gamePhase !== 'selecting') return
  const idx = selectedDiceIndices.value.indexOf(index)
  if (idx > -1) {
    selectedDiceIndices.value.splice(idx, 1)
  } else {
    selectedDiceIndices.value.push(index)
  }
}

function startGame() {
  gameState.value = startGameLogic(gameState.value)
  selectedDiceIndices.value = []
}

function rollAgain() {
  if (gameState.value.gamePhase !== 'selecting') return
  if (selectedDiceIndices.value.length === 0) {
    gameState.value = { ...gameState.value, message: '必须至少选择1个骰子才能继续摇' }
    return
  }
  gameState.value = rollAgainLogic(gameState.value, selectedDiceIndices.value)
  selectedDiceIndices.value = []
}

function endTurn() {
  if (gameState.value.gamePhase !== 'selecting') return
  let totalScore = gameState.value.currentRoundScore
  if (selectedDiceIndices.value.length > 0) {
    const selectedValues = selectedDiceIndices.value.map(index => {
      const die = gameState.value.rolledDice.find(d => d.index === index)
      return die?.value ?? 1
    }) as DieValue[]
    const allDiceValues = gameState.value.rolledDice.map(d => d.value) as DieValue[]
    const validation = validateSelection(allDiceValues, selectedValues)
    if (!validation.valid) {
      gameState.value = { ...gameState.value, message: validation.description || '无效的选择！' }
      return
    }
    totalScore += validation.points
  }
  if (totalScore === 0) {
    gameState.value = { ...gameState.value, message: '必须选择骰子并保留后才能结束回合' }
    return
  }
  gameState.value = endTurnLogic(gameState.value, selectedDiceIndices.value)
  selectedDiceIndices.value = []
}

function switchPlayer() {
  if (gameState.value.gamePhase !== 'farkle') return
  gameState.value = switchPlayerAfterFarkle(gameState.value)
  selectedDiceIndices.value = []
}

function newGame() {
  gameState.value = newGameLogic()
  selectedDiceIndices.value = []
}
</script>

<style scoped>
.page {
  padding: 20rpx;
}

.header {
  text-align: center;
  padding: 40rpx 0;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
}

.score-board {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.player-card {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid #ddd;
  border-radius: 10rpx;
  text-align: center;
}

.player-card.active {
  background: #e0f2fe;
  border-color: #3b82f6;
}

.player-name {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.message {
  text-align: center;
  padding: 20rpx;
  font-size: 32rpx;
  margin-bottom: 20rpx;
  background: #f3f4f6;
  border-radius: 10rpx;
}

.round-score {
  text-align: center;
  padding: 20rpx;
  font-size: 36rpx;
  margin-bottom: 20rpx;
  background: #ecfdf5;
  border-radius: 10rpx;
  font-weight: bold;
  color: #059669;
}

.dice-area {
  margin-bottom: 20rpx;
}

.dice-row {
  display: flex;
  gap: 10rpx;
  margin: 10rpx 0;
  flex-wrap: wrap;
}

.die-simple {
  width: 80rpx;
  height: 80rpx;
  border: 2rpx solid #333;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: bold;
  background: white;
}

.die-simple.selected {
  background: #86efac;
  border-color: #22c55e;
}

.die-simple.held {
  opacity: 0.6;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.controls button {
  padding: 20rpx;
  font-size: 32rpx;
  border-radius: 10rpx;
  background: #3b82f6;
  color: white;
  border: none;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 40rpx;
  border-radius: 20rpx;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.modal-title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  text-align: center;
}
</style>
