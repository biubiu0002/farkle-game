// 加载scorer模块
const fs = require('fs');
const scorerCode = fs.readFileSync('utils/scorer.js', 'utf8');

// 创建一个模拟环境
const mockWindow = {
  Scorer: {}
};

// 执行scorer代码
eval(scorerCode);

// 测试663442
const testDice = [6, 6, 3, 4, 4, 2];
console.log('测试骰子:', testDice);
console.log('');

const scores = mockWindow.Scorer.getPossibleScores(testDice);
console.log('getPossibleScores 返回', scores.length, '个结果:');
scores.forEach((s, i) => {
  console.log(`  ${i+1}. ${s.description} - ${s.points}分 - 使用: ${s.diceUsed.join(',')}`);
});
console.log('');

const isFarkle = mockWindow.Scorer.isFarkle(testDice);
console.log('isFarkle:', isFarkle);
console.log('');

if (isFarkle) {
  console.log('✅ 正确：663442被识别为Farkle');
} else {
  console.log('❌ 错误：663442应该被识别为Farkle但没被识别');
}
