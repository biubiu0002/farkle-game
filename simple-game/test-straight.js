/**
 * 测试顺子计分逻辑
 */

// 直接加载模块
const Scorer = require('./utils/scorer.js')

function test(name, dice, selected, expectedValid, expectedPoints) {
  const result = Scorer.validateSelection(dice, selected)
  const passed = result.valid === expectedValid &&
                 (!expectedValid || result.points === expectedPoints)

  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} ${name}`)
  console.log(`  摇出: [${dice.join(', ')}]`)
  console.log(`  选中: [${selected.join(', ')}]`)
  console.log(`  期望: ${expectedValid ? '有效, ' + expectedPoints + '分' : '无效'}`)
  console.log(`  实际: ${result.valid ? '有效, ' + result.points + '分 - ' + result.description : '无效 - ' + result.description}`)
  console.log('')

  if (!passed) {
    console.error('❌ 测试失败！')
    process.exit(1)
  }
}

console.log('开始测试顺子计分逻辑...\n')

// 测试用例
test(
  '顺子2-6 + 一个5',
  [5, 4, 2, 3, 6, 5],
  [2, 3, 4, 5, 6, 5],
  true,
  650
)

test(
  '顺子1-5 + 一个1',
  [1, 2, 3, 4, 5, 1],
  [1, 2, 3, 4, 5, 1],
  true,
  600
)

test(
  '纯顺子2-6',
  [2, 3, 4, 5, 6, 1],
  [2, 3, 4, 5, 6],
  true,
  600
)

test(
  '纯顺子1-5',
  [1, 2, 3, 4, 5, 6],
  [1, 2, 3, 4, 5],
  true,
  500
)

test(
  '顺子2-6 + 一个额外的5（共两个5）',
  [2, 3, 4, 5, 5, 6],
  [2, 3, 4, 5, 5, 6],
  true,
  650  // 600（顺子）+ 50（额外的5）
)

test(
  '顺子2-6 + 无法计分的骰子（额外的2）',
  [2, 3, 4, 5, 6, 2],
  [2, 3, 4, 5, 6, 2],
  false,
  0
)

test(
  '顺子1-5 + 无法计分的骰子（额外的2）',
  [1, 2, 3, 4, 5, 2],
  [1, 2, 3, 4, 5, 2],
  false,
  0
)

// 注意：不能测试"小顺子2-6 + 一个1"，因为如果有 1,2,3,4,5,6，就是大顺子了

console.log('✅ 所有测试通过！')
