/**
 * 骰子计分逻辑
 */

export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

export interface DiceCounts {
  [key: number]: number
}

export interface ScoringResult {
  points: number
  diceUsed: DieValue[]
  description: string
}

/**
 * 统计骰子数量
 */
export function countDice(dice: DieValue[]): DiceCounts {
  const counts: DiceCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  dice.forEach(d => counts[d]++)
  return counts
}

/**
 * 检查是否为顺子 1-2-3-4-5-6
 */
export function isStraight(counts: DiceCounts): boolean {
  return Object.values(counts).every(c => c === 1)
}

/**
 * 检查是否为三对
 */
export function isThreePairs(counts: DiceCounts): boolean {
  const pairs = Object.values(counts).filter(c => c === 2)
  return pairs.length === 3
}

/**
 * 计算三个相同骰子的分数
 */
export function getTripleScore(value: DieValue): number {
  if (value === 1) return 1000
  return value * 100
}

/**
 * 计算四/五/六个相同的分数
 */
export function getNOfAKindScore(value: DieValue, count: number): number {
  if (count === 4) return 1000
  if (count === 5) return 2000
  if (count === 6) return 3000
  return 0
}

/**
 * 计算单个骰子的分数（1或5）
 */
export function getSingleScore(value: DieValue): number {
  if (value === 1) return 100
  if (value === 5) return 50
  return 0
}

/**
 * 获取所有可能的计分组合
 */
export function getPossibleScores(dice: DieValue[]): ScoringResult[] {
  if (dice.length === 0) return []

  const counts = countDice(dice)
  const results: ScoringResult[] = []

  // 1. 检查顺子 (1-2-3-4-5-6) = 2500分
  if (isStraight(counts)) {
    results.push({
      points: 2500,
      diceUsed: dice,
      description: '顺子'
    })
    return results
  }

  // 2. 检查三对 = 1500分
  if (isThreePairs(counts)) {
    results.push({
      points: 1500,
      diceUsed: dice,
      description: '三对'
    })
    return results
  }

  // 3. 检查四/五/六个相同
  Object.entries(counts).forEach(([value, count]) => {
    const dieValue = parseInt(value) as DieValue
    if (count >= 4) {
      const score = getNOfAKindScore(dieValue, count)
      const usedDice: DieValue[] = Array(count).fill(dieValue)
      results.push({
        points: score,
        diceUsed: usedDice,
        description: `${count}个${dieValue}`
      })
    }
  })

  // 4. 检查三个相同
  Object.entries(counts).forEach(([value, count]) => {
    const dieValue = parseInt(value) as DieValue
    if (count >= 3) {
      const score = getTripleScore(dieValue)
      const usedDice: DieValue[] = Array(3).fill(dieValue)
      results.push({
        points: score,
        diceUsed: usedDice,
        description: `三个${dieValue}`
      })
    }
  })

  // 5. 单个1和单个5
  Object.entries(counts).forEach(([value, count]) => {
    const dieValue = parseInt(value) as DieValue
    if (dieValue === 1 || dieValue === 5) {
      const singleScore = getSingleScore(dieValue)
      const usedDice: DieValue[] = Array(count).fill(dieValue)
      results.push({
        points: singleScore * count,
        diceUsed: usedDice,
        description: count > 1 ? `${count}个${dieValue}` : `${dieValue}`
      })
    }
  })

  // 去重（避免重复的骰子组合）
  const uniqueResults = results.filter((r1, i) => {
    const r1Str = r1.diceUsed.sort().join(',')
    return results.findIndex(r2 => {
      const r2Str = r2.diceUsed.sort().join(',')
      return r1Str === r2Str && r1.points === r2.points
    }) === i
  })

  return uniqueResults.sort((a, b) => b.points - a.points)
}

/**
 * 检查是否有可计分的骰子（是否Farkle）
 */
export function isFarkle(dice: DieValue[]): boolean {
  return getPossibleScores(dice).length === 0
}

/**
 * 验证选择的骰子是否为有效计分组合
 */
export function validateSelection(dice: DieValue[], selected: DieValue[]): { valid: boolean, points: number, description: string } {
  if (!selected || selected.length === 0) {
    return { valid: false, points: 0, description: '无效选择' }
  }

  const selectedCounts = countDice(selected)

  // 检查是否顺子
  if (selected.length === 6 && isStraight(selectedCounts)) {
    return { valid: true, points: 2500, description: '顺子' }
  }

  // 检查是否三对
  if (selected.length === 6 && isThreePairs(selectedCounts)) {
    return { valid: true, points: 1500, description: '三对' }
  }

  // 检查四/五/六个相同（使用 for...of 替代 forEach 以支持 early return）
  for (const [value, count] of Object.entries(selectedCounts)) {
    const dieValue = parseInt(value) as DieValue
    if (count >= 4) {
      const score = getNOfAKindScore(dieValue, count)
      return { valid: true, points: score, description: `${count}个${dieValue}` }
    }
  }

  // 检查三个相同
  for (const [value, count] of Object.entries(selectedCounts)) {
    const dieValue = parseInt(value) as DieValue
    if (count >= 3) {
      const score = getTripleScore(dieValue)
      return { valid: true, points: score, description: `三个${dieValue}` }
    }
  }

  // 检查单个1和5
  let totalScore = 0
  const singles: DieValue[] = []
  for (const [value, count] of Object.entries(selectedCounts)) {
    const dieValue = parseInt(value) as DieValue
    if (dieValue === 1 || dieValue === 5) {
      totalScore += getSingleScore(dieValue) * count
      singles.push(dieValue)
    }
  }

  if (totalScore > 0) {
    return { valid: true, points: totalScore, description: singles.join(',') }
  }

  return { valid: false, points: 0, description: '无效选择' }
}
