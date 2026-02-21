<template>
  <view class="container">
    <!-- 游戏信息栏 -->
    <view class="info-bar">
      <view class="player-info" :class="{ active: currentGame.currentPlayer === 0 }">
        <text class="player-name">{{ currentGame.players[0].name }}</text>
        <text class="player-score">{{ currentGame.players[0].bankedScore }}</text>
      </view>
      <view class="phase-info">
        <text class="phase-text">{{ currentGame.message }}</text>
      </view>
      <view class="player-info" :class="{ active: currentGame.currentPlayer === 1 }">
        <text class="player-name">{{ currentGame.players[1].name }}</text>
        <text class="player-score">{{ currentGame.players[1].bankedScore }}</text>
      </view>
    </view>

    <!-- 回合得分 -->
    <view class="round-score" v-if="currentGame.currentRoundScore > 0 || selectedScore">
      <text class="round-score-label">本轮得分：</text>
      <text class="round-score-value">{{ currentGame.currentRoundScore }}</text>
      <text v-if="selectedScore && selectedScore.valid" class="round-score-add">+{{ selectedScore.points }}</text>
    </view>

    <!-- 选择得分提示 -->
    <view class="selection-info" v-if="selectedScore">
      <text v-if="selectedScore.valid" class="selection-valid">
        选择有效：{{ selectedScore.description }} = {{ selectedScore.points }}分
      </text>
      <text v-else class="selection-invalid">
        无效选择：{{ selectedScore.description }}
      </text>
    </view>

    <!-- 骰子区域 -->
    <view class="dice-area">
      <view class="dice-container">
        <!-- 已保留的骰子 -->
        <view class="dice-section held" v-if="currentGame.heldDice.length > 0">
          <text class="section-label">已保留</text>
          <view class="dice-row">
            <Die
              v-for="(value, index) in currentGame.heldDice"
              :key="`held-${index}`"
              :value="value"
              :selected="true"
            />
          </view>
        </view>

        <!-- 剩余骰子 -->
        <view class="dice-section" v-if="currentGame.remainingDice.length > 0">
          <text class="section-label">请选择</text>
          <view class="dice-row">
            <Die
              v-for="(value, index) in currentGame.remainingDice"
              :key="`remain-${index}`"
              :value="value"
              :selected="isSelected(index)"
              @click="toggleDie(index)"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 游戏控制按钮 -->
    <view class="controls">
      <button
        class="btn btn-primary"
        v-if="currentGame.gamePhase === 'waiting'"
        @click="dispatch({ type: 'START_GAME' })"
      >
        开始游戏
      </button>

      <button
        class="btn btn-primary"
        v-if="currentGame.gamePhase === 'rolling'"
        @click="rollDice"
      >
        掷骰子
      </button>

      <button
        class="btn btn-secondary"
        v-if="selectedDice.length > 0 && currentGame.gamePhase === 'selecting'"
        @click="holdSelectedDice"
      >
        保留选择
      </button>

      <button
        class="btn btn-success"
        v-if="currentGame.currentRoundScore > 0 && currentGame.gamePhase === 'selecting'"
        @click="dispatch({ type: 'BANK' })"
      >
        存分 ({{ currentGame.currentRoundScore }})
      </button>

      <button
        class="btn btn-warning"
        v-if="currentGame.gamePhase === 'farkle'"
        @click="dispatch({ type: 'RESET_TURN' })"
      >
        下一位
      </button>

      <button
        class="btn btn-danger"
        v-if="currentGame.gamePhase === 'gameOver'"
        @click="dispatch({ type: 'NEW_GAME' })"
      >
        新游戏
      </button>

      <button
        class="btn btn-secondary"
        @click="showRules = true"
      >
        规则
      </button>
    </view>

    <!-- 规则弹窗 -->
    <view class="modal" v-if="showRules" @click="showRules = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">游戏规则</text>
        <view class="rules-content">
          <text class="rule-text">目标：先达到10,000分</text>
          <text class="rule-text">掷骰子，选择可计分的骰子组合</text>
          <text class="rule-text">继续掷骰子或存分</text>
          <text class="rule-text">Farkle（无计分骰子）则失去回合</text>
          <text class="rule-text">计分：</text>
          <text class="rule-sub">1 = 100分, 5 = 50分</text>
          <text class="rule-sub">三个相同：1=1000, 其他=点数×100</text>
          <text class="rule-sub">四/五/六个相同 = 1000/2000/3000</text>
          <text class="rule-sub">三对 = 1500, 顺子 = 2500</text>
        </view>
        <button class="btn btn-primary" @click="showRules = false">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { createInitialState, gameReducer, GameAction, type GameState, type DieValue } from '../../utils/gameLogic'
