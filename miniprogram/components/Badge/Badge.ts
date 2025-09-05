// components/Badge/Badge.ts
// 徽章组件

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 徽章文本
    text: {
      type: String,
      value: ''
    },
    
    // 数字值（会自动格式化）
    count: {
      type: Number,
      value: 0
    },
    
    // 最大显示数字
    maxCount: {
      type: Number,
      value: 99
    },
    
    // 颜色变体
    variant: {
      type: String,
      value: 'error' // primary, accent, success, warning, error, info, neutral
    },
    
    // 尺寸
    size: {
      type: String,
      value: 'medium' // small, medium, large
    },
    
    // 形状
    shape: {
      type: String,
      value: 'circle' // circle, square, rounded
    },
    
    // 位置
    position: {
      type: String,
      value: 'top-right' // top-left, top-right, bottom-left, bottom-right
    },
    
    // 是否显示为圆点
    dot: {
      type: Boolean,
      value: false
    },
    
    // 是否显示徽章
    show: {
      type: Boolean,
      value: true
    },
    
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    },
    
    // 偏移量
    offset: {
      type: Array,
      value: [0, 0] // [x, y]
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },

  /**
   * 计算属性
   */
  observers: {
    'count, maxCount, text': function(count: number, maxCount: number, text: string) {
      this.updateDisplayText(count, maxCount, text);
    },
    
    'show, count, text': function(show: boolean, count: number, text: string) {
      this.updateShowBadge(show, count, text);
    },
    
    'position, offset': function(position: string, offset: number[]) {
      this.updateCustomStyle(position, offset);
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 初始化显示状态
      this.updateDisplayText(this.properties.count, this.properties.maxCount, this.properties.text);
      this.updateShowBadge(this.properties.show, this.properties.count, this.properties.text);
      this.updateCustomStyle(this.properties.position, this.properties.offset);
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新显示文本
     */
    updateDisplayText(count: number, maxCount: number, text: string) {
      let displayText = text;
      
      if (!text && count > 0) {
        if (count <= maxCount) {
          displayText = count.toString();
        } else {
          displayText = `${maxCount}+`;
        }
      }
      
      this.setData({
        displayText
      });
    },

    /**
     * 更新显示状态
     */
    updateShowBadge(show: boolean, count: number, text: string) {
      const shouldShow = show && (count > 0 || text);
      
      this.setData({
        showBadge: shouldShow
      });
    },

    /**
     * 更新自定义样式
     */
    updateCustomStyle(position: string, offset: number[]) {
      let customStyle = this.properties.customStyle;
      
      if (offset && offset.length >= 2) {
        const [x, y] = offset;
        if (x !== 0 || y !== 0) {
          const transformMap: Record<string, string> = {
            'top-left': `translate(calc(-50% + ${x}rpx), calc(-50% + ${y}rpx))`,
            'top-right': `translate(calc(50% + ${x}rpx), calc(-50% + ${y}rpx))`,
            'bottom-left': `translate(calc(-50% + ${x}rpx), calc(50% + ${y}rpx))`,
            'bottom-right': `translate(calc(50% + ${x}rpx), calc(50% + ${y}rpx))`
          };
          
          const transform = transformMap[position] || transformMap['top-right'];
          customStyle += `; transform: ${transform}`;
        }
      }
      
      this.setData({
        customStyle
      });
    }
  }
});




