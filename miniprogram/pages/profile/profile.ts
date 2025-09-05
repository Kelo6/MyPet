// pages/profile/profile.ts
import { DatabaseService } from '../../services/database';

// 用户统计信息
interface UserStats {
  pets: number;
  schedules: number;
  reminders: number;
  collections: number;
}

// 用户设置
interface UserSettings {
  notificationEnabled: boolean;
  cloudSync: boolean;
  theme: string;
}

// 通知设置
interface NotificationSettings {
  vaccine: boolean;
  deworm: boolean;
  reminderDays: number;
  silentHours: boolean;
}

Page({
  data: {
    // 用户信息
    userInfo: {
      avatarUrl: '',
      nickName: '',
      userId: '',
    },
    isLoggedIn: false,
    
    // 统计信息
    stats: {
      pets: 0,
      schedules: 0,
      reminders: 0,
      collections: 0,
    } as UserStats,
    
    // 设置信息
    settings: {
      notificationEnabled: true,
      cloudSync: false,
      theme: 'auto',
    } as UserSettings,
    
    // 通知设置
    notificationSettings: {
      vaccine: true,
      deworm: true,
      reminderDays: 3,
      silentHours: true,
    } as NotificationSettings,
    
    // 弹窗状态
    showNotificationModal: false,
    showThemeModal: false,
    
    // 选项数据
    reminderDays: [1, 2, 3, 5, 7],
    reminderDaysIndex: 2,
    
    themeOptions: [
      { value: 'light', label: '浅色模式', color: '#ffffff' },
      { value: 'dark', label: '深色模式', color: '#1e293b' },
      { value: 'auto', label: '跟随系统', color: 'linear-gradient(45deg, #ffffff 50%, #1e293b 50%)' },
    ],
    
    // 应用信息
    appVersion: '1.0.0',
  },

  onLoad() {
    this.loadUserData();
    this.loadSettings();
    this.loadStats();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadStats();
  },

  /**
   * 加载用户数据
   */
  async loadUserData() {
    try {
      // 检查登录状态
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo,
          isLoggedIn: true,
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  },

  /**
   * 加载设置信息
   */
  loadSettings() {
    try {
      const settings = wx.getStorageSync('userSettings') || this.data.settings;
      const notificationSettings = wx.getStorageSync('notificationSettings') || this.data.notificationSettings;
      
      const reminderDaysIndex = this.data.reminderDays.indexOf(notificationSettings.reminderDays);
      
      this.setData({
        settings,
        notificationSettings,
        reminderDaysIndex: reminderDaysIndex >= 0 ? reminderDaysIndex : 2,
      });
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const userId = 'current_user'; // 实际应用中从登录状态获取
      
      // 并行加载各种统计数据
      const [petsResult] = await Promise.all([
        DatabaseService.getPetsByUserId(userId),
      ]);
      
      let pets = 0;
      let schedules = 0;
      let reminders = 0;
      
      if (petsResult.success && petsResult.data) {
        pets = petsResult.data.length;
        
        // 计算每个宠物的健康计划数量
        for (const pet of petsResult.data) {
          try {
            const [vaccineResult, dewormResult] = await Promise.all([
              DatabaseService.getVaccineRecordsByPetId(pet._id as string),
              DatabaseService.getDewormRecordsByPetId(pet._id as string),
            ]);
            
            if (vaccineResult.success && vaccineResult.data) {
              schedules += vaccineResult.data.length;
              reminders += vaccineResult.data.filter(v => v.status === 'pending').length;
            }
            
            if (dewormResult.success && dewormResult.data) {
              schedules += dewormResult.data.length;
              reminders += dewormResult.data.filter(d => d.status === 'pending').length;
            }
          } catch (error) {
            console.error(`加载宠物 ${pet.name} 的数据失败:`, error);
          }
        }
      }
      
      // 获取收藏数量
      const collections = (wx.getStorageSync('collected_articles') || []).length;
      
      this.setData({
        stats: {
          pets,
          schedules,
          reminders,
          collections,
        },
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  /**
   * 保存设置
   */
  saveSettings() {
    try {
      wx.setStorageSync('userSettings', this.data.settings);
      wx.setStorageSync('notificationSettings', this.data.notificationSettings);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },

  /**
   * 头像点击
   */
  onAvatarTap() {
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }
    
    wx.showActionSheet({
      itemList: ['查看头像', '更换头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 查看头像
          wx.previewImage({
            urls: [this.data.userInfo.avatarUrl],
          });
        } else if (res.tapIndex === 1) {
          // 更换头像
          this.changeAvatar();
        }
      },
    });
  },

  /**
   * 更换头像
   */
  changeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          
          // 更新头像
          const userInfo = { ...this.data.userInfo, avatarUrl: tempFilePath };
          this.setData({ userInfo });
          
          // 保存到本地
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '头像更新成功',
            icon: 'success',
          });
        }
      },
    });
  },

  /**
   * 登录
   */
  async onLogin() {
    try {
      // 获取用户信息
      const userProfile = await new Promise<WechatMiniprogram.GetUserProfileSuccessCallbackResult>((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善用户资料',
          success: resolve,
          fail: reject,
        });
      });
      
      // 获取登录凭证
      const loginResult = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });
      
      const userInfo = {
        avatarUrl: userProfile.userInfo.avatarUrl,
        nickName: userProfile.userInfo.nickName,
        userId: loginResult.code, // 实际应用中应该用服务器返回的用户ID
      };
      
      // 保存用户信息
      wx.setStorageSync('userInfo', userInfo);
      
      this.setData({
        userInfo,
        isLoggedIn: true,
      });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
      });
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: '登录失败',
        icon: 'error',
      });
    }
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后，部分功能将无法使用，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          
          this.setData({
            userInfo: {
              avatarUrl: '',
              nickName: '',
              userId: '',
            },
            isLoggedIn: false,
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
          });
        }
      },
    });
  },

  /**
   * 我的宠物
   */
  onMyPets() {
    wx.switchTab({
      url: '/pages/home/home',
    });
  },

  /**
   * 健康记录
   */
  onHealthRecords() {
    wx.switchTab({
      url: '/pages/schedule/schedule',
    });
  },

  /**
   * 通知设置
   */
  onNotificationSettings() {
    this.setData({ showNotificationModal: true });
  },

  /**
   * 通知开关
   */
  onNotificationToggle(e: any) {
    const enabled = e.detail.value;
    this.setData({
      'settings.notificationEnabled': enabled,
    });
    this.saveSettings();
    
    if (enabled) {
      // 请求通知权限
      wx.requestSubscribeMessage({
        tmplIds: ['template_id_1', 'template_id_2'],
        success: (res) => {
          console.log('订阅结果:', res);
        },
      });
    }
  },

  /**
   * 云同步开关
   */
  onCloudSyncToggle(e: any) {
    const enabled = e.detail.value;
    
    if (enabled && !this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '开启云同步需要先登录账号',
        success: (res) => {
          if (res.confirm) {
            this.onLogin();
          }
        },
      });
      return;
    }
    
    this.setData({
      'settings.cloudSync': enabled,
    });
    this.saveSettings();
    
    wx.showToast({
      title: enabled ? '已开启云同步' : '已关闭云同步',
      icon: 'success',
    });
  },

  /**
   * 数据同步
   */
  async onDataSync() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'error',
      });
      return;
    }
    
    wx.showLoading({ title: '同步中...' });
    
    try {
      // 模拟数据同步
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      wx.hideLoading();
      wx.showToast({
        title: '同步成功',
        icon: 'success',
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '同步失败',
        icon: 'error',
      });
    }
  },

  /**
   * 主题设置
   */
  onThemeSettings() {
    this.setData({ showThemeModal: true });
  },

  /**
   * 我的收藏
   */
  onCollections() {
    wx.navigateTo({
      url: '/pages/collections/collections',
    });
  },

  /**
   * 数据导出
   */
  onDataExport() {
    wx.showModal({
      title: '数据导出',
      content: '将导出您的宠物健康数据，包括宠物信息、疫苗记录、驱虫记录等。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '导出中...' });
          
          try {
            // 模拟数据导出
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            wx.hideLoading();
            wx.showToast({
              title: '导出成功',
              icon: 'success',
            });
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: '导出失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  /**
   * 意见反馈
   */
  onFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback',
    });
  },

  /**
   * 关于我们
   */
  onAbout() {
    wx.showModal({
      title: '关于宠物健康助手',
      content: `版本：${this.data.appVersion}\n\n专业的宠物健康管理工具，帮助您记录和管理宠物的疫苗接种、驱虫计划，提供健康知识和贴心提醒。\n\n让爱宠健康成长，让主人更安心！`,
      showCancel: false,
      confirmText: '知道了',
    });
  },

  /**
   * 隐私政策
   */
  onPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy',
    });
  },

  /**
   * 用户协议
   */
  onUserAgreement() {
    wx.navigateTo({
      url: '/pages/user-agreement/user-agreement',
    });
  },

  // 弹窗相关方法
  hideNotificationModal() {
    this.setData({ showNotificationModal: false });
  },

  hideThemeModal() {
    this.setData({ showThemeModal: false });
  },

  onVaccineNotificationChange(e: any) {
    this.setData({
      'notificationSettings.vaccine': e.detail.value,
    });
    this.saveSettings();
  },

  onDewormNotificationChange(e: any) {
    this.setData({
      'notificationSettings.deworm': e.detail.value,
    });
    this.saveSettings();
  },

  onReminderDaysChange(e: any) {
    const index = parseInt(e.detail.value);
    const days = this.data.reminderDays[index];
    
    this.setData({
      reminderDaysIndex: index,
      'notificationSettings.reminderDays': days,
    });
    this.saveSettings();
  },

  onSilentHoursChange(e: any) {
    this.setData({
      'notificationSettings.silentHours': e.detail.value,
    });
    this.saveSettings();
  },

  onThemeSelect(e: any) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({
      'settings.theme': theme,
    });
    this.saveSettings();
    
    wx.showToast({
      title: '主题已更新',
      icon: 'success',
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 工具方法
  getThemeText(theme: string): string {
    const themeMap: Record<string, string> = {
      light: '浅色模式',
      dark: '深色模式',
      auto: '跟随系统',
    };
    return themeMap[theme] || '跟随系统';
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '宠物健康助手 - 专业的宠物健康管理工具',
      path: '/pages/home/home',
    };
  },
});