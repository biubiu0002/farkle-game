# Farkle 游戏重构设计方案

## 📅 日期
2025-02-21

## 🎯 目标
将 simple-game 迁移到 src/ 目录，支持多端平台（H5优先，后续扩展小程序），并实现现代化UI设计。

## 🏗️ 技术方案

### 框架选型
- **uni-app** + Vue3 + TypeScript + Vite
- 优先支持 H5，后续无缝扩展到微信小程序
- 简洁现代风格（CSS3 渐变 + 动画）

### 项目结构

```
farkle-game/
├── src/
│   ├── pages/
│   │   └── index/
│   │       └── index.vue          # 主游戏页面
│   ├── components/
│   │   ├── DiceBoard.vue          # 骰子棋盘组件
│   │   ├── Die.vue                # 单个骰子组件
│   │   ├── ScoreBoard.vue         # 计分板组件
│   │   ├── ControlPanel.vue       # 控制面板组件
│   │   └── RulesModal.vue         # 规则弹窗组件
│   ├── utils/
│   │   ├── scorer.ts              # 计分逻辑（移植+TypeScript）
│   │   └── gameLogic.ts           # 游戏逻辑（移植+TypeScript）
│   ├── types/
│   │   └── game.ts                # TypeScript 类型定义
│   ├── static/
│   │   └── sounds/                # 音效文件（后续）
│   ├── App.vue                    # 应用入口
│   └── main.ts                    # 主文件
├── simple-game/                   # 保留原目录
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 🎨 UI 设计

### 风格定位
- **简洁现代风**
- 扁平化设计
- 渐变色彩
- 流畅动画
- 响应式布局

### 配色方案
- 主色调：蓝绿渐变 (#10b981 → #3b82f6)
- 背景：浅灰渐变 (#f9fafb → #f3f4f6)
- 卡片：白色 + 阴影
- 骰子：白底 + 圆角 + 阴影

### 页面布局
```
┌─────────────────────────────────────┐
│         🎲 Farkle 游戏             │
├─────────────────────────────────────┤
│  玩家计分板（卡片式布局）            │
│                                     │
│  消息提示区                          │
│                                     │
│  已保留骰子区                        │
│                                     │
│  待选择骰子区                        │
│                                     │
│  控制按钮区                          │
└─────────────────────────────────────┘
```

## 🔧 核心组件

### Die.vue（骰子组件）
- 尺寸：120rpx × 120rpx
- 背景：线性渐变 + 圆角 16rpx
- 阴影：0 4rpx 12rpx rgba(0,0,0,0.15)
- 选中态：发光阴影 + 缩放 1.1
- 滚动动画：rotate + scale 组合

### ScoreBoard.vue（计分板）
- 双玩家卡片式布局
- 当前玩家高亮显示
- 显示上轮得分和总分

### ControlPanel.vue（控制面板）
- 主要操作按钮（开始游戏、继续摇、结束回合）
- 次要按钮（规则、新游戏）
- 按钮状态自动切换

## 📊 数据架构

### TypeScript 类型定义

```typescript
export interface Die {
  index: number
  value: number
  held: boolean
}

export interface Player {
  id: number
  totalScore: number
  lastRoundScore: number
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  rolledDice: Die[]
  heldDice: Die[]
  currentRoundScore: number
  gamePhase: 'idle' | 'rolling' | 'selecting' | 'farkle' | 'ended'
  message: string
  winner: number | null
}
```

### 状态管理
- Vue3 Composition API
- 响应式 gameState
- 纯函数式状态更新
- UI 自动响应状态变化

## 🎬 动画设计

### 摇骰子动画
```css
@keyframes roll {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
```

### 选中动画
- 缩放：1.0 → 1.1（0.3s ease）
- 阴影：无 → 发光效果

### 得分提示动画
- 数字放大淡入
- 上浮淡出

## 📅 分阶段实施

### 阶段1：基础迁移（1-2天）
**目标**：可运行的 H5 游戏
- [x] 复制逻辑层到 src/utils/
- [x] 添加 TypeScript 类型定义
- [x] 创建基础 Vue3 页面
- [x] 实现完整游戏流程
- [x] 基础 UI（无美化）

**交付物**：
- H5 可运行版本
- 完整游戏功能

### 阶段2：UI 美化（2-3天）
**目标**：现代化视觉设计
- [x] 现代化布局（卡片、阴影、渐变）
- [x] 骰子样式优化（圆角、阴影、点数美化）
- [x] 计分板美化
- [x] 响应式设计（适配手机/平板）

**交付物**：
- 美化后的 H5 版本

### 阶段3：动画增强（2-3天）
**目标**：流畅交互体验
- [x] 摇骰子动画（CSS3 keyframes）
- [x] 选中/保留过渡动画
- [x] 得分提示动画
- [ ] 音效（可选）

**交付物**：
- 带动画的完整版本

### 阶段4：扩展优化（后续）
**目标**：多端支持
- [ ] 扩展到微信小程序
- [ ] 性能优化
- [ ] 更多特效
- [ ] 音效系统

**交付物**：
- 微信小程序版本
- 优化后的 H5 版本

## 🔄 迁移策略

### 可复用模块
以下模块可直接从 simple-game 复制：
- `utils/scorer.js` → `src/utils/scorer.ts`
- `utils/gameLogic.js` → `src/utils/gameLogic.ts`

需要做的改造：
- 添加 TypeScript 类型注解
- 将 DOM 操作改为返回状态
- 保持纯函数特性

### 需要重写
- UI 层（HTML → Vue 组件）
- 样式（CSS → Vue scoped styles）
- 事件处理（addEventListener → @click）

## ✅ 验收标准

### 阶段1
- [ ] H5 可正常运行
- [ ] 所有游戏功能正常
- [ ] 无控制台错误

### 阶段2
- [ ] 视觉风格统一
- [ ] 响应式布局正确
- [ ] 交互流畅

### 阶段3
- [ ] 动画流畅自然
- [ ] 无卡顿现象
- [ ] 用户体验良好

## 📝 备注

- 保留 simple-game 目录作为参考
- 优先 H5 平台验证
- 每阶段完成后可运行测试
- 后续可扩展到其他平台
