// pages/reminders/reminders.ts
import { DatabaseService } from '../../services/database';
import { Pet, Reminder } from '../../models/database';
import { DateUtils } from '../../utils/date';
import { SubscriptionService } from '../../services/subscription';
import { MessageSimulator } from '../../utils/message-simulator';

// 日历日期项
interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasReminders: boolean;
  reminders: Reminder[];
}

// 分组的提醒
interface GroupedReminder {
  date: string;
  reminders: Reminder[];
}

// 统计信息
interface ReminderStats {
  total: number;
  vaccine: number;
  deworm: number;
  pending: number;
  sent: number;
  done: number;
}

// 稍后提醒选项
interface SnoozeOption {
  value: number;
  label: string;
  icon: string;
}

Page({
  data: {
    // 基础数据
    pets: [] as Pet[],
    allReminders: [] as Reminder[],
    filteredReminders: [] as Reminder[],
    groupedReminders: [] as GroupedReminder[],
    
    // 视图状态
    currentView: 'list' as 'calendar' | 'list',
    selectedType: 'all',
    selectedStatus: '',
    
    // 统计信息
    stats: {
      total: 0,
      vaccine: 0,
      deworm: 0,
      pending: 0,
      sent: 0,
      done: 0,
    } as ReminderStats,
    
    // 日历相关
    // 使用字符串存储，避免小程序数据层序列化导致的 Date 方法丢失
    currentDate: new Date().toISOString(),
    selectedDate: '',
    calendarDays: [] as CalendarDay[],
    selectedDateReminders: [] as Reminder[],
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    
    // 弹窗状态
    showSnoozeModal: false,
    showSubscribeModal: false,
    selectedSnooze: 0,
    subscribing: false,
    
    // 稍后提醒选项
    snoozeOptions: [
      { value: 15, label: '15分钟后', icon: '⏰' },
      { value: 60, label: '1小时后', icon: '🕐' },
      { value: 240, label: '4小时后', icon: '🕓' },
      { value: 1440, label: '明天', icon: '📅' },
      { value: 10080, label: '下周', icon: '📆' },
      { value: 43200, label: '下月', icon: '🗓️' },
    ] as SnoozeOption[],
    
    // 当前操作的提醒
    currentReminder: {} as Reminder,
    previewReminder: {} as Reminder,
    
    // 其他状态
    loading: false,
  },

  onLoad() {
    this.loadData();
    this.generateCalendar();
  },

  onShow() {
    // 页面显示时重新加载数据
    this.loadData();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载数据
   */
  async loadData() {
    this.setData({ loading: true });
    
    try {
      // 加载宠物和提醒数据
      const [petsResult, remindersResult] = await Promise.all([
        DatabaseService.getPetsByUserId('current_user'),
        this.loadAllReminders(),
      ]);

      if (petsResult.success && remindersResult.success) {
        const pets = petsResult.data || [];
        const allReminders = remindersResult.data || [];
        
        this.setData({ pets, allReminders });
        this.filterAndGroupReminders();
        this.updateCalendar();
      } else {
        throw new Error('加载数据失败');
      }
    } catch (error) {
      console.error('加载提醒数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载所有提醒数据
   */
  async loadAllReminders(): Promise<{ success: boolean; data?: Reminder[] }> {
    try {
      // 这里应该调用获取提醒的API，暂时返回模拟数据
      const mockReminders: Reminder[] = [];
      
      // 从时间表数据生成提醒
      const petsResult = await DatabaseService.getPetsByUserId('current_user');
      if (petsResult.success && petsResult.data) {
        for (const pet of petsResult.data) {
          const [vaccineResult, dewormResult] = await Promise.all([
            DatabaseService.getVaccineRecordsByPetId(pet._id as string),
            DatabaseService.getDewormRecordsByPetId(pet._id as string),
          ]);
          
          // 从疫苗记录生成提醒
          if (vaccineResult.success && vaccineResult.data) {
            vaccineResult.data.forEach(vaccine => {
              if (vaccine.status === 'pending') {
                const fireAt = new Date(vaccine.plannedDate);
                fireAt.setDate(fireAt.getDate() - 3); // 提前3天提醒
                
                mockReminders.push({
                  _id: `vaccine_${vaccine._id}`,
                  userId: 'current_user',
                  petId: pet._id as string,
                  type: 'vaccine',
                  title: `${pet.name}的${vaccine.name || '疫苗接种'}提醒`,
                  fireAt: fireAt.toISOString(),
                  status: 'pending',
                  subscribeMsgTemplateId: 'vaccine_reminder_template',
                  reminderDays: 3,
                  createdAt: new Date().toISOString(),
                });
              }
            });
          }
          
          // 从驱虫记录生成提醒
          if (dewormResult.success && dewormResult.data) {
            dewormResult.data.forEach(deworm => {
              if (deworm.status === 'pending') {
                const fireAt = new Date(deworm.plannedDate);
                fireAt.setDate(fireAt.getDate() - 2); // 提前2天提醒
                
                const typeMap = {
                  internal: '体内驱虫',
                  external: '体外驱虫',
                  both: '内外驱虫',
                };
                
                mockReminders.push({
                  _id: `deworm_${deworm._id}`,
                  userId: 'current_user',
                  petId: pet._id as string,
                  type: 'deworm',
                  title: `${pet.name}的${typeMap[deworm.type]}提醒`,
                  fireAt: fireAt.toISOString(),
                  status: 'pending',
                  subscribeMsgTemplateId: 'deworm_reminder_template',
                  reminderDays: 2,
                  createdAt: new Date().toISOString(),
                });
              }
            });
          }
        }
      }
      
      return { success: true, data: mockReminders };
    } catch (error) {
      console.error('加载提醒失败:', error);
      return { success: false };
    }
  },

  /**
   * 筛选和分组提醒
   */
  filterAndGroupReminders() {
    const { allReminders, selectedType, selectedStatus } = this.data;
    
    // 按类型和状态筛选
    let filtered = allReminders;
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(reminder => reminder.type === selectedType);
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(reminder => reminder.status === selectedStatus);
    }
    
    // 按提醒时间排序
    filtered.sort((a, b) => {
      const dateA = new Date(a.fireAt).getTime();
      const dateB = new Date(b.fireAt).getTime();
      return dateA - dateB;
    });
    
    // 按日期分组
    const grouped: GroupedReminder[] = [];
    const dateMap = new Map<string, Reminder[]>();
    
    filtered.forEach(reminder => {
      const date = DateUtils.format(new Date(reminder.fireAt));
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date)!.push(reminder);
    });
    
    dateMap.forEach((reminders, date) => {
      grouped.push({ date, reminders });
    });
    
    // 计算统计信息
    const stats = this.calculateStats(allReminders);
    
    this.setData({
      filteredReminders: filtered,
      groupedReminders: grouped,
      stats,
    });
  },

  /**
   * 计算统计信息
   */
  calculateStats(reminders: Reminder[]): ReminderStats {
    const stats = {
      total: reminders.length,
      vaccine: 0,
      deworm: 0,
      pending: 0,
      sent: 0,
      done: 0,
    };
    
    reminders.forEach(reminder => {
      if (reminder.type === 'vaccine') stats.vaccine++;
      if (reminder.type === 'deworm') stats.deworm++;
      if (reminder.status === 'pending') stats.pending++;
      if (reminder.status === 'sent') stats.sent++;
      if (reminder.status === 'done') stats.done++;
    });
    
    return stats;
  },

  /**
   * 生成日历
   */
  generateCalendar() {
    const raw = this.data.currentDate as unknown as string | number | Date;
    const base = new Date(raw as any);
    const year = base.getFullYear();
    const month = base.getMonth();
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一天是星期几
    const firstDayWeek = firstDay.getDay();
    
    // 生成日历数组
    const days: CalendarDay[] = [];
    const today = new Date();
    const todayStr = DateUtils.format(today);
    
    // 添加上月的日期（填充）
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date: DateUtils.format(date),
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        hasReminders: false,
        reminders: [],
      });
    }
    
    // 添加当月的日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = DateUtils.format(date);
      
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        hasReminders: false,
        reminders: [],
      });
    }
    
    // 添加下月的日期（填充到42个格子）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: DateUtils.format(date),
        day,
        isCurrentMonth: false,
        isToday: false,
        hasReminders: false,
        reminders: [],
      });
    }
    
    this.setData({ calendarDays: days });
    this.updateCalendar();
  },

  /**
   * 更新日历中的提醒信息
   */
  updateCalendar() {
    const { calendarDays, allReminders } = this.data;
    
    // 按日期分组提醒
    const reminderMap = new Map<string, Reminder[]>();
    allReminders.forEach(reminder => {
      const date = DateUtils.format(new Date(reminder.fireAt));
      if (!reminderMap.has(date)) {
        reminderMap.set(date, []);
      }
      reminderMap.get(date)!.push(reminder);
    });
    
    // 更新日历数据
    const updatedDays = calendarDays.map(day => ({
      ...day,
      reminders: reminderMap.get(day.date) || [],
      hasReminders: reminderMap.has(day.date),
    }));
    
    this.setData({ calendarDays: updatedDays });
  },

  /**
   * 视图切换
   */
  onViewChange(e: any) {
    const view = e.currentTarget.dataset.view;
    this.setData({ currentView: view });
    
    if (view === 'calendar') {
      this.generateCalendar();
    }
  },

  /**
   * 类型筛选
   */
  onTypeFilter(e: any) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 
      selectedType: type,
      selectedStatus: '', // 清除状态筛选
    });
    this.filterAndGroupReminders();
  },

  /**
   * 状态筛选
   */
  onStatusFilter(e: any) {
    const status = e.currentTarget.dataset.status;
    this.setData({ 
      selectedStatus: status,
      selectedType: 'all', // 清除类型筛选
    });
    this.filterAndGroupReminders();
  },

  /**
   * 上一月
   */
  onPrevMonth() {
    const current = new Date(this.data.currentDate as any);
    current.setMonth(current.getMonth() - 1);
    this.setData({ currentDate: current.toISOString() });
    this.generateCalendar();
  },

  /**
   * 下一月
   */
  onNextMonth() {
    const current = new Date(this.data.currentDate as any);
    current.setMonth(current.getMonth() + 1);
    this.setData({ currentDate: current.toISOString() });
    this.generateCalendar();
  },

  /**
   * 回到今天
   */
  onToday() {
    this.setData({ currentDate: new Date().toISOString() });
    this.generateCalendar();
  },

  /**
   * 选择日期
   */
  onDaySelect(e: any) {
    const date = e.currentTarget.dataset.date;
    const { calendarDays } = this.data;
    
    const selectedDay = calendarDays.find(day => day.date === date);
    const selectedDateReminders = selectedDay ? selectedDay.reminders : [];
    
    this.setData({
      selectedDate: date,
      selectedDateReminders,
    });
  },

  /**
   * 提醒详情
   */
  onReminderDetail(e: any) {
    const reminder = e.currentTarget.dataset.reminder;
    console.log('查看提醒详情:', reminder);
    // TODO: 跳转到提醒详情页面或显示详情弹窗
  },

  /**
   * 稍后提醒
   */
  onSnoozeReminder(e: any) {
    const reminder = e.currentTarget.dataset.reminder;
    this.setData({
      showSnoozeModal: true,
      currentReminder: reminder,
      selectedSnooze: 0,
    });
  },

  /**
   * 选择稍后提醒时间
   */
  onSnoozeSelect(e: any) {
    const value = parseInt(e.currentTarget.dataset.value);
    this.setData({ selectedSnooze: value });
  },

  /**
   * 确认稍后提醒
   */
  async confirmSnooze() {
    const { currentReminder, selectedSnooze } = this.data;
    
    if (!selectedSnooze) {
      wx.showToast({
        title: '请选择延迟时间',
        icon: 'error',
      });
      return;
    }
    
    try {
      // 计算新的提醒时间
      const newFireAt = new Date();
      newFireAt.setMinutes(newFireAt.getMinutes() + selectedSnooze);
      
      // TODO: 调用API更新提醒时间
      console.log('延迟提醒:', currentReminder._id, '到', newFireAt);
      
      wx.showToast({
        title: '已延迟提醒',
        icon: 'success',
      });
      
      this.hideSnoozeModal();
      this.loadData(); // 重新加载数据
    } catch (error) {
      console.error('延迟提醒失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error',
      });
    }
  },

  /**
   * 隐藏稍后提醒弹窗
   */
  hideSnoozeModal() {
    this.setData({
      showSnoozeModal: false,
      currentReminder: {} as Reminder,
      selectedSnooze: 0,
    });
  },

  /**
   * 订阅消息
   */
  onSubscribeMessage(e: any) {
    const reminder = e.currentTarget.dataset.reminder;
    this.setData({
      showSubscribeModal: true,
      previewReminder: reminder,
    });
  },

  /**
   * 确认订阅
   */
  async confirmSubscribe() {
    const { previewReminder } = this.data;
    
    this.setData({ subscribing: true });
    
    try {
      // 请求订阅消息权限
      const result = await new Promise<WechatMiniprogram.RequestSubscribeMessageSuccessCallbackResult>((resolve, reject) => {
        wx.requestSubscribeMessage({
          tmplIds: [previewReminder.subscribeMsgTemplateId || 'default_template'],
          success: resolve,
          fail: reject,
        });
      });
      
      if (result[previewReminder.subscribeMsgTemplateId || 'default_template'] === 'accept') {
        // TODO: 调用API保存订阅状态
        console.log('订阅成功:', previewReminder._id);
        
        wx.showToast({
          title: '订阅成功',
          icon: 'success',
        });
        
        this.hideSubscribeModal();
        this.loadData(); // 重新加载数据
      } else {
        wx.showToast({
          title: '订阅被拒绝',
          icon: 'error',
        });
      }
    } catch (error) {
      console.error('订阅失败:', error);
      wx.showToast({
        title: '订阅失败',
        icon: 'error',
      });
    } finally {
      this.setData({ subscribing: false });
    }
  },

  /**
   * 隐藏订阅弹窗
   */
  hideSubscribeModal() {
    this.setData({
      showSubscribeModal: false,
      previewReminder: {} as Reminder,
    });
  },

  /**
   * 批量订阅
   */
  onBatchSubscribe() {
    const { filteredReminders } = this.data;
    const pendingReminders = filteredReminders.filter(r => r.status === 'pending');
    
    if (pendingReminders.length === 0) {
      wx.showToast({
        title: '没有待订阅的提醒',
        icon: 'none',
      });
      return;
    }
    
    wx.showModal({
      title: '批量订阅',
      content: `确定要订阅 ${pendingReminders.length} 个提醒吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 获取所有模板ID
            const templateIds = [...new Set(pendingReminders.map(r => r.subscribeMsgTemplateId).filter(Boolean))];
            
            // 请求订阅权限
            const result = await new Promise<WechatMiniprogram.RequestSubscribeMessageSuccessCallbackResult>((resolve, reject) => {
              wx.requestSubscribeMessage({
                tmplIds: templateIds,
                success: resolve,
                fail: reject,
              });
            });
            
            let successCount = 0;
            templateIds.forEach(templateId => {
              if (templateId && result[templateId] === 'accept') {
                successCount++;
              }
            });
            
            wx.showToast({
              title: `成功订阅${successCount}个模板`,
              icon: 'success',
            });
            
            this.loadData(); // 重新加载数据
          } catch (error) {
            console.error('批量订阅失败:', error);
            wx.showToast({
              title: '订阅失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  /**
   * 添加提醒
   */
  onAddReminder() {
    wx.navigateTo({
      url: '/pages/reminder-form/reminder-form',
    });
  },

  /**
   * 生成提醒
   */
  onGenerateReminders() {
    wx.showModal({
      title: '生成提醒',
      content: '系统将根据您的健康计划自动生成提醒，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '生成中...' });
            
            // TODO: 调用API生成提醒
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟延迟
            
            wx.hideLoading();
            wx.showToast({
              title: '生成成功',
              icon: 'success',
            });
            
            this.loadData(); // 重新加载数据
          } catch (error) {
            wx.hideLoading();
            console.error('生成提醒失败:', error);
            wx.showToast({
              title: '生成失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 工具方法
  formatMonth(dateInput: string | Date): string {
    const d = new Date(dateInput as any);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  },

  formatSelectedDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  formatGroupDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateString = DateUtils.format(date);
    const todayString = DateUtils.format(today);
    const tomorrowString = DateUtils.format(tomorrow);
    
    if (dateString === todayString) {
      return '今天';
    } else if (dateString === tomorrowString) {
      return '明天';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  },

  formatFireTime(fireAtStr: string): string {
    const date = new Date(fireAtStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  getRelativeTime(fireAtStr: string): string {
    return DateUtils.getRelativeTime(fireAtStr);
  },

  getReminderTitle(reminder: Reminder): string {
    return reminder.title;
  },

  getPetName(petId: string): string {
    const pet = this.data.pets.find(p => p._id === petId);
    return pet ? pet.name : '未知宠物';
  },

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      sent: '已发送',
      done: '已完成',
    };
    return statusMap[status] || status;
  },

  getEmptyTitle(): string {
    const { selectedType, selectedStatus } = this.data;
    
    if (selectedType !== 'all') {
      const typeMap: Record<string, string> = {
        vaccine: '疫苗提醒',
        deworm: '驱虫提醒',
      };
      return `暂无${typeMap[selectedType]}`;
    }
    
    if (selectedStatus) {
      const statusMap: Record<string, string> = {
        pending: '待处理提醒',
        sent: '已发送提醒',
        done: '已完成提醒',
      };
      return `暂无${statusMap[selectedStatus]}`;
    }
    
    return '暂无提醒';
  },

  getEmptyDescription(): string {
    return '点击下方按钮生成健康提醒，或手动添加自定义提醒';
  },

  /**
   * 获取类型文本
   */
  getTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      vaccine: '疫苗',
      deworm: '驱虫',
      checkup: '体检',
      custom: '自定义',
    };
    return typeMap[type] || type;
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '宠物健康助手 - 提醒管理',
      path: '/pages/reminders/reminders',
    };
  },

  /**
   * 批量请求订阅授权
   */
  async requestAllSubscriptions() {
    try {
      wx.showLoading({ title: '请求授权中...' });
      
      const result = await SubscriptionService.requestAllSubscriptions();
      
      wx.hideLoading();
      
      if (result.success) {
        const { authorizedCount, results } = result;
        
        if (authorizedCount > 0) {
          wx.showToast({
            title: `已授权${authorizedCount}个消息`,
            icon: 'success'
          });
          
          // 显示详细的授权结果
          const authorizedTypes = Object.entries(results)
            .filter(([_, authorized]) => authorized)
            .map(([type, _]) => this.getTypeText(type));
          
          if (authorizedTypes.length > 0) {
            setTimeout(() => {
              wx.showModal({
                title: '授权成功',
                content: `已成功授权：${authorizedTypes.join('、')}提醒`,
                showCancel: false,
                confirmText: '知道了'
              });
            }, 1500);
          }
        } else {
          wx.showModal({
            title: '未获得授权',
            content: '您可以稍后在设置中重新授权消息提醒',
            showCancel: false,
            confirmText: '知道了'
          });
        }
        
        // 刷新订阅状态
        this.loadSubscriptionStatus();
        
      } else {
        throw new Error(result.error || '授权失败');
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('请求订阅消息失败:', error);
      wx.showToast({
        title: '授权失败',
        icon: 'error'
      });
    }
  },

  /**
   * 智能请求单个类型的订阅
   */
  async smartRequestSubscription(type: 'vaccine' | 'deworm' | 'checkup') {
    try {
      wx.showLoading({ title: '检查授权状态...' });
      
      const result = await SubscriptionService.smartRequestSubscription(type);
      
      wx.hideLoading();
      
      if (result.success && result.authorized) {
        wx.showToast({
          title: `${this.getTypeText(type)}授权成功`,
          icon: 'success'
        });
        
        this.loadSubscriptionStatus();
        return true;
      } else {
        const message = result.error || '授权失败';
        wx.showToast({
          title: message,
          icon: 'none'
        });
        return false;
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('智能授权失败:', error);
      wx.showToast({
        title: '授权失败',
        icon: 'error'
      });
      return false;
    }
  },

  /**
   * 加载订阅状态
   */
  async loadSubscriptionStatus() {
    try {
      const userId = 'current_user';
      const stats = await SubscriptionService.getSubscriptionStats(userId);
      
      this.setData({
        subscriptionStats: stats
      });
      
      console.log('订阅状态统计:', stats);
      
    } catch (error) {
      console.error('加载订阅状态失败:', error);
    }
  },

  /**
   * 测试消息发送（开发模式）
   */
  async testMessageSending() {
    try {
      wx.showModal({
        title: '测试消息发送',
        content: '这将模拟发送消息提醒，是否继续？',
        success: async (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '模拟发送中...' });
            
            // 启动模拟器
            MessageSimulator.setEnabled(true);
            MessageSimulator.setSimulationParams(0.8, 1000);
            
            // 模拟定时任务
            await MessageSimulator.simulateScheduledTask();
            
            wx.hideLoading();
            wx.showToast({
              title: '模拟发送完成',
              icon: 'success'
            });
            
            // 刷新提醒列表
            this.loadAllReminders();
          }
        }
      });
      
    } catch (error) {
      wx.hideLoading();
      console.error('测试消息发送失败:', error);
      wx.showToast({
        title: '测试失败',
        icon: 'error'
      });
    }
  },
});