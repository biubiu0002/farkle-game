// 简单测试脚本
const dice = [6, 6, 3, 4, 4, 2];

console.log('='.repeat(50));
console.log('测试骰子:', dice.join(', '));
console.log('='.repeat(50));

// 模拟scorer的核心逻辑
function countDice(dice) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dice.forEach(d => {
    if (d !== undefined && d !== null) {
      counts[d]++;
    }
  });
  return counts;
}

const counts = countDice(dice);
console.log('点数统计:', counts);
console.log('');

// 检查各项得分条件
const hasStraight = counts[1] >= 1 && counts[2] >= 1 && counts[3] >= 1 && 
                    counts[4] >= 1 && counts[5] >= 1 && counts[6] >= 1;
const hasFourOfAKind = Object.values(counts).some(c => c >= 4);
const hasThreeOfAKind = Object.values(counts).some(c => c >= 3);
const hasOneOrFive = counts[1] > 0 || counts[5] > 0;

console.log('检查结果:');
console.log('  - 顺子:', hasStraight);
console.log('  - 4个相同:', hasFourOfAKind);
console.log('  - 3个相同:', hasThreeOfAKind);
console.log('  - 有1或5:', hasOneOrFive);
console.log('');

const canScore = hasStraight || hasFourOfAKind || hasThreeOfAKind || hasOneOrFive;
console.log('结论:', canScore ? '可以计分' : 'Farkle');
console.log('='.repeat(50));
