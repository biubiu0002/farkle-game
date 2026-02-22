/**
 * SoundManager - Web Audio API 音效管理器
 * 提供骰子游戏所需的各种音效
 */

class SoundManager {
  constructor() {
    this.audioContext = null
    this.sounds = {}
    this.enabled = true
    this.volume = 0.2  // 进一步降低音量到0.2
    this.isInitialized = false

    // 预定义的音效配置 - 全部使用简单beep，更柔和
    this.soundConfigs = {
      roll: { type: 'noise', duration: 1.2, frequency: 800, attack: 0.01, decay: 1.19 },
      dice: { type: 'beep', frequency: 330, duration: 0.08, delay: 0 },       // E4，骰子落地 - 低沉柔和
      select: { type: 'beep', frequency: 659, duration: 0.04, delay: 0 },
      deselect: { type: 'beep', frequency: 440, duration: 0.04, delay: 0 },
      score: { type: 'beep', frequency: 698, duration: 0.05, delay: 0 },      // F5，柔和
      farkle: { type: 'beep', frequency: 196, duration: 0.2, delay: 0 },      // G3，低沉
      bank: { type: 'beep', frequency: 784, duration: 0.05, delay: 0 },       // G5，清脆短促
      win: { type: 'beep', frequency: 880, duration: 0.1, delay: 0 }          // A5，胜利
    }
  }

