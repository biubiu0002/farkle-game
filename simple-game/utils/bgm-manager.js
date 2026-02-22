/**
 * BGMManager - 背景音乐管理器
 * 使用 HTML5 Audio API 管理背景音乐的播放、循环和音量控制
 */
class BGMManager {
  constructor(audioPath) {
    this.audioPath = audioPath
    this.audioElement = null
    this.enabled = true
    this.volume = 0.3  // 默认 30% 音量
    this.isPlaying = false
    this.initialized = false
  }

  /**
   * 初始化音频元素
   */
  async init() {
    if (this.initialized) return true

    try {
      // 创建音频元素
      this.audioElement = new Audio(this.audioPath)
      this.audioElement.loop = true
      this.audioElement.volume = this.volume

      // 监听加载事件
      this.audioElement.addEventListener('canplaythrough', () => {
        console.log('BGM 加载完成')
        this.initialized = true
      })

      // 监听错误事件
      this.audioElement.addEventListener('error', (e) => {
        console.error('BGM 加载失败:', e)
        this.enabled = false
        this.initialized = false
      })

      // 监听播放结束（循环）
      this.audioElement.addEventListener('ended', () => {
        if (this.enabled && this.audioElement) {
          this.audioElement.currentTime = 0
          this.audioElement.play()
        }
      })

      // 预加载音频
      this.audioElement.load()

      return true
    } catch (error) {
      console.error('BGMManager 初始化失败:', error)
      this.enabled = false
      return false
    }
  }

  /**
   * 开始播放
   */
  async play() {
    if (!this.enabled || !this.audioElement) return

    try {
      await this.audioElement.play()
      this.isPlaying = true
      console.log('BGM 开始播放')
    } catch (error) {
      console.error('BGM 播放失败:', error)
      // 可能是浏览器自动播放限制
      this.isPlaying = false
    }
  }

  /**
   * 暂停播放
   */
  pause() {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause()
      this.isPlaying = false
      console.log('BGM 已暂停')
    }
  }

  /**
   * 切换播放/暂停
   */
  toggle() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  /**
   * 设置音量 (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.audioElement) {
      this.audioElement.volume = this.volume
    }
    console.log(`BGM 音量设置为: ${Math.round(this.volume * 100)}%`)
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled) {
    this.enabled = enabled

    if (!enabled) {
      this.pause()
    } else if (this.initialized && !this.isPlaying) {
      this.play()
    }

    console.log(`BGM ${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 销毁资源
   */
  destroy() {
    if (this.audioElement) {
      this.pause()
      this.audioElement.src = ''
      this.audioElement = null
    }
    this.initialized = false
    this.isPlaying = false
    console.log('BGMManager 已销毁')
  }
}

// 创建全局实例
window.BGMManager = BGMManager

// 导出（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BGMManager
}
