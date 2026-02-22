// 测试663442是否被正确识别为Farkle
const dice = [6, 6, 3, 4, 4, 2];

// 模拟countDice函数
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
console.log('骰子:', dice);
console.log('各点数统计:', counts);
console.log('是否有顺子(123456):', counts[1]>=1 && counts[2]>=1 && counts[3]>=1 && counts[4]>=1 && counts[5]>=1 && counts[6]>=1);
console.log('是否有4个相同:', Object.values(counts).some(c => c >= 4));
console.log('是否有3个相同:', Object.values(counts).some(c => c >= 3));
console.log('是否有1或5:', counts[1] > 0 || counts[5] > 0);
console.log('');
console.log('结论: ' + (Object.values(counts).some(c => c >= 3) || counts[1] > 0 || counts[5] > 0 ? '有得分组合' : 'Farkle（无法计分）'));
