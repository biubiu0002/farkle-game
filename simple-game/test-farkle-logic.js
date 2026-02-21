// Farkle 游戏逻辑单元测试

// 模拟游戏状态
let gameState = {
  players: [
    { id: 0, name: '玩家1', bankedScore: 0 },
    { id: 1, name: '玩家2', bankedScore: 0 }
  ],
  currentPlayer: 0,
  gamePhase: 'selecting',
  rolledDice: [],
  heldDice: [],
  unheldDice: [],
  currentRoundScore: 0
}

// 测试场景1：Farkle 后应该切换玩家
console.log('=== 测试场景1：Farkle后切换玩家 ===')

// 初始状态：玩家1有6个骰子
gameState.unheldDice = [
  { value: 1, index: 0 },
  { value: 2, index: 1 },
  { value: 3, index: 2 },
  { value: 4, index: 3 },
  { value: 5, index: 4 },
  { value: 6, index: 5 }
]
gameState.currentRoundScore = 100

console.log('初始状态:')
console.log('  当前玩家:', gameState.currentPlayer) // 应该是0
console.log('  本轮得分:', gameState.currentRoundScore) // 100
console.log('  操作堆骰子:', gameState.unheldDice.length) // 6

// 模拟选中2个骰子（1和5，共150分）
const selectedDiceIndices = [0, 4]
console.log('\n选中2个骰子（1和5）')

// 模拟继续摇
const unselectedDice = gameState.unheldDice.filter(d => !selectedDiceIndices.includes(d.index))
console.log('未选中骰子数量:', unselectedDice.length) // 应该是4

// 模拟重摇4个骰子，结果是 [2, 3, 4, 6] - 无得分牌型（Farkle）
const newDice = [2, 3, 4, 6]
console.log('重摇结果:', newDice)

// 检查是否Farkle
function isFarkle(dice) {
  // 2, 3, 4, 6 都不能单独计分
  const hasOneOrFive = dice.some(d => d === 1 || d === 5)
  if (hasOneOrFive) return false
  
  // 检查是否有其他组合
  const counts = {}
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1)
  
  // 检查是否有三个相同
  const hasTriple = Object.values(counts).some(c => c >= 3)
  if (hasTriple) return false
  
  return true
}

const farkle = isFarkle(newDice)
console.log('是否Farkle:', farkle) // 应该是true

if (farkle) {
  console.log('\n预期行为：')
  console.log('  1. 本轮得分清空为0')
  console.log('  2. 切换到玩家2 (currentPlayer = 1)')
  console.log('  3. 游戏状态保持 selecting')
  console.log('  4. 为玩家2生成新的6个骰子')
  console.log('  5. UI不应该显示"结束回合"按钮')
}

// 测试场景2：骰子数量计算
console.log('\n=== 测试场景2：骰子数量计算 ===')

gameState.currentPlayer = 0
gameState.unheldDice = [
  { value: 1, index: 0 },
  { value: 2, index: 1 },
  { value: 3, index: 2 },
  { value: 4, index: 3 },
  { value: 5, index: 4 },
  { value: 6, index: 5 }
]
gameState.heldDice = []

console.log('第一轮：6个骰子')
const selected1 = [0, 4] // 选中1和5
const unselected1 = gameState.unheldDice.filter(d => !selected1.includes(d.index))
console.log('  选中2个，剩余应该重摇:', unselected1.length, '个') // 应该是4

// 模拟第一轮后
gameState.heldDice = [
  { value: 1, index: 0 },
  { value: 5, index: 4 }
]
gameState.unheldDice = [
  { value: 2, index: 6 },
  { value: 6, index: 7 },
  { value: 3, index: 8 },
  { value: 4, index: 9 }
]

console.log('\n第二轮：操作堆有4个骰子')
const selected2 = [6, 7, 8] // 选中3个
const unselected2 = gameState.unheldDice.filter(d => !selected2.includes(d.index))
console.log('  选中3个，剩余应该重摇:', unselected2.length, '个') // 应该是1

console.log('\n✅ 测试完成')
console.log('\n关键逻辑：')
console.log('  - 从 unheldDice（操作堆）筛选未选中骰子，而不是从 rolledDice')
console.log('  - Farkle后立即切换玩家，不显示"结束回合"按钮')
