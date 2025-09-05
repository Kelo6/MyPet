// app.ts
App({
  globalData: {},

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-7gsokv3ge8e0bae6',
        traceUser: true,
      });
    }

    // 检查更新
    if (this.checkForUpdate) {
      this.checkForUpdate();
    }
  },

  onShow() {
    // 小程序从后台进入前台时触发
  },

  onHide() {
    // 小程序从前台进入后台时触发
  },

  onError(msg: any) {
    console.error('小程序发生错误:', msg);
  },

  // 检查小程序更新
  checkForUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate(res => {
      // 请求完新版本信息的回调
      if (res.hasUpdate) {
        console.log('发现新版本');
      }
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: res => {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        },
      });
    });

    updateManager.onUpdateFailed(() => {
      // 新版本下载失败
      console.error('新版本下载失败');
    });
  },
});
