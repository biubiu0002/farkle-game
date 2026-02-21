# Farkle 骰子游戏

基于UniApp的跨平台骰子游戏，支持微信小程序和H5。

## 技术栈
- UniApp (Vue 3 + TypeScript)
- 支持：微信小程序、H5

## 游戏规则
详见：https://cardgames.io/farkle/

## 开发

```bash
npm install
# H5
npm run dev:h5
# 微信小程序
npm run dev:mp-weixin
```

## 项目结构
```
pages/          # 页面
components/     # 组件
utils/          # 工具类
  gameLogic.ts  # 游戏核心逻辑
  scorer.ts     # 计分逻辑
static/         # 静态资源
```
