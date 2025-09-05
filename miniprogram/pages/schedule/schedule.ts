// pages/schedule/schedule.ts
import { DatabaseService } from '../../services/database';
import { Pet, VaccineRecord, DewormRecord } from '../../models/database';
import { DateUtils } from '../../utils/date';

// 扩展的计划项接口
interface ExtendedSchedule {
  _id?: string;
  petId: string;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'completed';
  type: 'vaccine' | 'deworm';
  // 疫苗相关字段
  name?: string;
  doseNo?: number;
  hospital?: string;
  // 驱虫相关字段
  dewormType?: 'internal' | 'external' | 'both';
  product?: string;
  // 通用字段
  note?: string;
  createdAt?: string;
}

// 分组的宠物计划
interface GroupedPetSchedule {
  petId: string;
  pet: Pet;
  schedules: ExtendedSchedule[];
}

// 统计信息
interface ScheduleStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

Page({
  data: {
    // 基础数据
    pets: [] as Pet[],
    allSchedules: [] as ExtendedSchedule[],
    filteredSchedules: [] as ExtendedSchedule[],
    groupedSchedules: [] as GroupedPetSchedule[],
    
    // 筛选状态
    currentTab: 'all',
    selectedPetId: '',
    
    // 统计信息
    stats: {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
    } as ScheduleStats,
    
    // 弹窗状态
    showCompleteModal: false,
    completeSchedule: {} as ExtendedSchedule,
    actualDate: '',
    completeNote: '',
    completing: false,
    
    // 其他状态
    loading: false,
    today: '',
  },

  onLoad() {
    const today = DateUtils.format(new Date());
    this.setData({ today });
    this.loadData();
  },

  onShow() {
    // 页面显示时重新加载数据
    this.loadData();
  },

  /**
   * 加载数据
   */
  async loadData() {
    this.setData({ loading: true });
    
    try {
      // 加载宠物数据
      const petsResult = await DatabaseService.getPetsByUserId('current_user');
      
      if (petsResult.success) {
        const pets = petsResult.data || [];
        const allSchedules: ExtendedSchedule[] = [];
        
        // 为每个宠物加载疫苗和驱虫记录
        for (const pet of pets) {
          try {
            const [vaccineResult, dewormResult] = await Promise.all([
              DatabaseService.getVaccineRecordsByPetId(pet._id as string),
              DatabaseService.getDewormRecordsByPetId(pet._id as string),
            ]);
            
            if (vaccineResult.success && vaccineResult.data) {
              const vaccines = vaccineResult.data.map((v: any) => ({ ...v, type: 'vaccine' as const }));
              allSchedules.push(...vaccines);
            }
            
            if (dewormResult.success && dewormResult.data) {
              const deworns = dewormResult.data.map((d: any) => ({ ...d, type: 'deworm' as const }));
              allSchedules.push(...deworns);
            }
          } catch (error) {
            console.error(`加载宠物 ${pet.name} 的记录失败:`, error);
          }
        }
        
        this.setData({ pets, allSchedules });
        this.filterAndGroupSchedules();
      } else {
        throw new Error('加载宠物数据失败');
      }
    } catch (error) {
      console.error('加载时间表数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 筛选和分组计划
   */
  filterAndGroupSchedules() {
    const { allSchedules, currentTab, selectedPetId, pets } = this.data;
    
    // 按状态筛选
    let filtered = allSchedules;
    if (currentTab !== 'all') {
      filtered = allSchedules.filter(schedule => {
        const status = this.getScheduleStatus(schedule);
        return status === currentTab;
      });
    }
    
    // 按宠物筛选
    if (selectedPetId) {
      filtered = filtered.filter(schedule => schedule.petId === selectedPetId);
    }
    
    // 按计划日期排序
    filtered.sort((a, b) => {
      const dateA = new Date(a.plannedDate).getTime();
      const dateB = new Date(b.plannedDate).getTime();
      return dateA - dateB;
    });
    
    // 按宠物分组
    const grouped: GroupedPetSchedule[] = [];
    const petMap = new Map<string, Pet>();
    pets.forEach(pet => petMap.set(pet._id as string, pet));
    
    filtered.forEach(schedule => {
      const pet = petMap.get(schedule.petId);
      if (!pet) return;
      
      let group = grouped.find(g => g.petId === schedule.petId);
      if (!group) {
        group = { petId: schedule.petId, pet, schedules: [] };
        grouped.push(group);
      }
      group.schedules.push(schedule);
    });
    
    // 计算统计信息
    const stats = this.calculateStats(allSchedules);
    
    this.setData({
      filteredSchedules: filtered,
      groupedSchedules: grouped,
      stats,
    });
  },

  /**
   * 计算统计信息
   */
  calculateStats(schedules: ExtendedSchedule[]): ScheduleStats {
    const stats = { total: 0, pending: 0, completed: 0, overdue: 0 };
    
    schedules.forEach(schedule => {
      stats.total++;
      const status = this.getScheduleStatus(schedule);
      stats[status as keyof ScheduleStats]++;
    });
    
    return stats;
  },

  /**
   * 获取计划状态
   */
  getScheduleStatus(schedule: ExtendedSchedule): string {
    if (schedule.status === 'completed' || schedule.actualDate) {
      return 'completed';
    }
    
    const today = new Date();
    const plannedDate = new Date(schedule.plannedDate);
    
    if (plannedDate < today) {
      return 'overdue';
    }
    
    return 'pending';
  },

  /**
   * 标签页切换
   */
  onTabChange(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.filterAndGroupSchedules();
  },

  /**
   * 宠物筛选
   */
  onPetFilter(e: any) {
    const petId = e.currentTarget.dataset.petId;
    this.setData({ selectedPetId: petId });
    this.filterAndGroupSchedules();
  },

  /**
   * 计划详情
   */
  onScheduleDetail(e: any) {
    const schedule = e.currentTarget.dataset.schedule;
    console.log('查看计划详情:', schedule);
    // TODO: 跳转到计划详情页面
  },

  /**
   * 标记完成
   */
  onMarkComplete(e: any) {
    const schedule = e.currentTarget.dataset.schedule;
    const actualDate = DateUtils.format(new Date());
    
    this.setData({
      showCompleteModal: true,
      completeSchedule: schedule,
      actualDate,
      completeNote: '',
    });
  },

  /**
   * 编辑计划
   */
  onEditSchedule(e: any) {
    const schedule = e.currentTarget.dataset.schedule;
    console.log('编辑计划:', schedule);
    // TODO: 跳转到编辑页面
  },

  /**
   * 实际日期变化
   */
  onActualDateChange(e: any) {
    this.setData({ actualDate: e.detail.value });
  },

  /**
   * 完成备注变化
   */
  onCompleteNoteChange(e: any) {
    this.setData({ completeNote: e.detail.value });
  },

  /**
   * 确认完成
   */
  async confirmComplete() {
    const { completeSchedule, actualDate, completeNote } = this.data;
    
    if (!actualDate) {
      wx.showToast({
        title: '请选择完成日期',
        icon: 'error',
      });
      return;
    }
    
    this.setData({ completing: true });
    
    try {
      const updateData = {
        ...completeSchedule,
        actualDate,
        status: 'completed' as const,
        note: completeNote || undefined,
      };
      
      let result;
      if (completeSchedule.type === 'vaccine') {
        const vaccineData = {
          _id: updateData._id,
          petId: updateData.petId,
          name: updateData.name || '疫苗接种',
          doseNo: updateData.doseNo || 1,
          plannedDate: updateData.plannedDate,
          actualDate: updateData.actualDate,
          status: updateData.status,
          hospital: updateData.hospital,
          note: updateData.note,
        };
        result = await DatabaseService.saveVaccineRecord(vaccineData);
      } else {
        const dewormData = {
          _id: updateData._id,
          petId: updateData.petId,
          type: updateData.dewormType || 'internal',
          plannedDate: updateData.plannedDate,
          actualDate: updateData.actualDate,
          status: updateData.status,
          product: updateData.product,
          note: updateData.note,
        };
        result = await DatabaseService.saveDewormRecord(dewormData);
      }
      
      if (result.success) {
        wx.showToast({
          title: '标记完成成功',
          icon: 'success',
        });
        this.hideCompleteModal();
        this.loadData(); // 重新加载数据
      } else {
        throw new Error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('标记完成失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error',
      });
    } finally {
      this.setData({ completing: false });
    }
  },

  /**
   * 隐藏完成弹窗
   */
  hideCompleteModal() {
    this.setData({
      showCompleteModal: false,
      completeSchedule: {} as ExtendedSchedule,
      actualDate: '',
      completeNote: '',
    });
  },

  /**
   * 生成计划
   */
  onGeneratePlan() {
    wx.showModal({
      title: '生成健康计划',
      content: '系统将根据宠物信息自动生成疫苗和驱虫计划，是否继续？',
      success: (res) => {
        if (res.confirm) {
          this.generateHealthPlan();
        }
      },
    });
  },

  /**
   * 自动生成健康计划
   */
  async generateHealthPlan() {
    try {
      wx.showLoading({ title: '生成中...' });
      
      const { pets } = this.data;
      const plans: (Omit<VaccineRecord, '_id' | 'createdAt'> | Omit<DewormRecord, '_id' | 'createdAt'>)[] = [];
      
      for (const pet of pets) {
        // 生成疫苗计划
        const vaccinePlans = this.generateVaccinePlan(pet);
        plans.push(...vaccinePlans);
        
        // 生成驱虫计划
        const dewormPlans = this.generateDewormPlan(pet);
        plans.push(...dewormPlans);
      }
      
      // 保存计划到数据库
      for (const plan of plans) {
        if ('doseNo' in plan) {
          await DatabaseService.saveVaccineRecord(plan as Omit<VaccineRecord, '_id' | 'createdAt'>);
        } else {
          await DatabaseService.saveDewormRecord(plan as Omit<DewormRecord, '_id' | 'createdAt'>);
        }
      }
      
      wx.hideLoading();
      wx.showToast({
        title: `生成${plans.length}项计划`,
        icon: 'success',
      });
      
      this.loadData(); // 重新加载数据
    } catch (error) {
      wx.hideLoading();
      console.error('生成计划失败:', error);
      wx.showToast({
        title: '生成失败',
        icon: 'error',
      });
    }
  },

  /**
   * 生成疫苗计划
   */
  generateVaccinePlan(pet: Pet): Omit<VaccineRecord, '_id' | 'createdAt'>[] {
    const plans: Omit<VaccineRecord, '_id' | 'createdAt'>[] = [];
    const today = new Date();
    
    // 根据宠物类型和年龄生成不同的疫苗计划
    if (pet.species === 'dog') {
      // 狗狗疫苗计划
      const vaccines = [
        { name: '六联疫苗', doseNo: 1, days: 45 },
        { name: '六联疫苗', doseNo: 2, days: 75 },
        { name: '六联疫苗', doseNo: 3, days: 105 },
        { name: '狂犬疫苗', doseNo: 1, days: 90 },
      ];
      
      vaccines.forEach(vaccine => {
        const plannedDate = DateUtils.addDays(today, vaccine.days);
        plans.push({
          petId: pet._id as string,
          name: vaccine.name,
          doseNo: vaccine.doseNo,
          plannedDate: DateUtils.format(plannedDate),
          status: 'pending',
        });
      });
    } else if (pet.species === 'cat') {
      // 猫咪疫苗计划
      const vaccines = [
        { name: '三联疫苗', doseNo: 1, days: 45 },
        { name: '三联疫苗', doseNo: 2, days: 75 },
        { name: '三联疫苗', doseNo: 3, days: 105 },
        { name: '狂犬疫苗', doseNo: 1, days: 90 },
      ];
      
      vaccines.forEach(vaccine => {
        const plannedDate = DateUtils.addDays(today, vaccine.days);
        plans.push({
          petId: pet._id as string,
          name: vaccine.name,
          doseNo: vaccine.doseNo,
          plannedDate: DateUtils.format(plannedDate),
          status: 'pending',
        });
      });
    }
    
    return plans;
  },

  /**
   * 生成驱虫计划
   */
  generateDewormPlan(pet: Pet): Omit<DewormRecord, '_id' | 'createdAt'>[] {
    const plans: Omit<DewormRecord, '_id' | 'createdAt'>[] = [];
    const today = new Date();
    
    // 生成定期驱虫计划
    const dewormSchedule = [
      { type: 'internal', days: 30 },
      { type: 'external', days: 30 },
      { type: 'internal', days: 60 },
      { type: 'external', days: 60 },
      { type: 'both', days: 90 },
    ];
    
    dewormSchedule.forEach(deworm => {
      const plannedDate = DateUtils.addDays(today, deworm.days);
      plans.push({
        petId: pet._id as string,
        type: deworm.type as 'internal' | 'external' | 'both',
        plannedDate: DateUtils.format(plannedDate),
        status: 'pending',
      });
    });
    
    return plans;
  },

  /**
   * 添加计划
   */
  onAddSchedule() {
    wx.showActionSheet({
      itemList: ['添加疫苗计划', '添加驱虫计划'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 跳转到添加疫苗页面
          wx.navigateTo({
            url: '/pages/vaccine-form/vaccine-form',
          });
        } else if (res.tapIndex === 1) {
          // 跳转到添加驱虫页面
          wx.navigateTo({
            url: '/pages/deworm-form/deworm-form',
          });
        }
      },
    });
  },

  /**
   * 空状态操作
   */
  onEmptyAction() {
    const { pets } = this.data;
    if (pets.length === 0) {
      wx.navigateTo({
        url: '/pages/pet-form/pet-form',
      });
    } else {
      this.onGeneratePlan();
    }
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 工具方法
  getEmptyTitle(): string {
    const { pets, currentTab } = this.data;
    if (pets.length === 0) {
      return '还没有宠物信息';
    }
    
    const titles: Record<string, string> = {
      all: '暂无健康计划',
      pending: '暂无待完成计划',
      completed: '暂无已完成计划',
      overdue: '暂无过期计划',
    };
    
    return titles[currentTab] || '暂无计划';
  },

  getEmptyDescription(): string {
    const { pets, currentTab } = this.data;
    if (pets.length === 0) {
      return '请先添加宠物信息，然后生成健康计划';
    }
    
    const descriptions: Record<string, string> = {
      all: '点击下方按钮生成疫苗和驱虫计划',
      pending: '所有计划都已完成，真棒！',
      completed: '还没有完成的计划记录',
      overdue: '太好了，没有过期的计划',
    };
    
    return descriptions[currentTab] || '点击生成计划开始管理宠物健康';
  },

  getPetMeta(pet: Pet): string {
    const parts = [];
    if (pet.species) {
      const speciesMap: Record<string, string> = {
        dog: '🐕 狗狗',
        cat: '🐱 猫咪',
        bird: '🐦 鸟类',
        rabbit: '🐰 兔子',
        hamster: '🐹 仓鼠',
        other: '🐾 其他',
      };
      parts.push(speciesMap[pet.species] || pet.species);
    }
    if (pet.birthday) {
      parts.push(DateUtils.calculateAge(pet.birthday));
    }
    return parts.join(' • ');
  },

  getScheduleIcon(schedule: ExtendedSchedule): string {
    if (schedule.status === 'completed' || schedule.actualDate) {
      return '✓';
    }
    return schedule.type === 'vaccine' ? '💉' : '💊';
  },

  getScheduleTitle(schedule: ExtendedSchedule): string {
    if (schedule.type === 'vaccine') {
      return schedule.name || '疫苗接种';
    } else {
      const typeMap = {
        internal: '体内驱虫',
        external: '体外驱虫',
        both: '内外驱虫',
      };
      return typeMap[schedule.dewormType || 'internal'];
    }
  },

  formatScheduleDate(schedule: ExtendedSchedule): string {
    return DateUtils.format(new Date(schedule.plannedDate), 'MM月DD日');
  },

  getDateStatus(schedule: ExtendedSchedule): string {
    if (schedule.status === 'completed' || schedule.actualDate) {
      return 'completed';
    }
    
    const today = new Date();
    const plannedDate = new Date(schedule.plannedDate);
    const diffDays = Math.ceil((plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'overdue';
    } else if (diffDays === 0) {
      return 'today';
    } else {
      return 'upcoming';
    }
  },

  getDateStatusText(schedule: ExtendedSchedule): string {
    const status = this.getDateStatus(schedule);
    const statusMap: Record<string, string> = {
      completed: '已完成',
      overdue: '已过期',
      today: '今天',
      upcoming: '即将到期',
    };
    return statusMap[status] || '';
  },

  getDewormTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      internal: '体内',
      external: '体外',
      both: '内外',
    };
    return typeMap[type] || type;
  },

  formatDate(dateStr: string): string {
    return DateUtils.format(new Date(dateStr), 'MM月DD日');
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '宠物健康助手 - 疫苗驱虫时间表',
      path: '/pages/schedule/schedule',
    };
  },
});