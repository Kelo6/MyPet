// 本地存储工具类
/// <reference path="../typings/index.d.ts" />

export class StorageUtils {
  /**
   * 存储数据到本地
   * @param key 存储键
   * @param data 存储数据
   */
  static set<T>(key: string, data: T): void {
    try {
      const jsonData = JSON.stringify(data);
      wx.setStorageSync(key, jsonData);
    } catch (error) {
      console.error('存储数据失败:', error);
    }
  }

  /**
   * 异步存储数据
   * @param key 存储键
   * @param data 存储数据
   */
  static async setAsync<T>(key: string, data: T): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await wx.setStorage({ key, data: jsonData });
    } catch (error) {
      console.error('异步存储数据失败:', error);
      throw error;
    }
  }

  /**
   * 从本地获取数据
   * @param key 存储键
   * @param defaultValue 默认值
   */
  static get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const data = wx.getStorageSync(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return defaultValue;
    } catch (error) {
      console.error('获取存储数据失败:', error);
      return defaultValue;
    }
  }

  /**
   * 异步获取数据
   * @param key 存储键
   * @param defaultValue 默认值
   */
  static async getAsync<T>(
    key: string,
    defaultValue?: T
  ): Promise<T | undefined> {
    try {
      const result = await wx.getStorage({ key });
      return JSON.parse(result.data) as T;
    } catch (error) {
      console.error('异步获取存储数据失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除存储数据
   * @param key 存储键
   */
  static remove(key: string): void {
    try {
      wx.removeStorageSync(key);
    } catch (error) {
      console.error('删除存储数据失败:', error);
    }
  }

  /**
   * 异步删除存储数据
   * @param key 存储键
   */
  static async removeAsync(key: string): Promise<void> {
    try {
      await wx.removeStorage({ key });
    } catch (error) {
      console.error('异步删除存储数据失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有存储数据
   */
  static clear(): void {
    try {
      wx.clearStorageSync();
    } catch (error) {
      console.error('清空存储数据失败:', error);
    }
  }

  /**
   * 异步清空所有存储数据
   */
  static async clearAsync(): Promise<void> {
    try {
      await wx.clearStorage();
    } catch (error) {
      console.error('异步清空存储数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储信息
   */
  static getInfo(): StorageInfo {
    try {
      return wx.getStorageInfoSync();
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return {
        keys: [],
        currentSize: 0,
        limitSize: 0,
      };
    }
  }

  /**
   * 检查键是否存在
   * @param key 存储键
   */
  static hasKey(key: string): boolean {
    try {
      const info = this.getInfo();
      return info.keys.includes(key);
    } catch (error) {
      console.error('检查键是否存在失败:', error);
      return false;
    }
  }
}

// 存储键常量
export const StorageKeys = {
  USER_INFO: 'user_info',
  PETS: 'pets',
  SCHEDULES: 'schedules',
  REMINDERS: 'reminders',
  USER_PREFERENCES: 'user_preferences',
  CACHE_KNOWLEDGE: 'cache_knowledge',
  LAST_SYNC_TIME: 'last_sync_time',
} as const;
