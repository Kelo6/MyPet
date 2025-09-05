// services/schedule-service.ts
// 宠物健康计划服务

import { ScheduleGenerator, HistoryRecord, GenerateOptions } from '../utils/schedule-generator';
import { ScheduleItem } from '../constants/schedule';
import { DatabaseService } from './database';
import { Pet, VaccineRecord, DewormRecord } from '../models/database';

/**
 * 计划重新计算结果
 */
export interface RecalculateResult {
  success: boolean;
  petId: string;
  scheduleItems: ScheduleItem[];
  totalItems: number;
  vaccineItems: number;
  dewormItems: number;
  error?: string;
}

/**
 * 宠物健康计划服务
 */
export class ScheduleService {
  
  /**
   * 为宠物生成健康计划
   */
  static async generatePetSchedule(
    petId: string,
    options: GenerateOptions = {}
  ): Promise<RecalculateResult> {
    try {
      // 获取宠物信息
      const petResult = await DatabaseService.getPetById(petId);
      if (!petResult.success || !petResult.data) {
        throw new Error('宠物信息不存在');
      }

      const pet = petResult.data;
      if (!pet.birthday) {
        return {
          success: false,
          petId,
          scheduleItems: [],
          totalItems: 0,
          vaccineItems: 0,
          dewormItems: 0,
          error: '宠物生日信息缺失，无法生成计划',
        };
      }

      // 获取历史记录
      const historyRecords = await this.getHistoryRecords(petId);

      // 生成计划
      const scheduleItems = ScheduleGenerator.generateSchedule(
        pet.species as 'dog' | 'cat',
        pet.birthday,
        historyRecords,
        options
      );

      const vaccineItems = scheduleItems.filter(item => item.type === 'vaccine').length;
      const dewormItems = scheduleItems.filter(item => item.type === 'deworm').length;

      return {
        success: true,
        petId,
        scheduleItems,
        totalItems: scheduleItems.length,
        vaccineItems,
        dewormItems,
      };

    } catch (error) {
      console.error('生成宠物计划失败:', error);
      return {
        success: false,
        petId,
        scheduleItems: [],
        totalItems: 0,
        vaccineItems: 0,
        dewormItems: 0,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 重新计算宠物计划
   */
  static async recalculatePetPlan(petId: string): Promise<RecalculateResult> {
    console.log(`重新计算宠物 ${petId} 的健康计划`);
    return this.generatePetSchedule(petId);
  }

  /**
   * 批量重新计算多个宠物的计划
   */
  static async batchRecalculatePlans(petIds: string[]): Promise<RecalculateResult[]> {
    const results: RecalculateResult[] = [];

    for (const petId of petIds) {
      try {
        const result = await this.recalculatePetPlan(petId);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          petId,
          scheduleItems: [],
          totalItems: 0,
          vaccineItems: 0,
          dewormItems: 0,
          error: error instanceof Error ? error.message : '计算失败',
        });
      }
    }

    return results;
  }

  /**
   * 为用户的所有宠物重新计算计划
   */
  static async recalculateUserPetPlans(userId: string): Promise<{
    success: boolean;
    results: RecalculateResult[];
    summary: {
      total: number;
      success: number;
      failed: number;
    };
  }> {
    try {
      // 获取用户所有宠物
      const petsResult = await DatabaseService.getPetsByUserId(userId);
      if (!petsResult.success || !petsResult.data) {
        throw new Error('获取用户宠物失败');
      }

      const pets = petsResult.data;
      const petIds = pets.map(pet => pet._id as string).filter(Boolean);

      // 批量计算
      const results = await this.batchRecalculatePlans(petIds);

      const summary = {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      };

      return {
        success: true,
        results,
        summary,
      };

    } catch (error) {
      console.error('批量计算用户宠物计划失败:', error);
      return {
        success: false,
        results: [],
        summary: {
          total: 0,
          success: 0,
          failed: 0,
        },
      };
    }
  }

  /**
   * 获取宠物的历史记录
   */
  private static async getHistoryRecords(petId: string): Promise<HistoryRecord[]> {
    const historyRecords: HistoryRecord[] = [];

    try {
      // 获取疫苗记录
      const vaccineResult = await DatabaseService.getVaccineRecordsByPetId(petId);
      if (vaccineResult.success && vaccineResult.data) {
        const vaccineHistories: HistoryRecord[] = vaccineResult.data
          .filter(record => record.status === 'completed' && record.actualDate)
          .map(record => ({
            type: 'vaccine' as const,
            name: record.name,
            actualDate: record.actualDate!,
            doseNo: record.doseNo,
          }));
        historyRecords.push(...vaccineHistories);
      }

      // 获取驱虫记录
      const dewormResult = await DatabaseService.getDewormRecordsByPetId(petId);
      if (dewormResult.success && dewormResult.data) {
        const dewormHistories: HistoryRecord[] = dewormResult.data
          .filter(record => record.status === 'completed' && record.actualDate)
          .map(record => ({
            type: 'deworm' as const,
            name: this.getDewormDisplayName(record.type),
            actualDate: record.actualDate!,
            dewormType: record.type,
          }));
        historyRecords.push(...dewormHistories);
      }

    } catch (error) {
      console.error('获取历史记录失败:', error);
    }

    return historyRecords;
  }

  /**
   * 获取驱虫显示名称
   */
  private static getDewormDisplayName(type: 'internal' | 'external' | 'both'): string {
    const nameMap = {
      internal: '体内驱虫',
      external: '体外驱虫',
      both: '内外驱虫',
    };
    return nameMap[type] || type;
  }

  /**
   * 获取即将到期的计划（未来N天内）
   */
  static async getUpcomingSchedules(
    petId: string,
    days: number = 30
  ): Promise<{
    success: boolean;
    schedules: ScheduleItem[];
    count: number;
  }> {
    try {
      const result = await this.generatePetSchedule(petId);
      if (!result.success) {
        throw new Error(result.error || '生成计划失败');
      }

      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const upcomingSchedules = result.scheduleItems.filter(item => {
        const plannedDate = new Date(item.plannedDate);
        return plannedDate >= now && plannedDate <= futureDate;
      });

      return {
        success: true,
        schedules: upcomingSchedules,
        count: upcomingSchedules.length,
      };

    } catch (error) {
      console.error('获取即将到期计划失败:', error);
      return {
        success: false,
        schedules: [],
        count: 0,
      };
    }
  }

  /**
   * 获取过期的计划
   */
  static async getOverdueSchedules(
    petId: string
  ): Promise<{
    success: boolean;
    schedules: ScheduleItem[];
    count: number;
  }> {
    try {
      const result = await this.generatePetSchedule(petId);
      if (!result.success) {
        throw new Error(result.error || '生成计划失败');
      }

      const now = new Date();

      const overdueSchedules = result.scheduleItems.filter(item => {
        const windowEnd = new Date(item.window.end);
        return windowEnd < now;
      });

      return {
        success: true,
        schedules: overdueSchedules,
        count: overdueSchedules.length,
      };

    } catch (error) {
      console.error('获取过期计划失败:', error);
      return {
        success: false,
        schedules: [],
        count: 0,
      };
    }
  }

  /**
   * 标记计划项为完成
   */
  static async markScheduleCompleted(
    petId: string,
    scheduleItem: ScheduleItem,
    actualDate: string,
    note?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (scheduleItem.type === 'vaccine') {
        // 创建疫苗记录
        const vaccineRecord: Partial<VaccineRecord> = {
          petId,
          name: scheduleItem.name,
          doseNo: scheduleItem.doseNo || 1,
          plannedDate: scheduleItem.plannedDate,
          actualDate,
          status: 'completed',
          note,
        };

        const result = await DatabaseService.saveVaccineRecord(vaccineRecord as VaccineRecord);
        if (!result.success) {
          throw new Error('保存疫苗记录失败');
        }

      } else if (scheduleItem.type === 'deworm') {
        // 创建驱虫记录
        const dewormType = this.inferDewormType(scheduleItem.name);
        const dewormRecord: Partial<DewormRecord> = {
          petId,
          type: dewormType,
          plannedDate: scheduleItem.plannedDate,
          actualDate,
          status: 'completed',
          note,
        };

        const result = await DatabaseService.saveDewormRecord(dewormRecord as DewormRecord);
        if (!result.success) {
          throw new Error('保存驱虫记录失败');
        }
      }

      // 重新计算计划
      await this.recalculatePetPlan(petId);

      return { success: true };

    } catch (error) {
      console.error('标记计划完成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '操作失败',
      };
    }
  }

