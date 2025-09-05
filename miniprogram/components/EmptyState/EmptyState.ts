// components/EmptyState/EmptyState.ts

Component({
  properties: {
    icon: {
      type: String,
      value: '📝',
    },
    title: {
      type: String,
      value: '暂无数据',
    },
    description: {
      type: String,
      value: '',
    },
    buttonText: {
      type: String,
      value: '',
    },
    showButton: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    /**
     * 按钮点击事件
     */
    onButtonTap() {
      this.triggerEvent('buttontap');
    },
  },
});




