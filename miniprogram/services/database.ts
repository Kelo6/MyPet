// 数据库服务 - 支持云开发和本地存储的统一接口
import { 
  User, Pet, VaccineRecord, DewormRecord, Reminder, Knowledge, Settings,
  Collections, StorageKeys, CacheExpiration 
} from '../models/database';
import { UserSubscription, MessageSendRecord } from '../models/subscription';

/**
 * 数据库操作结果接口
 */
interface DBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

/**
 * 查询条件接口
 */
interface QueryCondition {
  [key: string]: any;
}

/**
 * 分页参数接口
 */
interface PaginationOptions {
  limit?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * 数据库服务类 - 统一的数据访问层
 */
export class DatabaseService {
  private static useCloud = false; // 是否使用云开发
  
  /**
   * 初始化数据库服务
   */
  static init(useCloudDB: boolean = false) {
    this.useCloud = useCloudDB && !!wx.cloud;
    console.log(`数据库服务初始化: ${this.useCloud ? '云开发' : '本地存储'}`);
  }

  /**
   * 获取云数据库实例
   */
  private static getCloudDB() {
    if (!wx.cloud) {
      throw new Error('云开发未初始化');
    }
    return wx.cloud.database();
  }

  /**
   * 检查是否启用云开发
   */
  static isCloudEnabled(): boolean {
    return this.useCloud && !!wx.cloud;
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 检查缓存是否过期
   */
  private static isCacheExpired(cacheKey: string, expiration: number): boolean {
    try {
      const timestamp = wx.getStorageSync(`${cacheKey}_timestamp`);
      if (!timestamp) return true;
      return Date.now() - timestamp > expiration;
    } catch {
      return true;
    }
  }

  /**
   * 设置缓存时间戳
   */
  private static setCacheTimestamp(cacheKey: string): void {
    try {
      wx.setStorageSync(`${cacheKey}_timestamp`, Date.now());
    } catch (error) {
      console.error('设置缓存时间戳失败:', error);
    }
  }

  // ==================== 用户相关操作 ====================

  /**
   * 创建或更新用户
   */
  static async saveUser(user: Omit<User, '_id' | 'createdAt'> & { _id?: string }): Promise<DBResult<User>> {
    const now = new Date().toISOString();
    const userData: User = {
      _id: user._id || this.generateId(),
      ...user,
      createdAt: user._id ? (await this.getUserById(user._id)).data?.createdAt || now : now,
      updatedAt: now,
    };

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        if (user._id) {
          await db.collection(Collections.USERS).doc(user._id).update({
            data: { ...userData, updatedAt: now }
          });
        } else {
          await db.collection(Collections.USERS).add({ data: userData });
        }
        return { success: true, data: userData };
      } catch (error) {
        console.error('云端保存用户失败:', error);
        return { success: false, error: '保存用户失败' };
      }
    } else {
      try {
        const users = wx.getStorageSync(StorageKeys.USER_INFO) || [];
        const existingIndex = users.findIndex((u: User) => u._id === userData._id);
        
        if (existingIndex >= 0) {
          users[existingIndex] = userData;
        } else {
          users.push(userData);
        }
        
        wx.setStorageSync(StorageKeys.USER_INFO, userData);
        this.setCacheTimestamp(StorageKeys.USER_INFO);
        return { success: true, data: userData };
      } catch (error) {
        console.error('本地保存用户失败:', error);
        return { success: false, error: '保存用户失败' };
      }
    }
  }