import { validateSelection } from '../../utils/scorer'

const currentGame = ref<GameState>(createInitialState())
const selectedIndices = ref<number[]>([])
const showRules = ref(false)

// 计算被选中的骰子值
const selectedDice = computed(() => {
  return selectedIndices.value.map(i => currentGame.value.remainingDice[i])
})

// 计算当前选择的得分
const selectedScore = computed(() => {
  if (selectedDice.value.length === 0) {
    return null
  }
  const validation = validateSelection(currentGame.value.remainingDice, selectedDice.value)
  return validation.valid ? validation : null
})

function dispatch(action: GameAction) {
  currentGame.value = gameReducer(currentGame.value, action)
  // 清空选择
  if (action.type === 'HOLD_DICE' || action.type === 'RESET_TURN' || action.type === 'BANK' || action.type === 'ROLL_DICE') {
    selectedIndices.value = []
  }
}

function rollDice() {
  dispatch({ type: 'ROLL_DICE' })
}

function toggleDie(index: number) {
  const idx = selectedIndices.value.indexOf(index)
  if (idx > -1) {
    selectedIndices.value.splice(idx, 1)
  } else {
    selectedIndices.value.push(index)
  }
}

function holdSelectedDice() {
  if (selectedIndices.value.length > 0) {
    const diceToHold = selectedIndices.value.map(i => currentGame.value.remainingDice[i])
    dispatch({ type: 'HOLD_DICE', payload: diceToHold })
  }
}

// 检查指定索引的骰子是否被选中
function isSelected(index: number): boolean {
  return selectedIndices.value.includes(index)
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

.info-bar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.player-info.active {
  background: #667eea;
  color: white;
  transform: scale(1.05);
}

.player-name {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.player-score {
  font-size: 36rpx;
  font-weight: bold;
  color: #f59e0b;
}

.player-info.active .player-score {
  color: #fbbf24;
}

.phase-info {
  flex: 1;
  text-align: center;
  padding: 0 20rpx;
}

.phase-text {
  font-size: 26rpx;
  color: #4b5563;
}

.round-score {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  margin-bottom: 20rpx;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10rpx;
}

.round-score-label {
  font-size: 28rpx;
  color: #4b5563;
}

.round-score-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #10b981;
}

.round-score-add {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
}

.selection-info {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12rpx;
  padding: 15rpx 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
}

.selection-valid {
  font-size: 24rpx;
  color: #10b981;
  font-weight: bold;
}

.selection-invalid {
  font-size: 24rpx;
  color: #ef4444;
  font-weight: bold;
}

.dice-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
}

.dice-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.dice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-label {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 15rpx;
}

.dice-section.held .section-label {
  color: #10b981;
}

.dice-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20rpx;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  justify-content: center;
}

.btn {
  padding: 25rpx 50rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
  min-width: 200rpx;
  transition: all 0.2s;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  display: block;
  text-align: center;
}

.rules-content {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-bottom: 30rpx;
}

.rule-text {
  font-size: 26rpx;
  color: #374151;
  line-height: 1.6;
}

.rule-sub {
  font-size: 24rpx;
  color: #6b7280;
  margin-left: 40rpx;
}
</style>
