/**
 * BGMManager - 背景音乐管理器
 * 使用 HTML5 Audio API 管理背景音乐的播放、循环和音量控制
 * 支持多首 BGM 顺序循环播放
 */
class BGMManager {
  constructor(audioPaths) {
    // 支持单首或多首 BGM
    this.audioPaths = Array.isArray(audioPaths) ? audioPaths : [audioPaths]
    this.currentIndex = 0  // 当前播放的 BGM 索引
    this.audioElement = null
    this.enabled = true
    this.volume = 0.3  // 默认 30% 音量
    this.isPlaying = false
    this.initialized = false

    // Store event listener references for cleanup
    this.canPlayThroughHandler = null
    this.errorHandler = null
    this.endedHandler = null
  }

  /**
   * 初始化音频元素
   */
  async init() {
    if (this.initialized) return true

    try {
      // 创建第一个音频元素
      this.audioElement = new Audio(this.audioPaths[this.currentIndex])
      this.audioElement.volume = this.volume

      // Store listener references for cleanup
      this.canPlayThroughHandler = () => {
        console.log(`BGM ${this.currentIndex + 1}/${this.audioPaths.length} 加载完成: ${this.getFileName(this.currentIndex)}`)
        this.initialized = true
      }

      this.errorHandler = (e) => {
        console.error('BGM 加载失败:', e)
        this.enabled = false
        this.initialized = false
      }

      this.endedHandler = () => {
        // 当一首播放完时，播放下一首
        console.log(`BGM ${this.currentIndex + 1} 播放完成，切换到下一首`)
        this.playNext()
      }

      // 监听加载事件
      this.audioElement.addEventListener('canplaythrough', this.canPlayThroughHandler)

      // 监听错误事件
      this.audioElement.addEventListener('error', this.errorHandler)

      // 监听播放结束事件，用于循环播放下一首
      this.audioElement.addEventListener('ended', this.endedHandler)

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
   * 获取文件名（用于日志）
   */
  getFileName(index) {
    const path = this.audioPaths[index]
    return path.split('/').pop()
  }

  /**
   * 播放下一首 BGM
   */
  async playNext() {
    // 切换到下一首
    this.currentIndex = (this.currentIndex + 1) % this.audioPaths.length

    // 移除旧音频元素的事件监听
    if (this.audioElement) {
      this.audioElement.removeEventListener('canplaythrough', this.canPlayThroughHandler)
      this.audioElement.removeEventListener('error', this.errorHandler)
      this.audioElement.removeEventListener('ended', this.endedHandler)
    }

    // 创建新的音频元素
    this.audioElement = new Audio(this.audioPaths[this.currentIndex])
    this.audioElement.volume = this.volume

    // 重新绑定事件监听
    this.audioElement.addEventListener('canplaythrough', this.canPlayThroughHandler)
    this.audioElement.addEventListener('error', this.errorHandler)
    this.audioElement.addEventListener('ended', this.endedHandler)

    // 开始播放
    if (this.enabled) {
      try {
        await this.audioElement.play()
        console.log(`开始播放 BGM ${this.currentIndex + 1}/${this.audioPaths.length}: ${this.getFileName(this.currentIndex)}`)
      } catch (error) {
        console.error('播放下一首 BGM 失败:', error)
      }
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
      console.log(`BGM 开始播放 (${this.currentIndex + 1}/${this.audioPaths.length}): ${this.getFileName(this.currentIndex)}`)
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
  async toggle() {
    if (this.isPlaying) {
      this.pause()
    } else {
      await this.play()
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

      // Remove event listeners to prevent memory leaks
      if (this.canPlayThroughHandler) {
        this.audioElement.removeEventListener('canplaythrough', this.canPlayThroughHandler)
        this.canPlayThroughHandler = null
      }

      if (this.errorHandler) {
        this.audioElement.removeEventListener('error', this.errorHandler)
        this.errorHandler = null
      }

      if (this.endedHandler) {
        this.audioElement.removeEventListener('ended', this.endedHandler)
        this.endedHandler = null
      }

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
