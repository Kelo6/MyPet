// components/ActionSheet/ActionSheet.ts
interface ActionItem {
  text: string;
  subText?: string;
  icon?: string;
  value?: string | number;
  disabled?: boolean;
}

Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    items: { type: Array, value: [] },
    cancelText: { type: String, value: '取消' },
    maskClosable: { type: Boolean, value: true }
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
    onSelect(e: any) {
      const index = Number(e.currentTarget.dataset.index);
      const items = this.properties.items as ActionItem[];
      const item = items[index];
      if (!item || item.disabled) return;
      this.triggerEvent('select', { index, item });
    }
  }
});






