// components/Toast/Toast.ts
Component({
  properties: {
    show: { type: Boolean, value: false },
    message: { type: String, value: '' },
    duration: { type: Number, value: 2000 },
    type: { type: String, value: 'info' }, // info, success, warning, error
    position: { type: String, value: 'bottom' }, // top, center, bottom
    icon: { type: String, value: '' },
    mask: { type: Boolean, value: false }
  },

  data: {
    timer: 0 as any
  },

  lifetimes: {
    detached() {
      this.clearTimer();
    }
  },

  observers: {
    'show, duration': function(show: boolean, duration: number) {
      if (show) {
        this.startTimer(duration);
      } else {
        this.clearTimer();
      }
    }
  },

  methods: {
    startTimer(duration: number) {
      this.clearTimer();
      if (duration > 0) {
        const id = setTimeout(() => {
          this.triggerEvent('close');
        }, duration);
        // @ts-ignore: WeChat timer type
        this.setData({ timer: id });
      }
    },
    clearTimer() {
      const id = this.data.timer as unknown as number;
      if (id) {
        clearTimeout(id);
        this.setData({ timer: 0 });
      }
    }
  }
});






