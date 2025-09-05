// components/DatePicker/DatePicker.ts
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '选择日期',
    },
    value: {
      type: String,
      value: '',
    },
    minDate: {
      type: String,
      value: '',
    },
    maxDate: {
      type: String,
      value: '',
    },
    mode: {
      type: String,
      value: 'date', // date, datetime, time
    },
  },

  data: {
    selectedDate: '',
    selectedTime: '',
  },

  observers: {
    'value'(val) {
      if (val) {
        if (this.data.mode === 'datetime') {
          const [date, time] = val.split(' ');
          this.setData({
            selectedDate: date,
            selectedTime: time || '09:00',
          });
        } else if (this.data.mode === 'time') {
          this.setData({
            selectedTime: val,
          });
        } else {
          this.setData({
            selectedDate: val,
          });
        }
      }
    },
  },

  methods: {
    /**
     * 日期选择变化
     */
    onDateChange(e: any) {
      this.setData({
        selectedDate: e.detail.value,
      });
    },

    /**
     * 时间选择变化
     */
    onTimeChange(e: any) {
      this.setData({
        selectedTime: e.detail.value,
      });
    },

    /**
     * 确认选择
     */
    onConfirm() {
      let result = '';
      
      if (this.data.mode === 'datetime') {
        result = `${this.data.selectedDate} ${this.data.selectedTime}`;
      } else if (this.data.mode === 'time') {
        result = this.data.selectedTime;
      } else {
        result = this.data.selectedDate;
      }

      this.triggerEvent('confirm', { value: result });
      this.onCancel();
    },

    /**
     * 取消选择
     */
    onCancel() {
      this.triggerEvent('cancel');
    },

    /**
     * 阻止冒泡
     */
    onMaskTap() {
      this.onCancel();
    },

    /**
     * 阻止内容区域点击冒泡
     */
    onContentTap() {
      // 阻止事件冒泡
    },
  },
});




