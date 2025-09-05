// pages/home/home.ts
import { DatabaseService } from '../../services/database';
import { Pet, VaccineRecord, DewormRecord } from '../../models/database';
import { DateUtils } from '../../utils/date';

interface ExtendedPet extends Pet {
  vaccineStatus?: string;
  dewormStatus?: string;
}

interface ScheduleWithType {
  _id: string;
  petId: string;
  type: string;
  plannedDate: string;
  status: string;
  [key: string]: any;
}

Page({
  data: {
    hasUserInfo: false,
    userInfo: null as WechatMiniprogram.UserInfo | null,
    loading: true,
    pets: [] as ExtendedPet[],
    recentSchedules: [] as ScheduleWithType[],
    todaySchedules: [] as ScheduleWithType[],
    upcomingSchedules: [] as ScheduleWithType[],
    overdueSchedules: [] as ScheduleWithType[],
    petNameMap: {} as Record<string, string>,
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    this.refreshData();
  },

  /**
   * 初始化数据
   */
  async initData() {
    try {
      this.setData({ loading: true });
      await this.loadUserInfo();
      await this.loadPets();
      await this.loadSchedules();
    } catch (error) {
      console.error('初始化数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    if (this.data.hasUserInfo) {
      await this.loadPets();
      await this.loadSchedules();
    }
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      const app = getApp<IAppOption>();
      if (app.globalData.userInfo) {
        this.setData({
          hasUserInfo: true,
          userInfo: app.globalData.userInfo,
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  /**
   * 加载宠物数据
   */
  async loadPets() {
    if (!this.data.hasUserInfo) return;

    try {
      const userId = 'current_user'; // 实际应用中从登录获取
      const result = await DatabaseService.getPetsByUserId(userId);
      
      if (result.success && result.data) {
        const pets = result.data;
        const petNameMap: Record<string, string> = {};
        
        // 为每个宠物计算健康状态
        const petsWithStatus = await Promise.all(pets.map(async (pet) => {
          petNameMap[pet._id] = pet.name;
          
          // 获取疫苗状态
          const vaccineResult = await DatabaseService.getVaccineRecordsByPetId(pet._id);
          const vaccineStatus = this.calculateVaccineStatus(vaccineResult.data || []);
          
          // 获取驱虫状态
          const dewormResult = await DatabaseService.getDewormRecordsByPetId(pet._id);
          const dewormStatus = this.calculateDewormStatus(dewormResult.data || []);
          
          return {
            ...pet,
            vaccineStatus,
            dewormStatus,
          };
        }));
        
        this.setData({ 
          pets: petsWithStatus,
          petNameMap,
        });
      }
    } catch (error) {
      console.error('加载宠物数据失败:', error);
    }
  },

  /**
   * 加载日程数据
   */
  async loadSchedules() {
    if (this.data.pets.length === 0) return;

    try {
      const now = new Date();
      const today = DateUtils.format(now);
      const thirtyDaysLater = DateUtils.format(DateUtils.addDays(now, 30));
      
      const allVaccineRecords: VaccineRecord[] = [];
      const allDewormRecords: DewormRecord[] = [];
      
      // 获取所有宠物的记录
      for (const pet of this.data.pets) {
        const vaccineResult = await DatabaseService.getVaccineRecordsByPetId(pet._id);
        if (vaccineResult.success && vaccineResult.data) {
          allVaccineRecords.push(...vaccineResult.data);
        }
        
        const dewormResult = await DatabaseService.getDewormRecordsByPetId(pet._id);
        if (dewormResult.success && dewormResult.data) {
          allDewormRecords.push(...dewormResult.data);
        }
      }
      
      // 筛选和分类日程
      const allSchedules = [
        ...allVaccineRecords.map(record => ({ ...record, type: 'vaccine' })),
        ...allDewormRecords.map(record => ({ ...record, type: 'deworm' })),
      ];
      
      const pendingSchedules = allSchedules.filter(schedule => 
        schedule.status === 'pending' && schedule.plannedDate <= thirtyDaysLater
      );
      
      // 分类日程
      const overdueSchedules = pendingSchedules.filter(schedule => 
        schedule.plannedDate < today
      );
      
      const todaySchedules = pendingSchedules.filter(schedule => 
        schedule.plannedDate === today
      );
      
      const upcomingSchedules = pendingSchedules.filter(schedule => 
        schedule.plannedDate > today
      ).sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
      
      const recentSchedules = [...overdueSchedules, ...todaySchedules, ...upcomingSchedules];
      
      this.setData({
        recentSchedules,
        overdueSchedules,
        todaySchedules,
        upcomingSchedules,
      });
    } catch (error) {
      console.error('加载日程数据失败:', error);
    }
  },

  /**
   * 计算疫苗状态
   */
  calculateVaccineStatus(records: VaccineRecord[]): 'normal' | 'warning' | 'danger' | 'unknown' {
    if (records.length === 0) return 'unknown';
    
    const now = new Date();
    const overdueRecords = records.filter(record => 
      record.status === 'pending' && new Date(record.plannedDate) < now
    );
    
    if (overdueRecords.length > 0) return 'danger';
    
    const upcomingRecords = records.filter(record => 
      record.status === 'pending' && 
      this.getDaysBetween(now, new Date(record.plannedDate)) <= 7
    );
    
    if (upcomingRecords.length > 0) return 'warning';
    
    return 'normal';
  },

  /**
   * 计算驱虫状态
   */
  calculateDewormStatus(records: DewormRecord[]): 'normal' | 'warning' | 'danger' | 'unknown' {
    if (records.length === 0) return 'unknown';
    
    const now = new Date();
    const overdueRecords = records.filter(record => 
      record.status === 'pending' && new Date(record.plannedDate) < now
    );
    
    if (overdueRecords.length > 0) return 'danger';
    
    const upcomingRecords = records.filter(record => 
      record.status === 'pending' && 
      this.getDaysBetween(now, new Date(record.plannedDate)) <= 7
    );
    
    if (upcomingRecords.length > 0) return 'warning';
    
    return 'normal';
  },

  /**
   * 计算两个日期之间的天数差
   */
  getDaysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor((date2.getTime() - date1.getTime()) / oneDay);
  },

  /**
   * 获取欢迎文案
   */
  getWelcomeText(): string {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了，早点休息哦';
    if (hour < 11) return '早上好！美好的一天开始了';
    if (hour < 14) return '中午好！记得照顾好毛孩子';
    if (hour < 18) return '下午好！适合遛宠的时光';
    if (hour < 22) return '晚上好！陪伴是最好的爱';
    return '夜深了，和毛孩子一起休息吧';
  },

  /**
   * 获取宠物名称
   */
  getPetName(petId: string): string {
    return this.data.petNameMap[petId] || '未知宠物';
  },

  /**
   * 获取日程标题
   */
  getScheduleTitle(schedule: any): string {
    if (schedule.type === 'vaccine') {
      return schedule.name || '疫苗接种';
    } else if (schedule.type === 'deworm') {
      return `${schedule.type === 'internal' ? '内' : schedule.type === 'external' ? '外' : ''}驱虫`;
    }
    return '健康计划';
  },

  /**
   * 获取逾期天数
   */
  getOverdueDays(plannedDate: string): number {
    const now = new Date();
    const planned = new Date(plannedDate);
    return this.getDaysBetween(planned, now);
  },

  /**
   * 获取相对日期描述
   */
  getRelativeDate(date: string): string {
    const now = new Date();
    const target = new Date(date);
    const days = this.getDaysBetween(now, target);
    
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days === 2) return '后天';
    if (days <= 7) return `${days}天后`;
    if (days <= 30) return `${Math.ceil(days / 7)}周后`;
    return DateUtils.format(target);
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
   * 用户授权登录
   */
  getUserInfo(e: any) {
    if (e.detail.userInfo) {
      const app = getApp<IAppOption>();
      app.globalData.userInfo = e.detail.userInfo;
      
      this.setData({
        hasUserInfo: true,
        userInfo: e.detail.userInfo,
      });
      
      // 重新加载数据
      this.refreshData();
    }
  },

  /**
   * 宠物卡片点击
   */
  onPetCardTap(e: any) {
    const petId = e.detail.petId || e.currentTarget.dataset.petId;
    wx.navigateTo({
      url: `/pages/pet-detail/pet-detail?id=${petId}`,
    });
  },

  /**
   * 编辑宠物
   */
  onPetEdit(e: any) {
    const petId = e.detail.petId;
    wx.navigateTo({
      url: `/pages/pet-form/pet-form?id=${petId}`,
    });
  },

  /**
   * 查看宠物详情
   */
  onPetDetail(e: any) {
    const petId = e.detail.petId;
    wx.navigateTo({
      url: `/pages/pet-detail/pet-detail?id=${petId}`,
    });
  },

  /**
   * 添加宠物
   */
  addPet() {
    wx.navigateTo({
      url: '/pages/pet-form/pet-form',
    });
  },

  /**
   * 跳转页面
   */
  goToPets() {
    wx.navigateTo({
      url: '/pages/profile/profile',
    });
  },

  goToSchedule() {
    wx.navigateTo({
      url: '/pages/schedule/schedule',
    });
  },

  goToReminders() {
    wx.navigateTo({
      url: '/pages/reminders/reminders',
    });
  },

  goToKnowledge() {
    wx.navigateTo({
      url: '/pages/knowledge/knowledge',
    });
  },

  /**
   * 完成日程
   */
  async completeSchedule(e: any) {
    const scheduleId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认完成',
      content: '确认已完成该项任务？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 这里需要根据具体类型更新对应的记录
            const schedule = this.data.recentSchedules.find(s => s._id === scheduleId);
            if (schedule) {
              const now = new Date().toISOString().split('T')[0];
              
              if (schedule.type === 'vaccine') {
                await DatabaseService.saveVaccineRecord({
                  _id: schedule._id,
                  petId: schedule.petId,
                  name: schedule.name || '疫苗接种',
                  doseNo: schedule.doseNo || 1,
                  plannedDate: schedule.plannedDate,
                  actualDate: now,
                  status: 'completed' as const,
                });
              } else if (schedule.type === 'deworm') {
                await DatabaseService.saveDewormRecord({
                  _id: schedule._id,
                  petId: schedule.petId,
                  type: (schedule.dewormType || 'internal') as 'internal' | 'external' | 'both',
                  plannedDate: schedule.plannedDate,
                  actualDate: now,
                  status: 'completed' as const,
                });
              }
              
              wx.showToast({
                title: '已标记完成',
                icon: 'success',
              });
              
              this.refreshData();
            }
          } catch (error) {
            console.error('完成任务失败:', error);
            wx.showToast({
              title: '操作失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '宠物健康助手 - 疫苗驱虫提醒',
      path: '/pages/home/home',
      imageUrl: '/assets/images/share-logo.png',
    };
  },

  /**
   * 分享朋友圈
   */
  onShareTimeline() {
    return {
      title: '宠物健康助手 - 贴心的疫苗驱虫提醒',
      imageUrl: '/assets/images/share-logo.png',
    };
  },
});