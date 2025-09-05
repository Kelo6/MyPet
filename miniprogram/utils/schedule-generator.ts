// utils/schedule-generator.ts
// 宠物疫苗/驱虫计划生成算法

import { 
  VaccineConfig, 
  DewormConfig, 
  ScheduleItem,
  getVaccineConfigs,
  getDewormConfigs,
  AGE_STAGES,
  PRIORITY_WEIGHTS,
  DEFAULT_SCHEDULE_SETTINGS
} from '../constants/schedule';
import { VaccineRecord, DewormRecord } from '../models/database';
import { DateUtils } from './date';

/**
 * 历史记录接口
 */
export interface HistoryRecord {
  type: 'vaccine' | 'deworm';
  name: string;
  actualDate: string;
  doseNo?: number;
  dewormType?: 'internal' | 'external' | 'both';
}

/**
 * 计划生成选项
 */
export interface GenerateOptions {
  /** 计划范围（月） */
  planningMonths?: number;
  /** 是否包含疫苗 */
  includeVaccines?: boolean;
  /** 是否包含驱虫 */
  includeDeworm?: boolean;
  /** 自定义配置 */
  customConfigs?: {
    vaccines?: VaccineConfig[];
    deworming?: DewormConfig[];
  };
}

/**
 * 宠物疫苗/驱虫计划生成器
 */
export class ScheduleGenerator {
  
  /**
   * 生成宠物健康计划
   */
  static generateSchedule(
    species: 'dog' | 'cat',
    birthday: string,
    historyRecords: HistoryRecord[] = [],
    options: GenerateOptions = {}
  ): ScheduleItem[] {
    const {
      planningMonths = DEFAULT_SCHEDULE_SETTINGS.planningMonths,
      includeVaccines = true,
      includeDeworm = true,
      customConfigs = {}
    } = options;

    if (!birthday) {
      console.warn('未提供生日信息，无法生成计划');
      return [];
    }

    const birthDate = new Date(birthday);
    const now = new Date();
    const endDate = new Date(now.getTime() + planningMonths * 30 * 24 * 60 * 60 * 1000);

    let scheduleItems: ScheduleItem[] = [];

    // 生成疫苗计划
    if (includeVaccines) {
      const vaccineConfigs = customConfigs.vaccines || getVaccineConfigs(species);
      const vaccineItems = this.generateVaccineSchedule(
        birthDate,
        now,
        endDate,
        vaccineConfigs,
        historyRecords.filter(r => r.type === 'vaccine')
      );
      scheduleItems.push(...vaccineItems);
    }

    // 生成驱虫计划
    if (includeDeworm) {
      const dewormConfigs = customConfigs.deworming || getDewormConfigs(species);
      const dewormItems = this.generateDewormSchedule(
        birthDate,
        now,
        endDate,
        dewormConfigs,
        historyRecords.filter(r => r.type === 'deworm')
      );
      scheduleItems.push(...dewormItems);
    }

    // 排序和去重
    scheduleItems = this.sortAndDeduplicateSchedule(scheduleItems);

    return scheduleItems;
  }

  /**
   * 生成疫苗计划
   */
  private static generateVaccineSchedule(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    configs: VaccineConfig[],
    historyRecords: HistoryRecord[]
  ): ScheduleItem[] {
    const scheduleItems: ScheduleItem[] = [];

    for (const config of configs) {
      const items = this.generateVaccineItemsForConfig(
        birthDate,
        startDate,
        endDate,
        config,
        historyRecords.filter(r => this.isMatchingVaccine(r, config))
      );
      scheduleItems.push(...items);
    }

    return scheduleItems;
  }