  /**
   * 推断驱虫类型
   */
  private static inferDewormType(name: string): 'internal' | 'external' | 'both' {
    if (name.includes('体内')) return 'internal';
    if (name.includes('体外')) return 'external';
    if (name.includes('内外')) return 'both';
    return 'internal'; // 默认体内
  }

  /**
   * 获取计划统计信息
   */
  static async getPetScheduleStats(petId: string): Promise<{
    success: boolean;
    stats: {
      total: number;
      vaccines: number;
      deworm: number;
      upcoming: number;
      overdue: number;
      highPriority: number;
    };
  }> {
    try {
      const result = await this.generatePetSchedule(petId);
      if (!result.success) {
        throw new Error(result.error || '生成计划失败');
      }

      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: result.scheduleItems.length,
        vaccines: result.vaccineItems,
        deworm: result.dewormItems,
        upcoming: result.scheduleItems.filter(item => {
          const plannedDate = new Date(item.plannedDate);
          return plannedDate >= now && plannedDate <= futureDate;
        }).length,
        overdue: result.scheduleItems.filter(item => {
          const windowEnd = new Date(item.window.end);
          return windowEnd < now;
        }).length,
        highPriority: result.scheduleItems.filter(item => item.priority === 'high').length,
      };

      return {
        success: true,
        stats,
      };

    } catch (error) {
      console.error('获取计划统计失败:', error);
      return {
        success: false,
        stats: {
          total: 0,
          vaccines: 0,
          deworm: 0,
          upcoming: 0,
          overdue: 0,
          highPriority: 0,
        },
      };
    }
  }
}




