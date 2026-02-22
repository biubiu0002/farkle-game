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

    // 设置 - 使用嵌套结构
    this.settings = {
      bgm: {
        enabled: true,
        volume: 0.3
      },
      sfx: {
        enabled: true,
        volume: 0.2
      },
      panelCollapsed: true
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

    // 事件处理器引用（用于正确移除监听器）
    this.handlers = {
      toggleClick: null,
      documentClick: null,
      bgmToggleChange: null,
      bgmSliderInput: null,
      sfxToggleChange: null,
      sfxSliderInput: null
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
    // 创建面板容器
    this.panel = document.createElement('div')
    this.panel.className = 'volume-panel collapsed'

    // 创建切换按钮
    this.toggleButton = document.createElement('button')
    this.toggleButton.className = 'panel-toggle'
    this.toggleButton.innerHTML = '🔊'
    this.toggleButton.type = 'button'

    // 创建面板内容
    const content = document.createElement('div')
    content.className = 'panel-content'

    // 创建 BGM 控制组
    const bgmGroup = this.createControlGroup('bgm', '背景音乐')
    content.appendChild(bgmGroup)

    // 创建音效控制组
    const sfxGroup = this.createControlGroup('sfx', '游戏音效')
    content.appendChild(sfxGroup)

    this.panel.appendChild(this.toggleButton)
    this.panel.appendChild(content)

    // 添加到页面
    document.body.appendChild(this.panel)

    // 绑定事件
    this.attachEventListeners()
  }

  /**
   * 创建控制组
   */
  createControlGroup(type, label) {
    const group = document.createElement('div')
    group.className = 'control-group'

    // 创建控制头部
    const header = document.createElement('div')
    header.className = 'control-header'

    // 创建标签
    const labelContainer = document.createElement('div')
    labelContainer.className = 'control-label'

    const icon = document.createElement('span')
    icon.className = 'control-icon'
    icon.textContent = type === 'bgm' ? '🎵' : '🔔'

    const labelText = document.createElement('span')
    labelText.textContent = label

    labelContainer.appendChild(icon)
    labelContainer.appendChild(labelText)

    // 创建音量值显示
    const valueDisplay = document.createElement('span')
    valueDisplay.className = 'volume-value'
    valueDisplay.textContent = `${Math.round(this.settings[type].volume * 100)}%`
    valueDisplay.id = `${type}VolumeValue`

    header.appendChild(labelContainer)
    header.appendChild(valueDisplay)
    group.appendChild(header)

    // 创建滑块容器
    const sliderContainer = document.createElement('div')
    sliderContainer.className = 'volume-slider-container'

    // 创建音量滑块
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = '0'
    slider.max = '100'
    slider.value = this.settings[type].volume * 100
    slider.className = 'volume-slider'
    slider.id = `${type}VolumeSlider`

    // 创建启用/禁用开关
    const toggleContainer = document.createElement('div')
    toggleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-top: 8px;'

    const toggleLabel = document.createElement('label')
    toggleLabel.style.cssText = 'color: rgba(255, 255, 255, 0.9); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;'

    const toggleInput = document.createElement('input')
    toggleInput.type = 'checkbox'
    toggleInput.checked = this.settings[type].enabled
    toggleInput.id = `${type}Enabled`
    toggleInput.style.cssText = 'cursor: pointer;'

    const toggleSpan = document.createElement('span')
    toggleSpan.textContent = '启用'

    toggleLabel.appendChild(toggleInput)
    toggleLabel.appendChild(toggleSpan)
    toggleContainer.appendChild(toggleLabel)

    sliderContainer.appendChild(slider)
    group.appendChild(sliderContainer)
    group.appendChild(toggleContainer)

    // 保存元素引用
    this.elements[`${type}Toggle`] = toggleInput
    this.elements[`${type}Slider`] = slider
    this.elements[`${type}Value`] = valueDisplay

    return group
  }

  /**
   * 绑定事件监听器
   */
  attachEventListeners() {
    // 切换按钮点击事件
    this.handlers.toggleClick = () => {
      this.togglePanel()
    }
    this.toggleButton.addEventListener('click', this.handlers.toggleClick)

    // 点击外部关闭面板
    this.handlers.documentClick = (e) => {
      if (this.isExpanded &&
          !this.panel.contains(e.target) &&
          !this.toggleButton.contains(e.target)) {
        this.togglePanel()
      }
    }
    document.addEventListener('click', this.handlers.documentClick)

    // BGM 控制事件
    const bgmEnabled = document.getElementById('bgmEnabled')
    const bgmSlider = document.getElementById('bgmVolumeSlider')

    if (bgmEnabled) {
      this.handlers.bgmToggleChange = (e) => {
        this.updateBGMState(e.target.checked)
        this.saveSettings()
      }
      bgmEnabled.addEventListener('change', this.handlers.bgmToggleChange)
    }

    if (bgmSlider) {
      this.handlers.bgmSliderInput = (e) => {
        const volume = e.target.value / 100
        const valueDisplay = document.getElementById('bgmVolumeValue')
        if (valueDisplay) {
          valueDisplay.textContent = `${e.target.value}%`
        }

        if (this.bgmManager) {
          this.bgmManager.setVolume(volume)
        }

        this.settings.bgm.volume = volume
        this.saveSettings()
      }
      bgmSlider.addEventListener('input', this.handlers.bgmSliderInput)
    }

    // 音效控制事件
    const sfxEnabled = document.getElementById('sfxEnabled')
    const sfxSlider = document.getElementById('sfxVolumeSlider')

    if (sfxEnabled) {
      this.handlers.sfxToggleChange = (e) => {
        this.updateSFXState(e.target.checked)
        this.saveSettings()
      }
      sfxEnabled.addEventListener('change', this.handlers.sfxToggleChange)
    }

    if (sfxSlider) {
      this.handlers.sfxSliderInput = (e) => {
        const volume = e.target.value / 100
        const valueDisplay = document.getElementById('sfxVolumeValue')
        if (valueDisplay) {
          valueDisplay.textContent = `${e.target.value}%`
        }

        if (this.sfxManager) {
          this.sfxManager.setVolume(volume)
        }

        this.settings.sfx.volume = volume
        this.saveSettings()
      }
      sfxSlider.addEventListener('input', this.handlers.sfxSliderInput)
    }
  }

  /**
   * 更新 BGM 状态
   */
  updateBGMState(enabled) {
    this.settings.bgm.enabled = enabled

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
    this.settings.sfx.enabled = enabled

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
    this.settings.panelCollapsed = !this.isExpanded

    if (this.isExpanded) {
      this.panel.classList.remove('collapsed')
      this.panel.classList.add('expanded')
    } else {
      this.panel.classList.add('collapsed')
      this.panel.classList.remove('expanded')
    }

    this.toggleButton.textContent = this.getIcon()
    this.saveSettings()
  }

  /**
   * 获取图标
   */
  getIcon() {
    // 如果任何一个启用，显示音量图标，否则静音
    const anyEnabled = this.settings.bgm.enabled || this.settings.sfx.enabled
    return anyEnabled ? '🔊' : '🔇'
  }

  /**
   * 应用设置到管理器
   */
  applySettings() {
    // 应用 BGM 设置
    if (this.bgmManager) {
      this.bgmManager.setEnabled(this.settings.bgm.enabled)
      this.bgmManager.setVolume(this.settings.bgm.volume)

      if (this.settings.bgm.enabled) {
        this.bgmManager.play()
      }
    }

    // 应用音效设置
    if (this.sfxManager) {
      this.sfxManager.setEnabled(this.settings.sfx.enabled)
      this.sfxManager.setVolume(this.settings.sfx.volume)
    }

    // 更新 UI
    if (this.elements.bgmToggle) {
      this.elements.bgmToggle.checked = this.settings.bgm.enabled
      this.elements.bgmSlider.value = this.settings.bgm.volume * 100
      this.elements.bgmValue.textContent = `${Math.round(this.settings.bgm.volume * 100)}%`
    }

    if (this.elements.sfxToggle) {
      this.elements.sfxToggle.checked = this.settings.sfx.enabled
      this.elements.sfxSlider.value = this.settings.sfx.volume * 100
      this.elements.sfxValue.textContent = `${Math.round(this.settings.sfx.volume * 100)}%`
    }

    // 应用面板状态
    this.isExpanded = !this.settings.panelCollapsed
    if (this.panel) {
      if (this.isExpanded) {
        this.panel.classList.remove('collapsed')
        this.panel.classList.add('expanded')
      } else {
        this.panel.classList.add('collapsed')
        this.panel.classList.remove('expanded')
      }
    }

    // 更新图标
    if (this.toggleButton) {
      this.toggleButton.textContent = this.getIcon()
    }
  }

  /**
   * 保存设置到 localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('farkle_audio_settings', JSON.stringify(this.settings))
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
      const saved = localStorage.getItem('farkle_audio_settings')
      if (saved) {
        const parsed = JSON.parse(saved)

        // 合并嵌套结构
        if (parsed.bgm) {
          this.settings.bgm = { ...this.settings.bgm, ...parsed.bgm }
        }
        if (parsed.sfx) {
          this.settings.sfx = { ...this.settings.sfx, ...parsed.sfx }
        }
        if (parsed.panelCollapsed !== undefined) {
          this.settings.panelCollapsed = parsed.panelCollapsed
        }

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
    // 移除切换按钮的事件监听器
    if (this.toggleButton && this.handlers.toggleClick) {
      this.toggleButton.removeEventListener('click', this.handlers.toggleClick)
      this.handlers.toggleClick = null
    }

    // 移除全局 document 点击监听器
    if (this.handlers.documentClick) {
      document.removeEventListener('click', this.handlers.documentClick)
      this.handlers.documentClick = null
    }

    // 移除控制组的事件监听器
    if (this.elements.bgmToggle && this.handlers.bgmToggleChange) {
      this.elements.bgmToggle.removeEventListener('change', this.handlers.bgmToggleChange)
      this.handlers.bgmToggleChange = null
    }

    if (this.elements.bgmSlider && this.handlers.bgmSliderInput) {
      this.elements.bgmSlider.removeEventListener('input', this.handlers.bgmSliderInput)
      this.handlers.bgmSliderInput = null
    }

    if (this.elements.sfxToggle && this.handlers.sfxToggleChange) {
      this.elements.sfxToggle.removeEventListener('change', this.handlers.sfxToggleChange)
      this.handlers.sfxToggleChange = null
    }

    if (this.elements.sfxSlider && this.handlers.sfxSliderInput) {
      this.elements.sfxSlider.removeEventListener('input', this.handlers.sfxSliderInput)
      this.handlers.sfxSliderInput = null
    }

    // 从 DOM 移除面板
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel)
    }

    // 清理 DOM 元素引用
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

    // 清理事件处理器引用
    this.handlers = {
      toggleClick: null,
      documentClick: null,
      bgmToggleChange: null,
      bgmSliderInput: null,
      sfxToggleChange: null,
      sfxSliderInput: null
    }

    // 清理管理器引用
    this.bgmManager = null
    this.sfxManager = null

    console.log('VolumeControlPanel 已销毁')
  }
}

// 创建全局类引用
window.VolumeControlPanel = VolumeControlPanel

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VolumeControlPanel
}
