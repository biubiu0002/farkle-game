// src/types/game.ts

/**
 * 骰子值类型（1-6）
 */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6

/**
 * 骰子接口
 */
export interface Die {
  index: number          // 骰子索引（0-5）
  value: DieValue        // 骰子点数（1-6）
  held: boolean          // 是否已保留
}

/**
 * 玩家接口
 */
export interface Player {
  id: number                    // 玩家ID
  name: string                  // 玩家名称
  bankedScore: number           // 已存入银行的总分
  lastRoundScore: number        // 上一轮得分
}

/**
 * 游戏阶段
 */
export type GamePhase =
  | 'waiting'     // 等待开始
  | 'rolling'     // 摇骰子动画中
  | 'selecting'   // 选择骰子
  | 'farkle'      // Farkle（本轮无效）
  | 'gameOver'    // 游戏结束

/**
 * 游戏状态接口
 */
export interface GameState {
  players: Player[]                    // 玩家列表
  currentPlayer: number                // 当前玩家ID（索引）
  rolledDice: Die[]                    // 已摇出的骰子
  heldDice: Die[]                      // 已保留的骰子
  unheldDice: Die[]                    // 未保留的骰子
  currentRoundScore: number            // 本轮当前得分
  gamePhase: GamePhase                 // 游戏阶段
  message: string                      // 提示消息
  winner: number | null                // 获胜玩家ID
}

/**
 * 计分验证结果
 */
export interface ValidationResult {
  valid: boolean              // 是否有效
  points: number              // 得分
  description: string         // 描述
  diceUsed: number            // 使用的骰子数量
}

/**
 * 可能的得分组合
 */
export interface ScoreCombination {
  points: number              // 得分
  diceUsed: number[]          // 使用的骰子值数组
  description: string         // 描述
}
