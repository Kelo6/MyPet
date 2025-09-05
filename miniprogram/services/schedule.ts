// 日程服务
/// <reference path="../typings/index.d.ts" />

import { Schedule, ScheduleStatus } from '../models/schedule';
import { StorageUtils, StorageKeys } from '../utils/storage';

export class ScheduleService {
  /**
   * 获取所有日程
   */
  static async getAllSchedules(): Promise<ApiResult<Schedule[]>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      return {
        code: 0,
        msg: '获取成功',
        data: schedules,
      };
    } catch (error) {
      console.error('获取日程列表失败:', error);
      return {
        code: -1,
        msg: '获取日程列表失败',
        data: [],
      };
    }
  }

  /**
   * 根据宠物ID获取日程
   */
  static async getSchedulesByPetId(
    petId: string
  ): Promise<ApiResult<Schedule[]>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      const petSchedules = schedules.filter(s => s.petId === petId);

      return {
        code: 0,
        msg: '获取成功',
        data: petSchedules,
      };
    } catch (error) {
      console.error('获取宠物日程失败:', error);
      return {
        code: -1,
        msg: '获取宠物日程失败',
        data: [],
      };
    }
  }

  /**
   * 根据ID获取日程
   */
  static async getScheduleById(
    id: string
  ): Promise<ApiResult<Schedule | null>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      const schedule = schedules.find(s => s.id === id);

      if (schedule) {
        return {
          code: 0,
          msg: '获取成功',
          data: schedule,
        };
      }

      return {
        code: -1,
        msg: '日程不存在',
        data: null,
      };
    } catch (error) {
      console.error('获取日程详情失败:', error);
      return {
        code: -1,
        msg: '获取日程详情失败',
        data: null,
      };
    }
  }

  /**
   * 添加日程
   */
  static async addSchedule(schedule: Schedule): Promise<ApiResult<Schedule>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      schedules.push(schedule);
      StorageUtils.set(StorageKeys.SCHEDULES, schedules);

      return {
        code: 0,
        msg: '添加成功',
        data: schedule,
      };
    } catch (error) {
      console.error('添加日程失败:', error);
      return {
        code: -1,
        msg: '添加日程失败',
        data: null,
      };
    }
  }

  /**
   * 更新日程
   */
  static async updateSchedule(
    schedule: Schedule
  ): Promise<ApiResult<Schedule>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      const index = schedules.findIndex(s => s.id === schedule.id);

      if (index === -1) {
        return {
          code: -1,
          msg: '日程不存在',
          data: null,
        };
      }

      schedules[index] = schedule;
      StorageUtils.set(StorageKeys.SCHEDULES, schedules);

      return {
        code: 0,
        msg: '更新成功',
        data: schedule,
      };
    } catch (error) {
      console.error('更新日程失败:', error);
      return {
        code: -1,
        msg: '更新日程失败',
        data: null,
      };
    }
  }

  /**
   * 完成日程
   */
  static async completeSchedule(
    id: string
  ): Promise<ApiResult<Schedule | null>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      const index = schedules.findIndex(s => s.id === id);

      if (index === -1) {
        return {
          code: -1,
          msg: '日程不存在',
          data: null,
        };
      }

      schedules[index] = {
        ...schedules[index],
        status: ScheduleStatus.COMPLETED,
        completedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      StorageUtils.set(StorageKeys.SCHEDULES, schedules);

      return {
        code: 0,
        msg: '完成成功',
        data: schedules[index],
      };
    } catch (error) {
      console.error('完成日程失败:', error);
      return {
        code: -1,
        msg: '完成日程失败',
        data: null,
      };
    }
  }

  /**
   * 删除日程
   */
  static async deleteSchedule(id: string): Promise<ApiResult<boolean>> {
    try {
      const schedules =
        StorageUtils.get<Schedule[]>(StorageKeys.SCHEDULES) || [];
      const filteredSchedules = schedules.filter(s => s.id !== id);

      if (filteredSchedules.length === schedules.length) {
        return {
          code: -1,
          msg: '日程不存在',
          data: false,
        };
      }

      StorageUtils.set(StorageKeys.SCHEDULES, filteredSchedules);

      return {
        code: 0,
        msg: '删除成功',
        data: true,
      };
    } catch (error) {
      console.error('删除日程失败:', error);
      return {
        code: -1,
        msg: '删除日程失败',
        data: false,
      };
    }
  }
}
