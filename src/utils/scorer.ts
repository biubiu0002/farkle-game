/**
 * Farkle 计分逻辑模块
 * 纯函数，无状态，无 DOM 操作
 */

import type { ScoreCombination, ValidationResult } from '@/types/game'

/**
 * 骰子点数分布统计
 */
export type DiceCounts = Record<DieValue, number>

/**
 * 骰子值类型（1-6）
 */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Farkle 得分规则：
 * - 单个1 = 100分，单个5 = 50分
 * - 三个相同：1=1000，其他=点数×100（如3个5=500）
 * - 四个相同 = 三个相同 × 2
 * - 五个相同 = 三个相同 × 4
 * - 六个相同 = 三个相同 × 8
 * - 小顺子(1-5) = 500分
 * - 小顺子(2-6) = 600分
 * - 大顺子(1-6) = 1500分
 */

/**
 * 统计骰子点数分布
 * @param dice - 骰子值数组
 * @returns 各点数（1-6）的出现次数
 */
export function countDice(dice: DieValue[]): DiceCounts {
  const counts: DiceCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  dice.forEach(d => {
    // d 已被类型限制为 DieValue (1-6)，无需额外检查
    counts[d]++
  })
  return counts
}

/**
 * 检查是否为大顺子（1-6）
 * @param counts - 骰子点数分布
 * @returns 是否为大顺子
 */
function isStraight(counts: DiceCounts): boolean {
  return Object.values(counts).every(c => c === 1)
}

/**
 * 检查是否为小顺子（1-5）
 * @param counts - 骰子点数分布
 * @returns 是否为小顺子（1-5）
 */
function isSmallStraight1to5(counts: DiceCounts): boolean {
  // 1-2-3-4-5，每个数字恰好出现1次，6可以是0或1
  return counts[1] === 1 && counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1
}

/**
 * 检查是否包含小顺子（1-5）
 * @param counts - 骰子点数分布
 * @returns 是否包含小顺子（1-5）
 */
function containsSmallStraight1to5(counts: DiceCounts): boolean {
  // 检查是否包含小顺子 1-5（可以有多余的骰子）
  return counts[1] >= 1 && counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 && counts[5] >= 1
}

/**
 * 检查是否为小顺子（2-6）
 * @param counts - 骰子点数分布
 * @returns 是否为小顺子（2-6）
 */
function isSmallStraight2to6(counts: DiceCounts): boolean {
  // 2-3-4-5-6，每个数字恰好出现1次，1可以是0或1
  return counts[2] === 1 && counts[3] === 1 && counts[4] === 1 && counts[5] === 1 && counts[6] === 1
}

/**
 * 检查是否包含小顺子（2-6）
 * @param counts - 骰子点数分布
 * @returns 是否包含小顺子（2-6）
 */
function containsSmallStraight2to6(counts: DiceCounts): boolean {
  // 检查是否包含小顺子 2-6（可以有多余的骰子）
  return counts[2] >= 1 && counts[3] >= 1 && counts[4] >= 1 && counts[5] >= 1 && counts[6] >= 1
}

/**
 * 获取三个相同的骰子得分
 * @param value - 骰子点数
 * @returns 得分
 */
function getTripleScore(value: DieValue): number {
  if (value === 1) return 1000
  return value * 100
}

/**
 * 获取四/五/六个相同的骰子得分
 * @param value - 骰子点数
 * @param count - 相同骰子数量
 * @returns 得分
 */
function getNOfAKindScore(value: DieValue, count: number): number {
  // 4/5/6个相同应该是3个相同的翻倍
  const tripleScore = getTripleScore(value)
  if (count === 4) return tripleScore * 2
  if (count === 5) return tripleScore * 4
  if (count === 6) return tripleScore * 8
  return 0
}

/**
 * 获取单个骰子的得分
 * @param value - 骰子点数
 * @returns 得分
 */
function getSingleScore(value: DieValue): number {
  if (value === 1) return 100
  if (value === 5) return 50
  return 0
}

