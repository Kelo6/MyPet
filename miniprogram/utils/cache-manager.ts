// 缓存管理器 - 统一管理本地存储和缓存策略
import { StorageKeys, CacheExpiration } from '../models/database';

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiration: number;
  version?: string;
}

/**
 * 缓存配置接口
 */
interface CacheConfig {
  maxSize?: number; // 最大缓存大小(KB)
  defaultExpiration?: number; // 默认过期时间(ms)
  enableEncryption?: boolean; // 是否启用加密
  compressionThreshold?: number; // 压缩阈值(KB)
}

/**
 * 缓存管理器类
 */
export class CacheManager {
  private static config: CacheConfig = {
    maxSize: 10 * 1024, // 10MB
    defaultExpiration: 24 * 60 * 60 * 1000, // 24小时
    enableEncryption: false,
    compressionThreshold: 100, // 100KB
  };

  /**
   * 初始化缓存管理器
   */
  static init(config?: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    this.cleanupExpiredCache();
  }

  /**
   * 设置缓存
   */
  static set<T>(
    key: string, 
    data: T, 
    expiration?: number,
    options?: { compress?: boolean; encrypt?: boolean }
  ): boolean {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiration: expiration || this.config.defaultExpiration!,
        version: this.getAppVersion(),
      };

      let serializedData = JSON.stringify(item);

      // 压缩大数据
      if (options?.compress || this.shouldCompress(serializedData)) {
        serializedData = this.compress(serializedData);
      }

      // 加密敏感数据
      if (options?.encrypt || this.config.enableEncryption) {
        serializedData = this.encrypt(serializedData);
      }

      wx.setStorageSync(key, serializedData);
      this.updateCacheIndex(key, serializedData.length);
      
