<template>
  <view class="container">
    <text class="title">测试页面</text>
    <text>如果你能看到这个，说明 uni-app 工作正常！</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello uni-app!')
</script>

<style scoped>
.container {
  padding: 20rpx;
  text-align: center;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
}
</style>
