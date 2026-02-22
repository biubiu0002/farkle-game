/**
 * VolumeControlPanel - 音量控制面板
 * 可折叠的 UI 组件，用于控制 BGM 和音效音量
 */
class VolumeControlPanel {
  constructor(bgmManager, sfxManager) {
    this.bgmManager = bgmManager
    this.sfxManager = sfxManager

    // 面板状态
    this.panel = null
    this.toggleButton = null
    this.isExpanded = false

    // 设置
    this.settings = {
      bgmEnabled: true,
      bgmVolume: 0.3,
      sfxEnabled: true,
      sfxVolume: 0.2
    }

    // DOM 元素引用
    this.elements = {
      bgmToggle: null,
      bgmSlider: null,
      bgmValue: null,
      sfxToggle: null,
      sfxSlider: null,
      sfxValue: null
    }
  }

  /**
   * 初始化面板
   */
  init() {
    // 从 localStorage 加载设置
    this.loadSettings()

    // 创建面板元素
    this.createPanel()

    // 应用设置
    this.applySettings()

    console.log('VolumeControlPanel 初始化完成')
  }

  /**
   * 创建面板 DOM 元素
   */
  createPanel() {
    // 创建切换按钮
    this.toggleButton = document.createElement('button')
    this.toggleButton.className = 'volume-toggle-btn'
    this.toggleButton.innerHTML = this.getIcon('volume')
    this.toggleButton.setAttribute('aria-label', 'Toggle volume controls')
    this.toggleButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    `

    // 创建面板容器
    this.panel = document.createElement('div')
    this.panel.className = 'volume-control-panel'
    this.panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 999;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      min-width: 280px;
      transform: translateX(120%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
    `

    // 创建面板标题
    const title = document.createElement('h3')
    title.textContent = '音量控制'
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      text-align: center;
    `
    this.panel.appendChild(title)

    // 创建 BGM 控制组
    this.createControlGroup('bgm', '背景音乐')

    // 创建分隔线
    const separator = document.createElement('div')
    separator.style.cssText = `
      height: 1px;
      background: linear-gradient(90deg, transparent, #ddd, transparent);
      margin: 20px 0;
    `
    this.panel.appendChild(separator)

    // 创建音效控制组
    this.createControlGroup('sfx', '游戏音效')

    // 添加到页面
    document.body.appendChild(this.toggleButton)
    document.body.appendChild(this.panel)

    // 绑定事件
    this.attachEventListeners()
  }

  /**
   * 创建控制组
   */
  createControlGroup(type, label) {
    const group = document.createElement('div')
    group.className = `${type}-control-group`
    group.style.cssText = `
      margin-bottom: 15px;
    `

    // 标签和开关
    const header = document.createElement('div')
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `

    const labelElement = document.createElement('label')
    labelElement.textContent = label
    labelElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
      color: #555;
    `

    // 创建切换开关
    const toggle = document.createElement('label')
    toggle.className = `${type}-toggle`
    toggle.style.cssText = `
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    `

    const toggleInput = document.createElement('input')
    toggleInput.type = 'checkbox'
    toggleInput.checked = this.settings[`${type}Enabled`]
    toggleInput.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `

    const toggleSlider = document.createElement('span')
    toggleSlider.style.cssText = `
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 26px;
    `

    const toggleCircle = document.createElement('span')
    toggleCircle.style.cssText = `
      position: absolute;
      content: '';
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    `

    toggleSlider.appendChild(toggleCircle)
    toggle.appendChild(toggleInput)
    toggle.appendChild(toggleSlider)

    header.appendChild(labelElement)
    header.appendChild(toggle)
    group.appendChild(header)

    // 音量滑块
    const sliderContainer = document.createElement('div')
    sliderContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
    `

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = '0'
    slider.max = '100'
    slider.value = this.settings[`${type}Volume`] * 100
    slider.className = `${type}-volume-slider`
    slider.style.cssText = `
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    `

    // 滑块样式
    const style = document.createElement('style')
    style.textContent = `
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      input[type=range]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        border: none;
      }
    `
    document.head.appendChild(style)

    const valueDisplay = document.createElement('span')
    valueDisplay.className = `${type}-volume-value`
    valueDisplay.textContent = `${Math.round(this.settings[`${type}Volume`] * 100)}%`
    valueDisplay.style.cssText = `
      min-width: 45px;
      text-align: right;
      font-size: 13px;
      color: #666;
      font-weight: 500;
    `

    sliderContainer.appendChild(slider)
    sliderContainer.appendChild(valueDisplay)
    group.appendChild(sliderContainer)

    this.panel.appendChild(group)

    // 保存元素引用
    this.elements[`${type}Toggle`] = toggleInput
    this.elements[`${type}Slider`] = slider
    this.elements[`${type}Value`] = valueDisplay

    // 切换开关事件
    toggleInput.addEventListener('change', (e) => {
      if (type === 'bgm') {
        this.updateBGMState(e.target.checked)
      } else {
        this.updateSFXState(e.target.checked)
      }
      this.saveSettings()
    })

    // 滑块事件
    slider.addEventListener('input', (e) => {
      const volume = e.target.value / 100
      valueDisplay.textContent = `${e.target.value}%`

      if (type === 'bgm') {
        if (this.bgmManager) {
          this.bgmManager.setVolume(volume)
        }
      } else {
        if (this.sfxManager) {
          this.sfxManager.setVolume(volume)
        }
      }

      this.settings[`${type}Volume`] = volume
      this.saveSettings()
    })
  }

  /**
   * 绑定事件监听器
   */
  attachEventListeners() {
    // 切换按钮点击事件
    this.toggleButton.addEventListener('click', () => {
      this.togglePanel()
    })

    // 切换按钮悬停效果
    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton.style.transform = 'scale(1.1)'
      this.toggleButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)'
    })

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton.style.transform = 'scale(1)'
      this.toggleButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)'
    })

    // 点击外部关闭面板
    document.addEventListener('click', (e) => {
      if (this.isExpanded &&
          !this.panel.contains(e.target) &&
          !this.toggleButton.contains(e.target)) {
        this.togglePanel()
      }
    })
  }

  /**
   * 更新 BGM 状态
   */
  updateBGMState(enabled) {
    this.settings.bgmEnabled = enabled

    if (this.bgmManager) {
      this.bgmManager.setEnabled(enabled)
      if (enabled) {
        this.bgmManager.play()
      } else {
        this.bgmManager.pause()
      }
    }

    console.log(`BGM ${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 更新音效状态
   */
  updateSFXState(enabled) {
    this.settings.sfxEnabled = enabled

    if (this.sfxManager) {
      this.sfxManager.setEnabled(enabled)
    }

    console.log(`音效 ${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 切换面板展开/收起
   */
  togglePanel() {
    this.isExpanded = !this.isExpanded

    if (this.isExpanded) {
      this.panel.style.transform = 'translateX(0)'
      this.panel.style.opacity = '1'
    } else {
      this.panel.style.transform = 'translateX(120%)'
      this.panel.style.opacity = '0'
    }
  }

  /**
   * 获取图标 SVG
   */
  getIcon(type) {
    const icons = {
      volume: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>`,
      mute: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>`
    }

    return icons[type] || icons.volume
  }

  /**
   * 应用设置到管理器
   */
  applySettings() {
    // 应用 BGM 设置
    if (this.bgmManager) {
      this.bgmManager.setEnabled(this.settings.bgmEnabled)
      this.bgmManager.setVolume(this.settings.bgmVolume)

      if (this.settings.bgmEnabled) {
        this.bgmManager.play()
      }
    }

    // 应用音效设置
    if (this.sfxManager) {
      this.sfxManager.setEnabled(this.settings.sfxEnabled)
      this.sfxManager.setVolume(this.settings.sfxVolume)
    }

    // 更新 UI
    if (this.elements.bgmToggle) {
      this.elements.bgmToggle.checked = this.settings.bgmEnabled
      this.elements.bgmSlider.value = this.settings.bgmVolume * 100
      this.elements.bgmValue.textContent = `${Math.round(this.settings.bgmVolume * 100)}%`
    }

    if (this.elements.sfxToggle) {
      this.elements.sfxToggle.checked = this.settings.sfxEnabled
      this.elements.sfxSlider.value = this.settings.sfxVolume * 100
      this.elements.sfxValue.textContent = `${Math.round(this.settings.sfxVolume * 100)}%`
    }
  }

  /**
   * 保存设置到 localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('volumeControlSettings', JSON.stringify(this.settings))
      console.log('音量设置已保存')
    } catch (error) {
      console.error('保存音量设置失败:', error)
    }
  }

  /**
   * 从 localStorage 加载设置
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('volumeControlSettings')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.settings = { ...this.settings, ...parsed }
        console.log('音量设置已加载:', this.settings)
      }
    } catch (error) {
      console.error('加载音量设置失败:', error)
      // 使用默认设置
    }
  }

  /**
   * 销毁面板
   */
  destroy() {
    // 移除事件监听器
    if (this.toggleButton) {
      this.toggleButton.removeEventListener('click', this.togglePanel)
      document.body.removeChild(this.toggleButton)
    }

    if (this.panel) {
      document.body.removeChild(this.panel)
    }

    // 清理引用
    this.panel = null
    this.toggleButton = null
    this.elements = {
      bgmToggle: null,
      bgmSlider: null,
      bgmValue: null,
      sfxToggle: null,
      sfxSlider: null,
      sfxValue: null
    }

    console.log('VolumeControlPanel 已销毁')
  }
}

// 创建全局类引用
window.VolumeControlPanel = VolumeControlPanel

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VolumeControlPanel
}
