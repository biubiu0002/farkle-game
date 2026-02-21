<template>
  <view
    class="die"
    :class="{ selected, held }"
    @click="handleClick"
  >
    <view class="die-face">
      <view
        v-for="(dot, index) in getDots()"
        :key="index"
        class="dot"
        :style="dotStyle(dot)"
      ></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DieValue } from '../utils/scorer'

interface Props {
  value: DieValue
  selected?: boolean
  held?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  held: false
})

const emit = defineEmits<{
  click: [value: DieValue]
}>()

function handleClick() {
  if (!props.held) {
    emit('click', props.value)
  }
}

interface DotPosition {
  top: string
  left: string
}

function getDots(): DotPosition[] {
  const positions: { [key: number]: DotPosition[] } = {
    1: [{ top: '50%', left: '50%' }],
    2: [
      { top: '20%', left: '20%' },
      { top: '80%', left: '80%' }
    ],
    3: [
      { top: '20%', left: '20%' },
      { top: '50%', left: '50%' },
      { top: '80%', left: '80%' }
    ],
    4: [
      { top: '20%', left: '20%' },
      { top: '20%', left: '80%' },
      { top: '80%', left: '20%' },
      { top: '80%', left: '80%' }
    ],
    5: [
      { top: '20%', left: '20%' },
      { top: '20%', left: '80%' },
      { top: '50%', left: '50%' },
      { top: '80%', left: '20%' },
      { top: '80%', left: '80%' }
    ],
    6: [
      { top: '20%', left: '20%' },
      { top: '20%', left: '80%' },
      { top: '50%', left: '20%' },
      { top: '50%', left: '80%' },
      { top: '80%', left: '20%' },
      { top: '80%', left: '80%' }
    ]
  }
  return positions[props.value] || []
}

function dotStyle(dot: DotPosition) {
  return {
    top: dot.top,
    left: dot.left
  }
}
</script>

<style scoped>
.die {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  background: white;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.die.selected {
  background: #10b981;
  transform: translateY(-10rpx);
  box-shadow: 0 8rpx 20rpx rgba(16, 185, 129, 0.3);
}

.die.held {
  background: #667eea;
  cursor: default;
}

.die-face {
  width: 100%;
  height: 100%;
  position: relative;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  background: #1f2937;
  border-radius: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
}

.die.selected .dot,
.die.held .dot {
  background: white;
}

.die:active {
  transform: scale(0.95);
}

.die.selected:active {
  transform: translateY(-10rpx) scale(0.95);
}
</style>