      return true;
    } catch (error) {
      console.error(`缓存设置失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  static get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      let serializedData = wx.getStorageSync(key);
      if (!serializedData) {
        return defaultValue;
      }

      // 解密
      if (this.config.enableEncryption && this.isEncrypted(serializedData)) {
        serializedData = this.decrypt(serializedData);
      }

      // 解压缩
      if (this.isCompressed(serializedData)) {
        serializedData = this.decompress(serializedData);
      }

      const item: CacheItem<T> = JSON.parse(serializedData);

      // 检查版本兼容性
      if (item.version && item.version !== this.getAppVersion()) {
        this.remove(key);
        return defaultValue;
      }

      // 检查是否过期
      if (this.isExpired(item)) {
        this.remove(key);
        return defaultValue;
      }

      return item.data;
    } catch (error) {
      console.error(`缓存获取失败 [${key}]:`, error);
      this.remove(key);
      return defaultValue;
    }
  }

  /**
   * 检查缓存是否存在且未过期
   */
  static has(key: string): boolean {
    try {
      const data = wx.getStorageSync(key);
      if (!data) return false;

      const item: CacheItem<any> = JSON.parse(data);
      return !this.isExpired(item);
    } catch {
      return false;
    }
  }

  /**
   * 删除缓存
   */
  static remove(key: string): boolean {
    try {
      wx.removeStorageSync(key);
      this.removeCacheIndex(key);
      return true;
    } catch (error) {
      console.error(`缓存删除失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  static clear(): void {
    try {
      // 获取所有缓存键
      const cacheKeys = this.getAllCacheKeys();
      
      // 删除缓存数据
      cacheKeys.forEach(key => {
        wx.removeStorageSync(key);
      });

      // 清空缓存索引
      wx.removeStorageSync('cache_index');
      
      console.log(`已清空 ${cacheKeys.length} 项缓存`);
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  static cleanupExpiredCache(): void {
    try {
      const cacheKeys = this.getAllCacheKeys();
      let cleanedCount = 0;

      cacheKeys.forEach(key => {
        if (!this.has(key)) {
          this.remove(key);
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        console.log(`清理了 ${cleanedCount} 项过期缓存`);
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  static getStats(): {
    totalSize: number;
    itemCount: number;
    expiredCount: number;
    topKeys: Array<{ key: string; size: number }>;
  } {
    try {
      const cacheIndex = this.getCacheIndex();
      const stats = {
        totalSize: 0,
        itemCount: 0,
        expiredCount: 0,
        topKeys: [] as Array<{ key: string; size: number }>,
      };

      const keySizes: Array<{ key: string; size: number }> = [];

      Object.entries(cacheIndex).forEach(([key, size]) => {
        stats.totalSize += size as number;
        stats.itemCount++;
        keySizes.push({ key, size: size as number });

        if (!this.has(key)) {
          stats.expiredCount++;
        }
      });

      // 按大小排序获取TOP键
      stats.topKeys = keySizes
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);

      return stats;
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return { totalSize: 0, itemCount: 0, expiredCount: 0, topKeys: [] };
    }
  }

  /**
   * 刷新缓存
   */
  static async refresh<T>(
    key: string,
    refreshFn: () => Promise<T>,
    expiration?: number
  ): Promise<T> {
    try {
      const data = await refreshFn();
      this.set(key, data, expiration);
      return data;
    } catch (error) {
      console.error(`缓存刷新失败 [${key}]:`, error);
      // 返回旧缓存数据作为降级
      return this.get<T>(key) as T;
    }
  }

  /**
   * 批量操作
   */
  static batch(): CacheBatch {
    return new CacheBatch();
  }

  // ==================== 私有方法 ====================

  /**
   * 检查是否过期
   */
  private static isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.expiration;
  }

  /**
   * 判断是否需要压缩
   */
  private static shouldCompress(data: string): boolean {
    return data.length > (this.config.compressionThreshold! * 1024);
  }

  /**
   * 压缩数据(简单模拟)
   */
  private static compress(data: string): string {
    // 实际项目中可以使用 LZ-string 等压缩库
    try {
      // 简单的编码作为压缩的替代
      return `compressed:${this.simpleEncode(data)}`;
    } catch {
      return data;
    }
  }

  /**
   * 解压缩数据
   */
  private static decompress(data: string): string {
    if (this.isCompressed(data)) {
      try {
        const encoded = data.replace('compressed:', '');
        return this.simpleDecode(encoded);
      } catch {
        return data;
      }
    }
    return data;
  }

  /**
   * 检查是否为压缩数据
   */
  private static isCompressed(data: string): boolean {
    return data.startsWith('compressed:');
  }

  /**
   * 加密数据(简单模拟)
   */
  private static encrypt(data: string): string {
    // 实际项目中应使用真正的加密算法
    try {
      return `encrypted:${this.simpleEncode(data)}`;
    } catch {
      return data;
    }
  }

  /**
   * 解密数据
   */
  private static decrypt(data: string): string {
    if (this.isEncrypted(data)) {
      try {
        const encoded = data.replace('encrypted:', '');
        return this.simpleDecode(encoded);
      } catch {
        return data;
      }
    }
    return data;
  }

  /**
   * 简单编码(兼容小程序环境)
   */
  private static simpleEncode(data: string): string {
    // 使用简单的字符转换作为编码
    return data.split('').map(char => char.charCodeAt(0).toString(16)).join('-');
  }

  /**
   * 简单解码(兼容小程序环境)
   */
  private static simpleDecode(data: string): string {
    try {
      return data.split('-').map(hex => String.fromCharCode(parseInt(hex, 16))).join('');
    } catch {
      return data;
    }
  }

  /**
   * 检查是否为加密数据
   */
  private static isEncrypted(data: string): boolean {
    return data.startsWith('encrypted:');
  }

  /**
   * 获取应用版本
   */
  private static getAppVersion(): string {
    return wx.getStorageSync('app_version') || '1.0.0';
  }

  /**
   * 更新缓存索引
   */
  private static updateCacheIndex(key: string, size: number): void {
    try {
      const index = this.getCacheIndex();
      index[key] = size;
      wx.setStorageSync('cache_index', index);
    } catch (error) {
      console.error('更新缓存索引失败:', error);
    }
  }

  /**
   * 删除缓存索引项
   */
  private static removeCacheIndex(key: string): void {
    try {
      const index = this.getCacheIndex();
      delete index[key];
      wx.setStorageSync('cache_index', index);
    } catch (error) {
      console.error('删除缓存索引失败:', error);
    }
  }

  /**
   * 获取缓存索引
   */
  private static getCacheIndex(): Record<string, number> {
    try {
      return wx.getStorageSync('cache_index') || {};
    } catch {
      return {};
    }
  }

  /**
   * 获取所有缓存键
   */
  private static getAllCacheKeys(): string[] {
    try {
      return Object.keys(this.getCacheIndex());
    } catch {
      return [];
    }
  }
}

/**
 * 批量缓存操作类
 */
export class CacheBatch {
  private operations: Array<() => void> = [];

  set<T>(key: string, data: T, expiration?: number): this {
    this.operations.push(() => CacheManager.set(key, data, expiration));
    return this;
  }

  remove(key: string): this {
    this.operations.push(() => CacheManager.remove(key));
    return this;
  }

  execute(): boolean {
    try {
      this.operations.forEach(op => op());
      return true;
    } catch (error) {
      console.error('批量缓存操作失败:', error);
      return false;
    }
  }
}

/**
 * 预定义的缓存策略
 */
export const CacheStrategies = {
  /**
   * 用户数据缓存策略
   */
  userData: {
    expiration: CacheExpiration.USER_INFO,
    encrypt: true,
  },

  /**
   * 宠物数据缓存策略
   */
  petData: {
    expiration: CacheExpiration.PETS,
    compress: true,
  },

  /**
   * 记录数据缓存策略
   */
  recordData: {
    expiration: CacheExpiration.RECORDS,
    compress: true,
  },

  /**
   * 提醒数据缓存策略
   */
  reminderData: {
    expiration: CacheExpiration.REMINDERS,
  },

  /**
   * 知识库缓存策略
   */
  knowledgeData: {
    expiration: CacheExpiration.KNOWLEDGE,
    compress: true,
  },

  /**
   * 设置数据缓存策略
   */
  settingsData: {
    expiration: CacheExpiration.SETTINGS,
    encrypt: true,
  },
};

/**
 * 缓存工具函数
 */
export const cacheUtils = {
  /**
   * 设置用户缓存
   */
  setUserCache: <T>(key: string, data: T) => 
    CacheManager.set(key, data, CacheStrategies.userData.expiration, { encrypt: true }),

  /**
   * 设置宠物缓存
   */
  setPetCache: <T>(key: string, data: T) => 
    CacheManager.set(key, data, CacheStrategies.petData.expiration, { compress: true }),

  /**
   * 设置知识库缓存
   */
  setKnowledgeCache: <T>(key: string, data: T) => 
    CacheManager.set(key, data, CacheStrategies.knowledgeData.expiration, { compress: true }),

  /**
   * 获取带降级的缓存
   */
  getWithFallback: <T>(key: string, fallbackFn: () => T): T => {
    const cached = CacheManager.get<T>(key);
    return cached !== undefined ? cached : fallbackFn();
  },
};
