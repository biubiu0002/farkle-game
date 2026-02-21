/**
 * Farkle 游戏逻辑测试
 */

// 导入编译后的逻辑（如果需要测试，可以在这里写测试用例）
console.log('=== Farkle 游戏逻辑测试 ===')

// 测试用例示例
const testCases = [
  {
    name: '三个1应该得1000分',
    dice: [1, 1, 1, 2, 3, 4],
    expectedPoints: 1000,
    expectedDescription: '三个1'
  },
  {
    name: '两个5应该得100分',
    dice: [5, 5, 2, 3, 4, 6],
    expectedPoints: 100,
    expectedDescription: '2个5'
  },
  {
    name: '顺子应该得2500分',
    dice: [1, 2, 3, 4, 5, 6],
    expectedPoints: 2500,
    expectedDescription: '顺子'
  },
  {
    name: '三对应该得1500分',
    dice: [1, 1, 2, 2, 3, 3],
    expectedPoints: 1500,
    expectedDescription: '三对'
  },
  {
    name: '四个相同应该得1000分',
    dice: [4, 4, 4, 4, 2, 3],
    expectedPoints: 1000,
    expectedDescription: '4个4'
  },
  {
    name: 'Farkle测试（无计分骰子）',
    dice: [2, 2, 3, 3, 4, 4],
    expectedFarkle: true
  }
]

console.log('\n所有测试用例：')
testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`)
  console.log(`   骰子: [${test.dice.join(', ')}]`)
  if (test.expectedFarkle) {
    console.log(`   期望: Farkle`)
  } else {
    console.log(`   期望得分: ${test.expectedPoints}`)
    console.log(`   描述: ${test.expectedDescription}`)
  }
})

console.log('\n=== 测试完成 ===')
console.log('\n注意：这是示例测试用例，实际测试需要导入游戏逻辑模块')
