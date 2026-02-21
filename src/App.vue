<template>
  <view class="app">
    <view class="status-bar"></view>
    <router-view />
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style>
page {
  height: 100%;
  background-color: #667eea;
}

.app {
  height: 100%;
}

.status-bar {
  height: var(--status-bar-height);
}
</style>