  /**
   * 为单个疫苗配置生成计划项
   */
  private static generateVaccineItemsForConfig(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    config: VaccineConfig,
    historyRecords: HistoryRecord[]
  ): ScheduleItem[] {
    const items: ScheduleItem[] = [];
    const currentAge = this.calculateAgeInWeeks(birthDate, startDate);

    // 按实际接种时间排序
    historyRecords.sort((a, b) => new Date(a.actualDate).getTime() - new Date(b.actualDate).getTime());

    if (currentAge < config.primary.endWeeks) {
      // 幼期免疫计划
      items.push(...this.generatePrimaryVaccineSchedule(
        birthDate,
        startDate,
        endDate,
        config,
        historyRecords
      ));
    } else {
      // 成年期加强免疫
      items.push(...this.generateBoosterVaccineSchedule(
        birthDate,
        startDate,
        endDate,
        config,
        historyRecords
      ));
    }

    return items;
  }

  /**
   * 生成初免计划
   */
  private static generatePrimaryVaccineSchedule(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    config: VaccineConfig,
    historyRecords: HistoryRecord[]
  ): ScheduleItem[] {
    const items: ScheduleItem[] = [];
    const completedDoses = historyRecords.length;
    
    // 计算下一剂次的时间
    let nextDoseDate: Date;
    let nextDoseNo = completedDoses + 1;

    if (completedDoses === 0) {
      // 首次接种：按开始周龄计算
      nextDoseDate = new Date(birthDate.getTime() + config.primary.startWeeks * 7 * 24 * 60 * 60 * 1000);
    } else {
      // 后续接种：基于最后一次实际接种时间
      const lastRecord = historyRecords[historyRecords.length - 1];
      const lastDate = new Date(lastRecord.actualDate);
      nextDoseDate = new Date(lastDate.getTime() + config.primary.intervalWeeks * 7 * 24 * 60 * 60 * 1000);
    }

    // 生成剩余剂次
    const remainingDoses = Math.max(0, config.primary.recommendedDoses - completedDoses);
    
    for (let i = 0; i < remainingDoses; i++) {
      if (nextDoseDate > endDate) break;

      // 确保不早于当前时间
      const plannedDate = nextDoseDate < startDate ? startDate : nextDoseDate;

      items.push({
        type: 'vaccine',
        name: config.name,
        doseNo: nextDoseNo,
        plannedDate: plannedDate.toISOString().split('T')[0],
        window: this.calculateWindow(plannedDate, config.windowDays),
        note: `第${nextDoseNo}针 - ${config.note || ''}`,
        priority: this.getVaccinePriority(config.type),
        configId: config.type,
      });

      // 计算下一剂次时间
      nextDoseDate = new Date(nextDoseDate.getTime() + config.primary.intervalWeeks * 7 * 24 * 60 * 60 * 1000);
      nextDoseNo++;
    }

    return items;
  }

  /**
   * 生成加强免疫计划
   */
  private static generateBoosterVaccineSchedule(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    config: VaccineConfig,
    historyRecords: HistoryRecord[]
  ): ScheduleItem[] {
    const items: ScheduleItem[] = [];

    if (historyRecords.length === 0) {
      // 没有历史记录，需要补种
      return this.generateCatchUpVaccineSchedule(birthDate, startDate, endDate, config);
    }

    // 基于最后一次接种计算加强时间
    const lastRecord = historyRecords[historyRecords.length - 1];
    const lastDate = new Date(lastRecord.actualDate);
    const ageAtLastVaccine = this.calculateAgeInMonths(birthDate, lastDate);

    let nextBoosterDate: Date;
    let intervalMonths: number;

    if (ageAtLastVaccine < AGE_STAGES.ADULT_START_MONTHS) {
      // 最后一次接种在幼期，使用首次加强间隔
      intervalMonths = config.booster.firstBoosterMonths;
    } else {
      // 成年期加强
      intervalMonths = config.booster.intervalMonths;
    }

    nextBoosterDate = new Date(lastDate.getTime() + intervalMonths * 30 * 24 * 60 * 60 * 1000);

    // 生成未来的加强免疫计划
    let doseNo = (lastRecord.doseNo || historyRecords.length) + 1;

    while (nextBoosterDate <= endDate) {
      if (nextBoosterDate >= startDate) {
        items.push({
          type: 'vaccine',
          name: config.name,
          doseNo: doseNo,
          plannedDate: nextBoosterDate.toISOString().split('T')[0],
          window: this.calculateWindow(nextBoosterDate, config.windowDays),
          note: `年度加强 - ${config.note || ''}`,
          priority: this.getVaccinePriority(config.type),
          configId: config.type,
        });
      }

      // 计算下次加强时间
      nextBoosterDate = new Date(nextBoosterDate.getTime() + config.booster.intervalMonths * 30 * 24 * 60 * 60 * 1000);
      doseNo++;
    }

    return items;
  }

