// components/ListItem/ListItem.ts
// 列表项组件

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
    
    // 描述
    description: {
      type: String,
      value: ''
    },
    
    // 左侧图标
    icon: {
      type: String,
      value: ''
    },
    
    // 头像
    avatar: {
      type: String,
      value: ''
    },
    
    // 右侧文本
    rightText: {
      type: String,
      value: ''
    },
    
    // 徽章文本
    badge: {
      type: String,
      value: ''
    },
    
    // 是否显示箭头
    showArrow: {
      type: Boolean,
      value: false
    },
    
    // 箭头图标
    arrowIcon: {
      type: String,
      value: '>'
    },
    
    // 是否显示开关
    showSwitch: {
      type: Boolean,
      value: false
    },
    
    // 开关值
    switchValue: {
      type: Boolean,
      value: false
    },
    
    // 变体样式
    variant: {
      type: String,
      value: 'default' // default, card, flat
    },
    
    // 尺寸
    size: {
      type: String,
      value: 'medium' // small, medium, large
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
     * 列表项点击事件
     */
    onItemTap(e: any) {
      if (this.properties.disabled) {
        return;
      }
      
      this.triggerEvent('tap', {
        title: this.properties.title,
        description: this.properties.description,
        data: this.properties.data,
        selected: !this.properties.selected
      }, {
        bubbles: true,
        composed: true
      });
    },

    /**
     * 开关变化事件
     */
    onSwitchChange(e: any) {
      if (this.properties.disabled) {
        return;
      }
      
      const { value } = e.detail;
      
      this.triggerEvent('switchchange', {
        value,
        title: this.properties.title,
        data: this.properties.data
      }, {
        bubbles: true,
        composed: true
      });
    }
  }
});