/**
 * 获取所有可能的得分组合
 * @param dice - 骰子值数组
 * @returns 所有可能的得分组合列表
 */
export function getPossibleScores(dice: DieValue[]): ScoreCombination[] {
  if (!dice || dice.length === 0) return []

  const counts = countDice(dice)
  const results: ScoreCombination[] = []

  // 大顺子 (1-2-3-4-5-6) = 1500分
  if (isStraight(counts)) {
    results.push({ points: 1500, diceUsed: [...dice], description: '大顺子1-6' })
    return results
  }

  // 小顺子 2-6 = 600分
  if (isSmallStraight2to6(counts)) {
    results.push({ points: 600, diceUsed: [...dice], description: '小顺子2-6' })
    return results
  }

  // 小顺子 1-5 = 500分
  if (isSmallStraight1to5(counts)) {
    results.push({ points: 500, diceUsed: [...dice], description: '小顺子1-5' })
    return results
  }

  // 四/五/六个相同
  for (const [value, count] of Object.entries(counts)) {
    const dieValue = parseInt(value) as DieValue
    if (count >= 4) {
      const score = getNOfAKindScore(dieValue, count)
      results.push({ points: score, diceUsed: Array(count).fill(dieValue), description: `${count}个${dieValue}` })
    }
  }

  // 三个相同
  for (const [value, count] of Object.entries(counts)) {
    const dieValue = parseInt(value) as DieValue
    if (count === 3) {
      const score = getTripleScore(dieValue)
      results.push({ points: score, diceUsed: Array(3).fill(dieValue), description: `三个${dieValue}` })
    }
  }

  // 单个1和5
  for (const [value, count] of Object.entries(counts)) {
    const dieValue = parseInt(value) as DieValue
    if ((dieValue === 1 || dieValue === 5) && count > 0) {
      const score = getSingleScore(dieValue) * count
      results.push({ points: score, diceUsed: Array(count).fill(dieValue), description: count > 1 ? `${count}个${dieValue}` : `${dieValue}` })
    }
  }

  // 去重并排序
  const uniqueResults: ScoreCombination[] = []
  const seen = new Set<string>()

  for (const result of results) {
    if (result.points === 0) continue
    const key = `${result.diceUsed.sort().join(',')}-${result.points}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueResults.push(result)
    }
  }

  return uniqueResults.sort((a, b) => b.points - a.points)
}

/**
 * 判断是否为 Farkle（无得分骰子）
 * @param dice - 骰子值数组
 * @returns 是否为 Farkle
 */
export function isFarkle(dice: DieValue[]): boolean {
  if (!dice || dice.length === 0) return true
  const scores = getPossibleScores(dice)
  return scores.length === 0
}

/**
 * 验证选择的骰子是否为有效计分组合
 * @param allDice - 所有骰子数组（未使用，保留用于兼容性）
 * @param selectedDice - 选择的骰子数组
 * @returns 验证结果
 */
export function validateSelection(allDice: DieValue[], selectedDice: DieValue[]): ValidationResult {
  if (!allDice || !selectedDice || allDice.length === 0 || selectedDice.length === 0) {
    return { valid: false, points: 0, description: '无效选择', diceUsed: 0 }
  }

  const selectedCounts = countDice(selectedDice)
  const totalDiceCount = selectedDice.length

  // 大顺子 (1-2-3-4-5-6) = 1500分
  if (totalDiceCount === 6 && isStraight(selectedCounts)) {
    return { valid: true, points: 1500, description: '大顺子1-6', diceUsed: 6 }
  }

  // 检查是否包含顺子（可以有额外的计分骰子）
  const hasSmallStraight2to6 = containsSmallStraight2to6(selectedCounts)
  const hasSmallStraight1to5 = containsSmallStraight1to5(selectedCounts)

  if (hasSmallStraight2to6) {
    // 计算顺子得分 + 剩余骰子得分
    let remainingScore = 0

    // 检查是否有额外的骰子（顺子之外的骰子）
    for (const [value, count] of Object.entries(selectedCounts)) {
      const dieValue = parseInt(value) as DieValue
      // 顺子 2-6 中的骰子各用1个，多余的算剩余
      if (dieValue >= 2 && dieValue <= 6 && count > 1) {
        const extra = count - 1
        if (dieValue === 5) {
          // 只有5可以多余计分（其他数字2,3,4,6多余部分无法计分）
          remainingScore += getSingleScore(dieValue) * extra
        } else {
          // 其他数字多余部分无法计分
          return { valid: false, points: 0, description: '顺子外的骰子无法计分', diceUsed: 0 }
        }
      }
      // 检查是否有 1（顺子 2-6 外，可以计分）
      if (dieValue === 1 && count > 0) {
        remainingScore += getSingleScore(1) * count
      }
    }

    const totalScore = 600 + remainingScore
    const description = remainingScore > 0 ? `小顺子2-6 + ${remainingScore}分` : '小顺子2-6'
    return { valid: true, points: totalScore, description: description, diceUsed: totalDiceCount }
  }

  if (hasSmallStraight1to5) {
    // 计算顺子得分 + 剩余骰子得分
    let remainingScore = 0

    // 检查是否有额外的骰子（顺子之外的骰子）
    for (const [value, count] of Object.entries(selectedCounts)) {
      const dieValue = parseInt(value) as DieValue
      // 顺子 1-5 中的骰子各用1个，多余的算剩余
      if (dieValue >= 1 && dieValue <= 5 && count > 1) {
        const extra = count - 1
        if (dieValue === 1 || dieValue === 5) {
          // 只有1和5可以多余计分
          remainingScore += getSingleScore(dieValue) * extra
        } else {
          // 其他数字多余部分无法计分
          return { valid: false, points: 0, description: '顺子外的骰子无法计分', diceUsed: 0 }
        }
      }
      // 检查是否有 6（顺子 1-5 外）
      if (dieValue === 6 && count > 0) {
        // 骰子6不在顺子1-5中，且无法计分，返回无效
        return { valid: false, points: 0, description: '顺子外的骰子无法计分', diceUsed: 0 }
      }
    }

    const totalScore = 500 + remainingScore
    const description = remainingScore > 0 ? `小顺子1-5 + ${remainingScore}分` : '小顺子1-5'
    return { valid: true, points: totalScore, description: description, diceUsed: totalDiceCount }
  }

  // 计算普通牌型的得分
  let totalScore = 0
  let usedDiceCount = 0
  const parts: string[] = []

  for (const [value, count] of Object.entries(selectedCounts)) {
    if (count === 0) continue

    const dieValue = parseInt(value) as DieValue

    // 四/五/六个相同（优先级最高）
    if (count >= 4) {
      const score = getNOfAKindScore(dieValue, count)
      totalScore += score
      usedDiceCount += count
      parts.push(`${count}个${dieValue}`)
      continue
    }

    // 三个相同
    if (count === 3) {
      const score = getTripleScore(dieValue)
      totalScore += score
      usedDiceCount += count
      parts.push(`三个${dieValue}`)
      continue
    }

    // 单个1和5
    if (dieValue === 1 || dieValue === 5) {
      const score = getSingleScore(dieValue) * count
      totalScore += score
      usedDiceCount += count
      parts.push(count > 1 ? `${count}个${dieValue}` : `${dieValue}`)
    }
  }

  // 检查是否所有骰子都参与了计分
  if (totalScore > 0 && usedDiceCount === totalDiceCount) {
    return { valid: true, points: totalScore, description: parts.join(' + '), diceUsed: usedDiceCount }
  }

  // 有骰子无法计分
  if (totalScore > 0) {
    return { valid: false, points: 0, description: '部分骰子无法计分', diceUsed: 0 }
  }

  return { valid: false, points: 0, description: '无效选择', diceUsed: 0 }
}

// 导出辅助函数供测试使用
export {
  isStraight,
  isSmallStraight1to5,
  isSmallStraight2to6,
  containsSmallStraight1to5,
  containsSmallStraight2to6,
  getTripleScore,
  getNOfAKindScore,
  getSingleScore
}