  /**
   * 生成补种计划（成年宠物无历史记录）
   */
  private static generateCatchUpVaccineSchedule(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    config: VaccineConfig
  ): ScheduleItem[] {
    const items: ScheduleItem[] = [];
    const currentAge = this.calculateAgeInMonths(birthDate, startDate);

    if (currentAge >= AGE_STAGES.ADULT_START_MONTHS) {
      // 成年宠物补种：通常需要2针，间隔3-4周
      const firstDoseDate = startDate;
      const secondDoseDate = new Date(firstDoseDate.getTime() + 21 * 24 * 60 * 60 * 1000); // 3周后

      items.push({
        type: 'vaccine',
        name: config.name,
        doseNo: 1,
        plannedDate: firstDoseDate.toISOString().split('T')[0],
        window: this.calculateWindow(firstDoseDate, config.windowDays),
        note: `成年补种第1针 - ${config.note || ''}`,
        priority: this.getVaccinePriority(config.type),
        configId: config.type,
      });

      if (secondDoseDate <= endDate) {
        items.push({
          type: 'vaccine',
          name: config.name,
          doseNo: 2,
          plannedDate: secondDoseDate.toISOString().split('T')[0],
          window: this.calculateWindow(secondDoseDate, config.windowDays),
          note: `成年补种第2针 - ${config.note || ''}`,
          priority: this.getVaccinePriority(config.type),
          configId: config.type,
        });
      }
    }

    return items;
  }

  /**
   * 生成驱虫计划
   */
  private static generateDewormSchedule(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    configs: DewormConfig[],
    historyRecords: HistoryRecord[]
  ): ScheduleItem[] {
    const scheduleItems: ScheduleItem[] = [];

    for (const config of configs) {
      const items = this.generateDewormItemsForConfig(
        birthDate,
        startDate,
        endDate,
        config,
        historyRecords.filter(r => this.isMatchingDeworm(r, config))
      );
      scheduleItems.push(...items);
    }

    return scheduleItems;
  }

  /**
   * 为单个驱虫配置生成计划项
   */
  private static generateDewormItemsForConfig(
    birthDate: Date,
    startDate: Date,
    endDate: Date,
    config: DewormConfig,
    historyRecords: HistoryRecord[]
  ): ScheduleItem[] {
    const items: ScheduleItem[] = [];
    const currentAge = this.calculateAgeInMonths(birthDate, startDate);

    // 按实际驱虫时间排序
    historyRecords.sort((a, b) => new Date(a.actualDate).getTime() - new Date(b.actualDate).getTime());

    let nextDewormDate: Date;
    let intervalMonths: number;

    if (historyRecords.length === 0) {
      // 没有历史记录，从推荐开始时间计算
      const startAge = Math.max(config.puppy.startMonths, currentAge);
      nextDewormDate = new Date(birthDate.getTime() + startAge * 30 * 24 * 60 * 60 * 1000);
      nextDewormDate = nextDewormDate < startDate ? startDate : nextDewormDate;
    } else {
      // 基于最后一次驱虫时间计算
      const lastRecord = historyRecords[historyRecords.length - 1];
      const lastDate = new Date(lastRecord.actualDate);
      nextDewormDate = new Date(lastDate.getTime());
    }

    // 生成未来的驱虫计划
    while (nextDewormDate <= endDate) {
      const ageAtDeworm = this.calculateAgeInMonths(birthDate, nextDewormDate);
      
      // 确定间隔时间
      if (ageAtDeworm < config.puppy.endMonths) {
        intervalMonths = config.puppy.intervalMonths;
      } else {
        intervalMonths = config.adult.intervalMonths;
      }

      // 如果有历史记录，计算下次驱虫时间
      if (historyRecords.length > 0) {
        const lastRecord = historyRecords[historyRecords.length - 1];
        const lastDate = new Date(lastRecord.actualDate);
        nextDewormDate = new Date(lastDate.getTime() + intervalMonths * 30 * 24 * 60 * 60 * 1000);
      }

      if (nextDewormDate > endDate) break;
      if (nextDewormDate < startDate) {
        nextDewormDate = new Date(nextDewormDate.getTime() + intervalMonths * 30 * 24 * 60 * 60 * 1000);
        continue;
      }

      items.push({
        type: 'deworm',
        name: config.name,
        plannedDate: nextDewormDate.toISOString().split('T')[0],
        window: this.calculateWindow(nextDewormDate, config.windowDays),
        note: config.note || '',
        priority: this.getDewormPriority(config.type),
        configId: `${config.type}_deworm`,
      });

      // 计算下次驱虫时间
      nextDewormDate = new Date(nextDewormDate.getTime() + intervalMonths * 30 * 24 * 60 * 60 * 1000);
    }

    return items;
  }

