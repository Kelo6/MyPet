// 通知服务
/// <reference path="../typings/index.d.ts" />

export class NotifyService {
  /**
   * 请求通知权限
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      const setting = await wx.getSetting();

      if (setting.authSetting['scope.userInfo'] === false) {
        // 用户之前拒绝了权限，需要引导用户手动开启
        const result = await wx.showModal({
          title: '需要通知权限',
          content: '为了及时提醒您宠物的疫苗和驱虫时间，需要开启通知权限',
          confirmText: '去设置',
          cancelText: '取消',
        });

        if (result.confirm) {
          await wx.openSetting();
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }

  /**
   * 发送本地通知
   */
  static async sendLocalNotification(options: {
    title: string;
    content: string;
    delay?: number;
  }): Promise<boolean> {
    try {
      // 微信小程序不支持本地推送，这里只是示例
      // 实际应该通过服务端实现推送功能

      wx.showToast({
        title: options.title,
        icon: 'none',
        duration: 3000,
      });

      return true;
    } catch (error) {
      console.error('发送通知失败:', error);
      return false;
    }
  }

  /**
   * 订阅消息
   */
  static async subscribeMessage(templateIds: string[]): Promise<boolean> {
    try {
      const result = await wx.requestSubscribeMessage({
        tmplIds: templateIds,
      });

      // 检查订阅结果
      let hasAccepted = false;
      for (const templateId of templateIds) {
        if (result[templateId] === 'accept') {
          hasAccepted = true;
          break;
        }
      }

      return hasAccepted;
    } catch (error) {
      console.error('订阅消息失败:', error);
      return false;
    }
  }

  /**
   * 发送模板消息（需要后端支持）
   */
  static async sendTemplateMessage(options: {
    touser: string;
    template_id: string;
    page?: string;
    data: Record<string, { value: string; color?: string }>;
  }): Promise<ApiResult<boolean>> {
    try {
      // 这里应该调用后端API发送模板消息
      // 为了演示，我们返回成功结果

      return {
        code: 0,
        msg: '发送成功',
        data: true,
      };
    } catch (error) {
      console.error('发送模板消息失败:', error);
      return {
        code: -1,
        msg: '发送失败',
        data: false,
      };
    }
  }

  /**
   * 设置提醒
   */
  static async setReminder(options: {
    scheduleId: string;
    title: string;
    content: string;
    triggerTime: string;
  }): Promise<boolean> {
    try {
      // 实际项目中应该通过云函数或服务端设置定时提醒
      // 这里只是本地存储提醒信息

      const reminders = wx.getStorageSync('reminders') || [];
      reminders.push({
        id: `reminder_${Date.now()}`,
        ...options,
        createdAt: new Date().toISOString(),
      });

      wx.setStorageSync('reminders', reminders);
      return true;
    } catch (error) {
      console.error('设置提醒失败:', error);
      return false;
    }
  }

  /**
   * 取消提醒
   */
  static async cancelReminder(scheduleId: string): Promise<boolean> {
    try {
      const reminders = wx.getStorageSync('reminders') || [];
      const filteredReminders = reminders.filter(
        (reminder: any) => reminder.scheduleId !== scheduleId
      );

      wx.setStorageSync('reminders', filteredReminders);
      return true;
    } catch (error) {
      console.error('取消提醒失败:', error);
      return false;
    }
  }
}
