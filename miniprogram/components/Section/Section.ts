// components/Section/Section.ts
// 通用区块组件

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 标题
    title: {
      type: String,
      value: ''
    },
    
    // 副标题
    subtitle: {
      type: String,
      value: ''
    },
    
    // 图标
    icon: {
      type: String,
      value: ''
    },
    
    // 变体样式
    variant: {
      type: String,
      value: 'default' // default, card, flat, emphasis, transparent
    },
    
    // 尺寸
    size: {
      type: String,
      value: 'medium' // small, medium, large
    },
    
    // 是否显示更多按钮
    showMore: {
      type: Boolean,
      value: false
    },
    
    // 更多按钮文本
    moreText: {
      type: String,
      value: '更多'
    },
    
    // 更多按钮图标
    moreIcon: {
      type: String,
      value: '→'
    },
    
    // 内容区域样式类
    contentClass: {
      type: String,
      value: ''
    },
    
    // 是否隐藏
    hidden: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更多按钮点击事件
     */
    onMoreTap() {
      this.triggerEvent('more', {
        title: this.properties.title
      });
    }
  }
});




