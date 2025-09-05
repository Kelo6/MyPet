// components/Tag/Tag.ts
// 标签组件

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 标签文本
    text: {
      type: String,
      value: ''
    },
    
    // 图标
    icon: {
      type: String,
      value: ''
    },
    
    // 颜色变体
    variant: {
      type: String,
      value: 'default' // default, primary, accent, success, warning, error, info
    },
    
    // 尺寸
    size: {
      type: String,
      value: 'medium' // small, medium, large
    },
    
    // 形状
    shape: {
      type: String,
      value: 'rounded' // rounded, pill, square
    },
    
    // 类型
    type: {
      type: String,
      value: 'filled' // filled, outlined, light
    },
    
    // 是否可关闭
    closable: {
      type: Boolean,
      value: false
    },
    
    // 关闭图标
    closeIcon: {
      type: String,
      value: '×'
    },
    
    // 徽章数字
    badge: {
      type: String,
      value: ''
    },
    
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    
    // 是否选中
    selected: {
      type: Boolean,
      value: false
    },
    
    // 是否隐藏
    hidden: {
      type: Boolean,
      value: false
    },
    
    // 自定义数据
    data: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件初始化
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 标签点击事件
     */
    onTagTap(e: any) {
      if (this.properties.disabled) {
        return;
      }
      
      this.triggerEvent('tap', {
        text: this.properties.text,
        data: this.properties.data,
        selected: !this.properties.selected
      }, {
        bubbles: true,
        composed: true
      });
    },

    /**
     * 关闭按钮点击事件
     */
    onCloseTap(e: any) {
      if (this.properties.disabled) {
        return;
      }
      
      this.triggerEvent('close', {
        text: this.properties.text,
        data: this.properties.data
      }, {
        bubbles: true,
        composed: true
      });
    }
  }
});