  /**
   * 根据ID获取用户
   */
  static async getUserById(userId: string): Promise<DBResult<User>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.USERS).doc(userId).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as User };
        }
        return { success: false, error: '用户不存在' };
      } catch (error) {
        console.error('云端获取用户失败:', error);
        return { success: false, error: '获取用户失败' };
      }
    } else {
      try {
        const userData = wx.getStorageSync(StorageKeys.USER_INFO);
        if (userData && userData._id === userId) {
          return { success: true, data: userData };
        }
        return { success: false, error: '用户不存在' };
      } catch (error) {
        console.error('本地获取用户失败:', error);
        return { success: false, error: '获取用户失败' };
      }
    }
  }

  /**
   * 根据openid获取用户
   */
  static async getUserByOpenid(openid: string): Promise<DBResult<User>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.USERS).where({ openid }).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as User };
        }
        return { success: false, error: '用户不存在' };
      } catch (error) {
        console.error('云端获取用户失败:', error);
        return { success: false, error: '获取用户失败' };
      }
    } else {
      try {
        const userData = wx.getStorageSync(StorageKeys.USER_INFO);
        if (userData && userData.openid === openid) {
          return { success: true, data: userData };
        }
        return { success: false, error: '用户不存在' };
      } catch (error) {
        console.error('本地获取用户失败:', error);
        return { success: false, error: '获取用户失败' };
      }
    }
  }

  // ==================== 宠物相关操作 ====================

  /**
   * 保存宠物信息
   */
  static async savePet(pet: Omit<Pet, '_id' | 'createdAt'> & { _id?: string }): Promise<DBResult<Pet>> {
    const now = new Date().toISOString();
    const petData: Pet = {
      _id: pet._id || this.generateId(),
      ...pet,
      createdAt: pet._id ? (await this.getPetById(pet._id)).data?.createdAt || now : now,
      updatedAt: now,
    };

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        if (pet._id) {
          await db.collection(Collections.PETS).doc(pet._id).update({
            data: { ...petData, updatedAt: now }
          });
        } else {
          await db.collection(Collections.PETS).add({ data: petData });
        }
        
        // 清除本地缓存
        wx.removeStorageSync(StorageKeys.PETS_CACHE);
        return { success: true, data: petData };
      } catch (error) {
        console.error('云端保存宠物失败:', error);
        return { success: false, error: '保存宠物失败' };
      }
    } else {
      try {
        const pets = wx.getStorageSync(StorageKeys.PETS) || [];
        const existingIndex = pets.findIndex((p: Pet) => p._id === petData._id);
        
        if (existingIndex >= 0) {
          pets[existingIndex] = petData;
        } else {
          pets.push(petData);
        }
        
        wx.setStorageSync(StorageKeys.PETS, pets);
        this.setCacheTimestamp(StorageKeys.PETS);
        return { success: true, data: petData };
      } catch (error) {
        console.error('本地保存宠物失败:', error);
        return { success: false, error: '保存宠物失败' };
      }
    }
  }

  /**
   * 获取用户的所有宠物
   */
  static async getPetsByUserId(userId: string, useCache: boolean = true): Promise<DBResult<Pet[]>> {
    // 检查本地缓存
    if (useCache && !this.isCacheExpired(StorageKeys.PETS_CACHE, CacheExpiration.PETS)) {
      try {
        const cachedPets = wx.getStorageSync(StorageKeys.PETS_CACHE);
        if (cachedPets && Array.isArray(cachedPets)) {
          return { success: true, data: cachedPets };
        }
      } catch (error) {
        console.error('读取宠物缓存失败:', error);
      }
    }

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.PETS)
          .where({ userId })
          .orderBy('createdAt', 'desc')
          .get();
        
        const pets = result.data as Pet[];
        
        // 缓存到本地
        wx.setStorageSync(StorageKeys.PETS_CACHE, pets);
        this.setCacheTimestamp(StorageKeys.PETS_CACHE);
        
        return { success: true, data: pets };
      } catch (error) {
        console.error('云端获取宠物失败:', error);
        return { success: false, error: '获取宠物失败' };
      }
    } else {
      try {
        const pets = wx.getStorageSync(StorageKeys.PETS) || [];
        const userPets = pets.filter((pet: Pet) => pet.userId === userId);
        return { success: true, data: userPets };
      } catch (error) {
        console.error('本地获取宠物失败:', error);
        return { success: false, error: '获取宠物失败' };
      }
    }
  }

  /**
   * 根据ID获取宠物
   */
  static async getPetById(petId: string): Promise<DBResult<Pet>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.PETS).doc(petId).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as Pet };
        }
        return { success: false, error: '宠物不存在' };
      } catch (error) {
        console.error('云端获取宠物失败:', error);
        return { success: false, error: '获取宠物失败' };
      }
    } else {
      try {
        const pets = wx.getStorageSync(StorageKeys.PETS) || [];
        const pet = pets.find((p: Pet) => p._id === petId);
        if (pet) {
          return { success: true, data: pet };
        }
        return { success: false, error: '宠物不存在' };
      } catch (error) {
        console.error('本地获取宠物失败:', error);
        return { success: false, error: '获取宠物失败' };
      }
    }
  }

  /**
   * 删除宠物
   */
  static async deletePet(petId: string): Promise<DBResult<boolean>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        await db.collection(Collections.PETS).doc(petId).remove();
        
        // 同时删除相关记录
        const vaccineRecords = await db.collection(Collections.VACCINE_RECORDS).where({ petId }).get();
        for (const record of vaccineRecords.data) {
          if (record._id) {
            await db.collection(Collections.VACCINE_RECORDS).doc(record._id as string).remove();
          }
        }
        
        const dewormRecords = await db.collection(Collections.DEWORM_RECORDS).where({ petId }).get();
        for (const record of dewormRecords.data) {
          if (record._id) {
            await db.collection(Collections.DEWORM_RECORDS).doc(record._id as string).remove();
          }
        }
        
        const reminders = await db.collection(Collections.REMINDERS).where({ petId }).get();
        for (const reminder of reminders.data) {
          if (reminder._id) {
            await db.collection(Collections.REMINDERS).doc(reminder._id as string).remove();
          }
        }
        
        // 清除缓存
        wx.removeStorageSync(StorageKeys.PETS_CACHE);
        return { success: true, data: true };
      } catch (error) {
        console.error('云端删除宠物失败:', error);
        return { success: false, error: '删除宠物失败' };
      }
    } else {
      try {
        const pets = wx.getStorageSync(StorageKeys.PETS) || [];
        const filteredPets = pets.filter((p: Pet) => p._id !== petId);
        wx.setStorageSync(StorageKeys.PETS, filteredPets);
        
        // 删除相关记录
        const vaccines = wx.getStorageSync(StorageKeys.VACCINE_RECORDS) || [];
        const filteredVaccines = vaccines.filter((v: VaccineRecord) => v.petId !== petId);
        wx.setStorageSync(StorageKeys.VACCINE_RECORDS, filteredVaccines);
        
        const deworns = wx.getStorageSync(StorageKeys.DEWORM_RECORDS) || [];
        const filteredDeworns = deworns.filter((d: DewormRecord) => d.petId !== petId);
        wx.setStorageSync(StorageKeys.DEWORM_RECORDS, filteredDeworns);
        
        const reminders = wx.getStorageSync(StorageKeys.REMINDERS) || [];
        const filteredReminders = reminders.filter((r: Reminder) => r.petId !== petId);
        wx.setStorageSync(StorageKeys.REMINDERS, filteredReminders);
        
        return { success: true, data: true };
      } catch (error) {
        console.error('本地删除宠物失败:', error);
        return { success: false, error: '删除宠物失败' };
      }
    }
  }

  // ==================== 疫苗记录相关操作 ====================

  /**
   * 保存疫苗记录
   */
  static async saveVaccineRecord(record: Omit<VaccineRecord, '_id' | 'createdAt'> & { _id?: string }): Promise<DBResult<VaccineRecord>> {
    const now = new Date().toISOString();
    const recordData: VaccineRecord = {
      _id: record._id || this.generateId(),
      ...record,
      createdAt: record._id ? (await this.getVaccineRecordById(record._id)).data?.createdAt || now : now,
      updatedAt: now,
    };

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        if (record._id) {
          await db.collection(Collections.VACCINE_RECORDS).doc(record._id).update({
            data: { ...recordData, updatedAt: now }
          });
        } else {
          await db.collection(Collections.VACCINE_RECORDS).add({ data: recordData });
        }
        return { success: true, data: recordData };
      } catch (error) {
        console.error('云端保存疫苗记录失败:', error);
        return { success: false, error: '保存疫苗记录失败' };
      }
    } else {
      try {
        const records = wx.getStorageSync(StorageKeys.VACCINE_RECORDS) || [];
        const existingIndex = records.findIndex((r: VaccineRecord) => r._id === recordData._id);
        
        if (existingIndex >= 0) {
          records[existingIndex] = recordData;
        } else {
          records.push(recordData);
        }
        
        wx.setStorageSync(StorageKeys.VACCINE_RECORDS, records);
        return { success: true, data: recordData };
      } catch (error) {
        console.error('本地保存疫苗记录失败:', error);
        return { success: false, error: '保存疫苗记录失败' };
      }
    }
  }

  /**
   * 获取宠物的疫苗记录
   */
  static async getVaccineRecordsByPetId(petId: string): Promise<DBResult<VaccineRecord[]>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.VACCINE_RECORDS)
          .where({ petId })
          .orderBy('plannedDate', 'desc')
          .get();
        return { success: true, data: result.data as VaccineRecord[] };
      } catch (error) {
        console.error('云端获取疫苗记录失败:', error);
        return { success: false, error: '获取疫苗记录失败' };
      }
    } else {
      try {
        const records = wx.getStorageSync(StorageKeys.VACCINE_RECORDS) || [];
        const petRecords = records.filter((r: VaccineRecord) => r.petId === petId);
        return { success: true, data: petRecords };
      } catch (error) {
        console.error('本地获取疫苗记录失败:', error);
        return { success: false, error: '获取疫苗记录失败' };
      }
    }
  }

  /**
   * 根据ID获取疫苗记录
   */
  static async getVaccineRecordById(recordId: string): Promise<DBResult<VaccineRecord>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.VACCINE_RECORDS).doc(recordId).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as VaccineRecord };
        }
        return { success: false, error: '疫苗记录不存在' };
      } catch (error) {
        console.error('云端获取疫苗记录失败:', error);
        return { success: false, error: '获取疫苗记录失败' };
      }
    } else {
      try {
        const records = wx.getStorageSync(StorageKeys.VACCINE_RECORDS) || [];
        const record = records.find((r: VaccineRecord) => r._id === recordId);
        if (record) {
          return { success: true, data: record };
        }
        return { success: false, error: '疫苗记录不存在' };
      } catch (error) {
        console.error('本地获取疫苗记录失败:', error);
        return { success: false, error: '获取疫苗记录失败' };
      }
    }
  }

  // ==================== 驱虫记录相关操作 ====================

  /**
   * 保存驱虫记录
   */
  static async saveDewormRecord(record: Omit<DewormRecord, '_id' | 'createdAt'> & { _id?: string }): Promise<DBResult<DewormRecord>> {
    const now = new Date().toISOString();
    const recordData: DewormRecord = {
      _id: record._id || this.generateId(),
      ...record,
      createdAt: record._id ? (await this.getDewormRecordById(record._id)).data?.createdAt || now : now,
      updatedAt: now,
    };

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        if (record._id) {
          await db.collection(Collections.DEWORM_RECORDS).doc(record._id).update({
            data: { ...recordData, updatedAt: now }
          });
        } else {
          await db.collection(Collections.DEWORM_RECORDS).add({ data: recordData });
        }
        return { success: true, data: recordData };
      } catch (error) {
        console.error('云端保存驱虫记录失败:', error);
        return { success: false, error: '保存驱虫记录失败' };
      }
    } else {
      try {
        const records = wx.getStorageSync(StorageKeys.DEWORM_RECORDS) || [];
        const existingIndex = records.findIndex((r: DewormRecord) => r._id === recordData._id);
        
        if (existingIndex >= 0) {
          records[existingIndex] = recordData;
        } else {
          records.push(recordData);
        }
        
        wx.setStorageSync(StorageKeys.DEWORM_RECORDS, records);
        return { success: true, data: recordData };
      } catch (error) {
        console.error('本地保存驱虫记录失败:', error);
        return { success: false, error: '保存驱虫记录失败' };
      }
    }
  }

  /**
   * 获取宠物的驱虫记录
   */
  static async getDewormRecordsByPetId(petId: string): Promise<DBResult<DewormRecord[]>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.DEWORM_RECORDS)
          .where({ petId })
          .orderBy('plannedDate', 'desc')
          .get();
        return { success: true, data: result.data as DewormRecord[] };
      } catch (error) {
        console.error('云端获取驱虫记录失败:', error);
        return { success: false, error: '获取驱虫记录失败' };
      }
    } else {
      try {
        const records = wx.getStorageSync(StorageKeys.DEWORM_RECORDS) || [];
        const petRecords = records.filter((r: DewormRecord) => r.petId === petId);
        return { success: true, data: petRecords };
      } catch (error) {
        console.error('本地获取驱虫记录失败:', error);
        return { success: false, error: '获取驱虫记录失败' };
      }
    }
  }

  /**
   * 根据ID获取驱虫记录
   */
  static async getDewormRecordById(recordId: string): Promise<DBResult<DewormRecord>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.DEWORM_RECORDS).doc(recordId).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as DewormRecord };
        }
        return { success: false, error: '驱虫记录不存在' };
      } catch (error) {
        console.error('云端获取驱虫记录失败:', error);
        return { success: false, error: '获取驱虫记录失败' };
      }
    } else {
      try {
        const records = wx.getStorageSync(StorageKeys.DEWORM_RECORDS) || [];
        const record = records.find((r: DewormRecord) => r._id === recordId);
        if (record) {
          return { success: true, data: record };
        }
        return { success: false, error: '驱虫记录不存在' };
      } catch (error) {
        console.error('本地获取驱虫记录失败:', error);
        return { success: false, error: '获取驱虫记录失败' };
      }
    }
  }

  // ==================== 提醒相关操作 ====================

  /**
   * 保存提醒
   */
  static async saveReminder(reminder: Omit<Reminder, '_id' | 'createdAt'> & { _id?: string }): Promise<DBResult<Reminder>> {
    const now = new Date().toISOString();
    const reminderData: Reminder = {
      _id: reminder._id || this.generateId(),
      ...reminder,
      createdAt: reminder._id ? (await this.getReminderById(reminder._id)).data?.createdAt || now : now,
      updatedAt: now,
    };

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        if (reminder._id) {
          await db.collection(Collections.REMINDERS).doc(reminder._id).update({
            data: { ...reminderData, updatedAt: now }
          });
        } else {
          await db.collection(Collections.REMINDERS).add({ data: reminderData });
        }
        return { success: true, data: reminderData };
      } catch (error) {
        console.error('云端保存提醒失败:', error);
        return { success: false, error: '保存提醒失败' };
      }
    } else {
      try {
        const reminders = wx.getStorageSync(StorageKeys.REMINDERS) || [];
        const existingIndex = reminders.findIndex((r: Reminder) => r._id === reminderData._id);
        
        if (existingIndex >= 0) {
          reminders[existingIndex] = reminderData;
        } else {
          reminders.push(reminderData);
        }
        
        wx.setStorageSync(StorageKeys.REMINDERS, reminders);
        return { success: true, data: reminderData };
      } catch (error) {
        console.error('本地保存提醒失败:', error);
        return { success: false, error: '保存提醒失败' };
      }
    }
  }

  /**
   * 获取用户的所有提醒
   */
  static async getRemindersByUserId(userId: string): Promise<DBResult<Reminder[]>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.REMINDERS)
          .where({ userId })
          .orderBy('fireAt', 'asc')
          .get();
        return { success: true, data: result.data as Reminder[] };
      } catch (error) {
        console.error('云端获取提醒失败:', error);
        return { success: false, error: '获取提醒失败' };
      }
    } else {
      try {
        const reminders = wx.getStorageSync(StorageKeys.REMINDERS) || [];
        const userReminders = reminders.filter((r: Reminder) => r.userId === userId);
        return { success: true, data: userReminders };
      } catch (error) {
        console.error('本地获取提醒失败:', error);
        return { success: false, error: '获取提醒失败' };
      }
    }
  }

  /**
   * 根据ID获取提醒
   */
  static async getReminderById(reminderId: string): Promise<DBResult<Reminder>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.REMINDERS).doc(reminderId).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as Reminder };
        }
        return { success: false, error: '提醒不存在' };
      } catch (error) {
        console.error('云端获取提醒失败:', error);
        return { success: false, error: '获取提醒失败' };
      }
    } else {
      try {
        const reminders = wx.getStorageSync(StorageKeys.REMINDERS) || [];
        const reminder = reminders.find((r: Reminder) => r._id === reminderId);
        if (reminder) {
          return { success: true, data: reminder };
        }
        return { success: false, error: '提醒不存在' };
      } catch (error) {
        console.error('本地获取提醒失败:', error);
        return { success: false, error: '获取提醒失败' };
      }
    }
  }

  // ==================== 知识库相关操作 ====================

  /**
   * 获取知识库文章列表
   */
  static async getKnowledgeList(category?: string, useCache: boolean = true): Promise<DBResult<Knowledge[]>> {
    // 检查缓存
    if (useCache && !this.isCacheExpired(StorageKeys.KNOWLEDGE_CACHE, CacheExpiration.KNOWLEDGE)) {
      try {
        const cached = wx.getStorageSync(StorageKeys.KNOWLEDGE_CACHE);
        if (cached && Array.isArray(cached)) {
          const filtered = category ? cached.filter((k: Knowledge) => k.category === category) : cached;
          return { success: true, data: filtered };
        }
      } catch (error) {
        console.error('读取知识库缓存失败:', error);
      }
    }

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        let query = db.collection(Collections.KNOWLEDGE).where({ isPublished: true });
        
        if (category) {
          query = query.where({ category });
        }
        
        const result = await query.orderBy('updatedAt', 'desc').get();
        const articles = result.data as Knowledge[];
        
        // 缓存结果
        wx.setStorageSync(StorageKeys.KNOWLEDGE_CACHE, articles);
        this.setCacheTimestamp(StorageKeys.KNOWLEDGE_CACHE);
        
        return { success: true, data: articles };
      } catch (error) {
        console.error('云端获取知识库失败:', error);
        return { success: false, error: '获取知识库失败' };
      }
    } else {
      // 本地模拟数据
      const mockData = this.getMockKnowledgeData();
      const filtered = category ? mockData.filter(k => k.category === category) : mockData;
      return { success: true, data: filtered };
    }
  }

  /**
   * 根据ID获取知识库文章
   */
  static async getKnowledgeById(articleId: string): Promise<DBResult<Knowledge>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.KNOWLEDGE).doc(articleId).get();
        if (result.data.length > 0) {
          // 增加阅读次数
          const article = result.data[0] as Knowledge;
          await db.collection(Collections.KNOWLEDGE).doc(articleId).update({
            data: { viewCount: (article.viewCount || 0) + 1 }
          });
          return { success: true, data: { ...article, viewCount: (article.viewCount || 0) + 1 } };
        }
        return { success: false, error: '文章不存在' };
      } catch (error) {
        console.error('云端获取文章失败:', error);
        return { success: false, error: '获取文章失败' };
      }
    } else {
      const mockData = this.getMockKnowledgeData();
      const article = mockData.find(k => k._id === articleId);
      if (article) {
        return { success: true, data: article };
      }
      return { success: false, error: '文章不存在' };
    }
  }

  // ==================== 设置相关操作 ====================

  /**
   * 保存用户设置
   */
  static async saveSettings(settings: Omit<Settings, '_id' | 'createdAt'> & { _id?: string }): Promise<DBResult<Settings>> {
    const now = new Date().toISOString();
    const settingsData: Settings = {
      _id: settings._id || this.generateId(),
      ...settings,
      createdAt: settings._id ? (await this.getSettingsByUserId(settings.userId)).data?.createdAt || now : now,
      updatedAt: now,
    };

    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        if (settings._id) {
          await db.collection(Collections.SETTINGS).doc(settings._id).update({
            data: { ...settingsData, updatedAt: now }
          });
        } else {
          await db.collection(Collections.SETTINGS).add({ data: settingsData });
        }
        return { success: true, data: settingsData };
      } catch (error) {
        console.error('云端保存设置失败:', error);
        return { success: false, error: '保存设置失败' };
      }
    } else {
      try {
        wx.setStorageSync(StorageKeys.USER_SETTINGS, settingsData);
        return { success: true, data: settingsData };
      } catch (error) {
        console.error('本地保存设置失败:', error);
        return { success: false, error: '保存设置失败' };
      }
    }
  }

  /**
   * 获取用户设置
   */
  static async getSettingsByUserId(userId: string): Promise<DBResult<Settings>> {
    if (this.useCloud) {
      try {
        const db = this.getCloudDB();
        const result = await db.collection(Collections.SETTINGS).where({ userId }).get();
        if (result.data.length > 0) {
          return { success: true, data: result.data[0] as Settings };
        }
        return { success: false, error: '设置不存在' };
      } catch (error) {
        console.error('云端获取设置失败:', error);
        return { success: false, error: '获取设置失败' };
      }
    } else {
      try {
        const settings = wx.getStorageSync(StorageKeys.USER_SETTINGS);
        if (settings && settings.userId === userId) {
          return { success: true, data: settings };
        }
        return { success: false, error: '设置不存在' };
      } catch (error) {
        console.error('本地获取设置失败:', error);
        return { success: false, error: '获取设置失败' };
      }
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取模拟知识库数据
   */
  private static getMockKnowledgeData(): Knowledge[] {
    return [
      {
        _id: 'knowledge_1',
        slug: 'dog-vaccine-basic',
        title: '狗狗疫苗基础知识',
        category: 'vaccine',
        summary: '了解狗狗疫苗的基本概念、重要性和接种时间',
        contentMD: '# 狗狗疫苗基础知识\n\n疫苗是预防狗狗疾病的重要手段...',
        tags: ['疫苗', '狗狗', '基础知识'],
        readTime: 5,
        viewCount: 150,
        isPublished: true,
        author: '宠物专家',
        coverImage: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        _id: 'knowledge_2',
        slug: 'cat-deworm-guide',
        title: '猫咪驱虫完全指南',
        category: 'deworm',
        summary: '猫咪内外驱虫的完整指南，包括时间安排和药物选择',
        contentMD: '# 猫咪驱虫完全指南\n\n定期驱虫是保证猫咪健康的重要措施...',
        tags: ['驱虫', '猫咪', '指南'],
        readTime: 8,
        viewCount: 89,
        isPublished: true,
        author: '兽医师',
        coverImage: '',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];
  }

  // ================== 订阅消息相关方法 ==================

  /**
   * 保存用户订阅记录
   */
  static async saveUserSubscription(subscription: UserSubscription): Promise<DBResult<UserSubscription>> {
    try {
      if (DatabaseService.isCloudEnabled()) {
        const db = wx.cloud.database();
        const collection = db.collection('user_subscriptions');
        
        if (subscription._id) {
          // 更新
          await collection.doc(subscription._id).update({
            data: {
              ...subscription,
              updatedAt: new Date().toISOString(),
            }
          });
        } else {
          // 新增
          const result = await collection.add({
            data: {
              ...subscription,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          });
          subscription._id = result._id as string;
        }
        
        return { success: true, data: subscription };
      } else {
        // 本地存储
        const key = `user_subscription_${subscription.userId}_${subscription.templateId}`;
        const subscriptionWithId = {
          ...subscription,
          _id: subscription._id || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date().toISOString(),
        };
        
        wx.setStorageSync(key, subscriptionWithId);
        return { success: true, data: subscriptionWithId };
      }
    } catch (error) {
      console.error('保存用户订阅失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取用户订阅记录
   */
  static async getUserSubscription(userId: string, templateId: string): Promise<DBResult<UserSubscription>> {
    try {
      if (DatabaseService.isCloudEnabled()) {
        const db = wx.cloud.database();
        const result = await db.collection('user_subscriptions')
          .where({
            userId: userId,
            templateId: templateId,
          })
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        
        const subscription = result.data[0] as UserSubscription;
        return { success: true, data: subscription };
      } else {
        // 本地存储
        const key = `user_subscription_${userId}_${templateId}`;
        const subscription = wx.getStorageSync(key) as UserSubscription;
        return { success: true, data: subscription };
      }
    } catch (error) {
      console.error('获取用户订阅失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取用户所有订阅记录
   */
  static async getUserSubscriptions(userId: string): Promise<DBResult<UserSubscription[]>> {
    try {
      if (DatabaseService.isCloudEnabled()) {
        const db = wx.cloud.database();
        const result = await db.collection('user_subscriptions')
          .where({
            userId: userId,
          })
          .orderBy('createdAt', 'desc')
          .get();
        
        return { success: true, data: result.data as UserSubscription[] };
      } else {
        // 本地存储 - 需要遍历所有相关键
        const subscriptions: UserSubscription[] = [];
        try {
          const info = wx.getStorageInfoSync();
          const keys = info.keys.filter(key => 
            key.startsWith(`user_subscription_${userId}_`)
          );
          
          for (const key of keys) {
            try {
              const subscription = wx.getStorageSync(key) as UserSubscription;
              if (subscription) {
                subscriptions.push(subscription);
              }
            } catch (e) {
              console.warn('读取订阅记录失败:', key, e);
            }
          }
        } catch (e) {
          console.warn('获取存储信息失败:', e);
        }
        
        return { success: true, data: subscriptions };
      }
    } catch (error) {
      console.error('获取用户订阅列表失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 保存消息发送记录
   */
  static async saveMessageSendRecord(record: MessageSendRecord): Promise<DBResult<MessageSendRecord>> {
    try {
      if (DatabaseService.isCloudEnabled()) {
        const db = wx.cloud.database();
        const collection = db.collection('message_send_records');
        
        if (record._id) {
          // 更新
          await collection.doc(record._id).update({
            data: {
              ...record,
              updatedAt: new Date().toISOString(),
            }
          });
        } else {
          // 新增
          const result = await collection.add({
            data: {
              ...record,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          });
          record._id = result._id as string;
        }
        
        return { success: true, data: record };
      } else {
        // 本地存储
        const recordWithId = {
          ...record,
          _id: record._id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date().toISOString(),
        };
        
        const key = `message_record_${recordWithId._id}`;
        wx.setStorageSync(key, recordWithId);
        return { success: true, data: recordWithId };
      }
    } catch (error) {
      console.error('保存消息发送记录失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * 获取待发送的消息记录
   */
  static async getPendingMessageRecords(): Promise<DBResult<MessageSendRecord[]>> {
    try {
      if (DatabaseService.isCloudEnabled()) {
        const db = wx.cloud.database();
        const result = await db.collection('message_send_records')
          .where({
            status: 'pending',
          })
          .orderBy('createdAt', 'asc')
          .get();
        
        return { success: true, data: result.data as MessageSendRecord[] };
      } else {
        // 本地存储模拟
        const records: MessageSendRecord[] = [];
        try {
          const info = wx.getStorageInfoSync();
          const keys = info.keys.filter(key => key.startsWith('message_record_'));
          
          for (const key of keys) {
            try {
              const record = wx.getStorageSync(key) as MessageSendRecord;
              if (record && record.status === 'pending') {
                records.push(record);
              }
            } catch (e) {
              console.warn('读取消息记录失败:', key, e);
            }
          }
        } catch (e) {
          console.warn('获取存储信息失败:', e);
        }
        
        return { success: true, data: records };
      }
    } catch (error) {
      console.error('获取待发送消息记录失败:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}