  /**
   * 重新计算宠物计划
   */
  static async recalculatePlan(petId: string): Promise<ScheduleItem[]> {
    try {
      // 这里需要集成到现有的数据库服务中
      // 获取宠物信息和历史记录，然后重新生成计划
      console.log(`重新计算宠物 ${petId} 的健康计划`);
      
      // 示例实现 - 实际使用时需要替换为真实的数据获取逻辑
      return [];
    } catch (error) {
      console.error('重新计算计划失败:', error);
      return [];
    }
  }

  /**
   * 工具方法：计算年龄（周）
   */
  private static calculateAgeInWeeks(birthDate: Date, currentDate: Date): number {
    const diffTime = currentDate.getTime() - birthDate.getTime();
    return Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  }

  /**
   * 工具方法：计算年龄（月）
   */
  private static calculateAgeInMonths(birthDate: Date, currentDate: Date): number {
    const diffTime = currentDate.getTime() - birthDate.getTime();
    return Math.floor(diffTime / (30 * 24 * 60 * 60 * 1000));
  }

  /**
   * 工具方法：计算接种窗口
   */
  private static calculateWindow(plannedDate: Date, windowDays: number): { start: string; end: string } {
    const startDate = new Date(plannedDate.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(plannedDate.getTime() + windowDays * 24 * 60 * 60 * 1000);

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }

  /**
   * 工具方法：获取疫苗优先级
   */
  private static getVaccinePriority(vaccineType: string): 'high' | 'medium' | 'low' {
    if (vaccineType.includes('rabies')) return 'high';
    if (vaccineType.includes('core')) return 'high';
    return 'medium';
  }

  /**
   * 工具方法：获取驱虫优先级
   */
  private static getDewormPriority(dewormType: string): 'high' | 'medium' | 'low' {
    return dewormType === 'internal' ? 'medium' : 'medium';
  }

  /**
   * 工具方法：判断疫苗记录是否匹配配置
   */
  private static isMatchingVaccine(record: HistoryRecord, config: VaccineConfig): boolean {
    // 简化的匹配逻辑，实际可以更复杂
    return record.name.includes(config.name) || 
           config.name.includes(record.name) ||
           (config.type === 'rabies' && record.name.includes('狂犬'));
  }

  /**
   * 工具方法：判断驱虫记录是否匹配配置
   */
  private static isMatchingDeworm(record: HistoryRecord, config: DewormConfig): boolean {
    if (record.dewormType) {
      return record.dewormType === config.type || 
             (record.dewormType === 'both' && (config.type === 'internal' || config.type === 'external'));
    }
    return record.name.includes(config.name) || config.name.includes(record.name);
  }

  /**
   * 工具方法：排序和去重
   */
  private static sortAndDeduplicateSchedule(items: ScheduleItem[]): ScheduleItem[] {
    // 按日期排序
    items.sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

    // 简单去重（同一天同类型同名称）
    const uniqueItems: ScheduleItem[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const key = `${item.plannedDate}-${item.type}-${item.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  }
}




