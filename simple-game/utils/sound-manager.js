/**
 * SoundManager - Web Audio API 音效管理器
 * 提供骰子游戏所需的各种音效
 */

class SoundManager {
  constructor() {
    this.audioContext = null
    this.sounds = {}
    this.enabled = true
    this.volume = 0.7
    this.isInitialized = false

    // 预定义的音效配置
    this.soundConfigs = {
      roll: { type: 'noise', duration: 0.3, frequency: 200, attack: 0.01, decay: 0.2 },
      dice: { type: 'beep', frequency: 440, duration: 0.1, delay: 0.05 },
      select: { type: 'beep', frequency: 600, duration: 0.08, delay: 0.02 },
      deselect: { type: 'beep', frequency: 300, duration: 0.08, delay: 0.02 },
      score: { type: 'chime', frequency: 800, duration: 0.3, delay: 0.1 },
      farkle: { type: 'buzz', frequency: 150, duration: 0.5, delay: 0.1 },
      bank: { type: 'success', frequency: 1000, duration: 0.2, delay: 0.05 },
      win: { type: 'victory', frequency: 1200, duration: 0.5, delay: 0.2 }
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
   * 创建噪音音效（摇骰子）
   */
  createNoiseSound(oscillator, gainNode, config) {
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime)

    // 创建音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + config.attack)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.attack + config.decay)

    // 设置播放时间
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.duration)
  }

  /**
   * 创建蜂鸣音效
   */
  createBeepSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime)

    // 音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + config.delay)
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + config.delay + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.delay + config.duration)

    // 播放
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.delay + config.duration)
  }

  /**
   * 创建铃声音效
   */
  createChimeSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    // 频率上升
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime + config.delay)
    oscillator.frequency.linearRampToValueAtTime(config.frequency * 1.5, this.audioContext.currentTime + config.delay + config.duration * 0.5)
    oscillator.frequency.linearRampToValueAtTime(config.frequency, this.audioContext.currentTime + config.delay + config.duration)

    // 音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + config.delay)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioContext.currentTime + config.delay + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.delay + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.delay + config.duration)
  }

  /**
   * 创建嗡嗡音效（Farkle失败）
   */
  createBuzzSound(oscillator, gainNode, config) {
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime + config.delay)

    // 频率下降
    oscillator.frequency.exponentialRampToValueAtTime(config.frequency * 0.7, this.audioContext.currentTime + config.delay + config.duration)

    // 音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + config.delay)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + config.delay + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + config.delay + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.delay + config.duration)
  }

  /**
   * 创建成功音效
   */
  createSuccessSound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    // 两个音符
    const frequencies = [config.frequency, config.frequency * 1.2, config.frequency]
    const durations = [config.duration * 0.3, config.duration * 0.3, config.duration * 0.4]
    let currentTime = this.audioContext.currentTime + config.delay

    frequencies.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, currentTime)
      currentTime += durations[i]
    })

    // 音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + config.delay)
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, this.audioContext.currentTime + config.delay + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.delay + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.delay + config.duration)
  }

  /**
   * 创建胜利音效
   */
  createVictorySound(oscillator, gainNode, config) {
    oscillator.type = 'sine'

    // 音阶上升
    const notes = [config.frequency, config.frequency * 1.25, config.frequency * 1.5, config.frequency * 2]
    const noteDuration = config.duration / notes.length
    let currentTime = this.audioContext.currentTime + config.delay

    notes.forEach(freq => {
      oscillator.frequency.setValueAtTime(freq, currentTime)
      currentTime += noteDuration
    })

    // 音量包络
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + config.delay)
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + config.delay + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.delay + config.duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + config.delay + config.duration)
  }

  /**
   * 播放音效
   */
  async play(soundName) {
    if (!this.enabled || !this.isInitialized) return

    try {
      // 检查音效是否存在，不存在则创建
      if (!this.sounds[soundName] && this.soundConfigs[soundName]) {
        this.sounds[soundName] = await this.createSound(soundName, this.soundConfigs[soundName])
      }

      // 播放音效
      if (this.sounds[soundName] && this.audioContext) {
        const sound = this.sounds[soundName]

        // 创建新的振荡器节点（不能重复使用已停止的节点）
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        gainNode.gain.value = this.volume

        // 根据配置播放音效
        const config = sound.config
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