  /**
   * 初始化音频上下文
   */
  async init() {
    if (this.isInitialized) return true

    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // 预加载音效
      await this.preloadSounds()

      this.isInitialized = true
      console.log('SoundManager 初始化成功')
      return true
    } catch (error) {
      console.error('SoundManager 初始化失败:', error)
      this.enabled = false
      return false
    }
  }

  /**
   * 预加载音效
   */
  async preloadSounds() {
    if (!this.enabled || !this.audioContext) return

    const soundNames = Object.keys(this.soundConfigs)

    for (const name of soundNames) {
      if (!this.sounds[name]) {
        this.sounds[name] = await this.createSound(name, this.soundConfigs[name])
      }
    }
  }

  /**
   * 创建单个音效
   */
  async createSound(name, config) {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve(null)
        return
      }

      // 创建振荡器和音效类型
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      // 连接节点
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // 设置音量
      gainNode.gain.value = this.volume

      // 根据音效类型设置不同的音效参数
      switch (config.type) {
        case 'noise':
          this.createNoiseSound(oscillator, gainNode, config)
          break
        case 'beep':
          this.createBeepSound(oscillator, gainNode, config)
          break
        case 'chime':
          this.createChimeSound(oscillator, gainNode, config)
          break
        case 'buzz':
          this.createBuzzSound(oscillator, gainNode, config)
          break
        case 'success':
          this.createSuccessSound(oscillator, gainNode, config)
          break
        case 'victory':
          this.createVictorySound(oscillator, gainNode, config)
          break
        default:
          this.createBeepSound(oscillator, gainNode, config)
      }

      // 存储音效数据
      const soundData = {
        oscillator,
        gainNode,
        config
      }

      resolve(soundData)
    })
  }

  /**
   * 创建噪音音效（摇骰子）- 使用白噪声模拟骰子碰撞
   */
  createNoiseSound(oscillator, gainNode, config) {
    // 创建白噪声缓冲区
    const bufferSize = this.audioContext.sampleRate * config.duration
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    // 生成白噪声
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    // 创建噪声源
    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = buffer

    // 创建滤波器（模拟骰子在桶里的声音）
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = config.frequency
    filter.Q.value = 0.5  // 降低Q值，让声音更柔和（从1改为0.5）

    // 创建新的gain节点
    const noiseGainNode = this.audioContext.createGain()

    // 连接节点
    noiseSource.connect(filter)
    filter.connect(noiseGainNode)
    noiseGainNode.connect(this.audioContext.destination)

    // 创建音量包络 - 快速起音快速衰减（沙沙声）
    noiseGainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    noiseGainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.02)
    noiseGainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration)

    // 播放噪声
    noiseSource.start(this.audioContext.currentTime)
    noiseSource.stop(this.audioContext.currentTime + config.duration)
  }

  /**
   * 创建蜂鸣音效 - 更柔和自然的版本
   */
  createBeepSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    const startTime = this.audioContext.currentTime + config.delay

    // 设置初始频率并轻微滑落（让声音更自然）
    oscillator.frequency.setValueAtTime(config.frequency, startTime)
    oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.85, startTime + config.duration)

    // 骰子落地音效特殊处理 - 更低的峰值
    const peakVolume = (config.frequency <= 350) ? this.volume * 0.15 : this.volume * 0.25

    // 音量包络 - 非常柔和的起音和衰减
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(peakVolume, startTime + 0.008)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)

    // 播放
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(startTime + config.duration)
  }

  /**
   * 创建铃声音效 - 柔和版
   */
  createChimeSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    const startTime = this.audioContext.currentTime + config.delay

    // 频率轻微上升后滑落
    oscillator.frequency.setValueAtTime(config.frequency, startTime)
    oscillator.frequency.linearRampToValueAtTime(config.frequency * 1.2, startTime + config.duration * 0.3)
    oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.9, startTime + config.duration)

    // 音量包络 - 柔和的铃声
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, startTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(startTime + config.duration)
  }

  /**
   * 创建嗡嗡音效（Farkle失败）- 更柔和版
   */
  createBuzzSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'  // 使用sine，最柔和

    const startTime = this.audioContext.currentTime + config.delay

    // 频率下降
    oscillator.frequency.setValueAtTime(config.frequency, startTime)
    oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.6, startTime + config.duration)

    // 音量包络 - 非常柔和的低音
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.15, startTime + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(startTime + config.duration)
  }

  /**
   * 创建成功音效 - 双音柔和版
   */
  createSuccessSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    const startTime = this.audioContext.currentTime + config.delay

    // 两个音符的音高
    oscillator.frequency.setValueAtTime(config.frequency, startTime)
    oscillator.frequency.setValueAtTime(config.frequency * 1.25, startTime + config.duration * 0.4)

    // 音量包络
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.25, startTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(startTime + config.duration)
  }

  /**
   * 创建胜利音效 - 柔和版
   */
  createVictorySound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    const startTime = this.audioContext.currentTime + config.delay
    const noteDuration = config.duration / 4

    // 音阶上升
    const notes = [config.frequency, config.frequency * 1.2, config.frequency * 1.4, config.frequency * 1.6]
    let currentTime = startTime

    notes.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(freq * 0.95, currentTime + noteDuration - 0.01)
      currentTime += noteDuration
    })

    // 音量包络
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(startTime + config.duration)
  }

  /**
   * 播放音效
   */
  async play(soundName) {
    if (!this.enabled || !this.isInitialized) return

    try {
      const config = this.soundConfigs[soundName]
      if (!config) return

      // 根据音效类型播放
      if (config.type === 'noise') {
        // 噪声音效直接创建播放（不缓存）
        this.createNoiseSound(null, null, config)
      } else {
        // 所有其他音效都使用简单的beep
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)

        this.createBeepSound(oscillator, gainNode, config)
      }
    } catch (error) {
      console.error(`播放音效 ${soundName} 失败:`, error)
    }
  }

  /**
   * 播放摇骰子音效
   */
  playRollSound() {
    this.play('roll')
  }

  /**
   * 播放骰子音效
   */
  playDiceSound() {
    this.play('dice')
  }

  /**
   * 播放选中音效
   */
  playSelectSound() {
    this.play('select')
  }

  /**
   * 播放取消选中音效
   */
  playDeselectSound() {
    this.play('deselect')
  }

  /**
   * 播放得分音效
   */
  playScoreSound() {
    this.play('score')
  }

  /**
   * 播放Farkle音效
   */
  playFarkleSound() {
    this.play('farkle')
  }

  /**
   * 播放存分音效
   */
  playBankSound() {
    this.play('bank')
  }

  /**
   * 播放胜利音效
   */
  playWinSound() {
    this.play('win')
  }

  /**
   * 设置音量
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    console.log(`音量设置为: ${Math.round(this.volume * 100)}%`)
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled) {
    this.enabled = enabled
    console.log(`音效${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 获取当前音量
   */
  getVolume() {
    return this.volume
  }

  /**
   * 销毁音频上下文
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.isInitialized = false
    this.sounds = {}
    console.log('SoundManager 已销毁')
  }
}

// 创建全局实例
window.SoundManager = new SoundManager()

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager
}

// 确保在用户交互后初始化音频上下文
document.addEventListener('click', async () => {
  if (window.SoundManager && !window.SoundManager.isInitialized) {
    await window.SoundManager.init()
  }
}, { once: true })

document.addEventListener('touchstart', async () => {
  if (window.SoundManager && !window.SoundManager.isInitialized) {
    await window.SoundManager.init()
  }
}, { once: true })