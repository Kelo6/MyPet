// components/Dialog/Dialog.ts
Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    content: { type: String, value: '' },
    showCancel: { type: Boolean, value: true },
    cancelText: { type: String, value: '取消' },
    confirmText: { type: String, value: '确定' },
    maskClosable: { type: Boolean, value: false }
  },

  methods: {
    onMaskTap() {
      if (this.properties.maskClosable) {
        this.triggerEvent('cancel');
      }
    },
    onCancel() {
      this.triggerEvent('cancel');
    },
    onConfirm() {
      this.triggerEvent('confirm');
    }
  }
});






