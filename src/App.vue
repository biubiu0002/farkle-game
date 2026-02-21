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
