// 数据迁移脚本和种子数据
import { 
  User, Pet, VaccineRecord, DewormRecord, Reminder, Knowledge, Settings,
  DefaultSettings, VaccineTypes, DewormProducts 
} from '../models/database';

/**
 * 种子数据生成器
 */
export class SeedDataGenerator {
  /**
   * 生成测试用户数据
   */
  static generateMockUsers(count: number = 3): User[] {
    const users: User[] = [];
    const now = new Date().toISOString();
    
    for (let i = 1; i <= count; i++) {
      users.push({
        _id: `user_${i}`,
        openid: `mock_openid_${i}`,
        nickname: `测试用户${i}`,
        avatar: `https://thirdwx.qlogo.cn/mmopen/vi_32/mock_avatar_${i}.png`,
        phone: i === 1 ? '13800138000' : undefined,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now,
      });
    }
    
    return users;
  }

  /**
   * 生成测试宠物数据
   */
  static generateMockPets(userId: string, count: number = 2): Pet[] {
    const pets: Pet[] = [];
    const now = new Date().toISOString();
    
    const mockData = [
      {
        name: '小白',
        species: 'dog' as const,
        breed: '拉布拉多',
        gender: 'male' as const,
        birthday: '2022-03-15',
        weightKg: 25.5,
        sterilized: false,
      },
      {
        name: '咪咪',
        species: 'cat' as const,
        breed: '英国短毛猫',
        gender: 'female' as const,
        birthday: '2021-08-20',
        weightKg: 4.2,
        sterilized: true,
      },
      {
        name: '小黄',
        species: 'dog' as const,
        breed: '金毛寻回犬',
        gender: 'male' as const,
        birthday: '2023-01-10',
        weightKg: 18.3,
        sterilized: false,
      },
    ];

    for (let i = 0; i < Math.min(count, mockData.length); i++) {
      const data = mockData[i];
      pets.push({
        _id: `pet_${userId}_${i + 1}`,
        userId,
        ...data,
        avatar: `https://example.com/pet_avatar_${i + 1}.jpg`,
        microchipId: i === 0 ? '123456789012345' : undefined,
        createdAt: new Date(Date.now() - (count - i) * 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: now,
      });
    }

    return pets;
  }

  /**
   * 生成测试疫苗记录
   */
  static generateMockVaccineRecords(petId: string, species: 'dog' | 'cat'): VaccineRecord[] {
    const records: VaccineRecord[] = [];
    const vaccines = VaccineTypes[species] || VaccineTypes.other;
    const now = new Date();
    
    vaccines.forEach((vaccine, index) => {
      // 生成历史记录
      const pastDate = new Date(now.getTime() - (365 + 30 - index * 30) * 24 * 60 * 60 * 1000);
      const actualDate = new Date(pastDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      
      records.push({
        _id: `vaccine_${petId}_${index}_past`,
        petId,
        name: vaccine.name,
        doseNo: 1,
        plannedDate: pastDate.toISOString().split('T')[0],
        actualDate: actualDate.toISOString().split('T')[0],
        hospital: '宠物医院A',
        veterinarian: '张医生',
        batchNumber: `BATCH${index + 1}2023`,
        manufacturer: '某某生物科技',
        nextDueDate: new Date(actualDate.getTime() + vaccine.interval * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'completed',
        createdAt: pastDate.toISOString(),
        updatedAt: actualDate.toISOString(),
      });

      // 生成即将到期的记录
      if (index < 2) {
        const upcomingDate = new Date(now.getTime() + (7 + index * 14) * 24 * 60 * 60 * 1000);
        records.push({
          _id: `vaccine_${petId}_${index}_upcoming`,
          petId,
          name: vaccine.name,
          doseNo: 2,
          plannedDate: upcomingDate.toISOString().split('T')[0],
          status: 'pending',
          note: '年度疫苗接种',
          createdAt: now.toISOString(),
        });
      }
    });

    return records;
  }

  /**
   * 生成测试驱虫记录
   */
  static generateMockDewormRecords(petId: string): DewormRecord[] {
    const records: DewormRecord[] = [];
    const now = new Date();
    
    // 内驱记录
    const internalProduct = DewormProducts.internal[0];
    const pastInternalDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const actualInternalDate = new Date(pastInternalDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    records.push({
      _id: `deworm_${petId}_internal_past`,
      petId,
      type: 'internal',
      plannedDate: pastInternalDate.toISOString().split('T')[0],
      actualDate: actualInternalDate.toISOString().split('T')[0],
      product: internalProduct.name,
      dosage: '1片',
      targetParasites: ['蛔虫', '钩虫'],
      nextDueDate: new Date(actualInternalDate.getTime() + internalProduct.interval * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
      createdAt: pastInternalDate.toISOString(),
      updatedAt: actualInternalDate.toISOString(),
    });

    // 即将到期的内驱
    const upcomingInternalDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    records.push({
      _id: `deworm_${petId}_internal_upcoming`,
      petId,
      type: 'internal',
      plannedDate: upcomingInternalDate.toISOString().split('T')[0],
      product: internalProduct.name,
      status: 'pending',
      createdAt: now.toISOString(),
    });

    // 外驱记录
    const externalProduct = DewormProducts.external[0];
    const pastExternalDate = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
    
    records.push({
      _id: `deworm_${petId}_external_past`,
      petId,
      type: 'external',
      plannedDate: pastExternalDate.toISOString().split('T')[0],
      actualDate: pastExternalDate.toISOString().split('T')[0],
      product: externalProduct.name,
      targetParasites: ['跳蚤', '蜱虫'],
      nextDueDate: new Date(pastExternalDate.getTime() + externalProduct.interval * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'completed',
      createdAt: pastExternalDate.toISOString(),
      updatedAt: pastExternalDate.toISOString(),
    });

    return records;
  }

  /**
   * 生成测试提醒数据
   */
  static generateMockReminders(userId: string, petId: string): Reminder[] {
    const reminders: Reminder[] = [];
    const now = new Date();
    
    // 疫苗提醒
    const vaccineReminderDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    reminders.push({
      _id: `reminder_${petId}_vaccine`,
      userId,
      petId,
      type: 'vaccine',
      title: '疫苗接种提醒',
      content: '您的宠物需要接种年度疫苗了',
      fireAt: vaccineReminderDate.toISOString(),
      status: 'pending',
      reminderDays: 3,
      relatedRecordId: `vaccine_${petId}_0_upcoming`,
      createdAt: now.toISOString(),
    });

    // 驱虫提醒
    const dewormReminderDate = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
    reminders.push({
      _id: `reminder_${petId}_deworm`,
      userId,
      petId,
      type: 'deworm',
      title: '驱虫提醒',
      content: '该给宠物进行内驱虫了',
      fireAt: dewormReminderDate.toISOString(),
      status: 'pending',
      reminderDays: 3,
      relatedRecordId: `deworm_${petId}_internal_upcoming`,
      createdAt: now.toISOString(),
    });

    // 已发送的提醒
    const sentReminderDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    reminders.push({
      _id: `reminder_${petId}_sent`,
      userId,
      petId,
      type: 'checkup',
      title: '健康检查提醒',
      content: '建议带宠物进行定期健康检查',
      fireAt: sentReminderDate.toISOString(),
      status: 'sent',
      reminderDays: 7,
      createdAt: new Date(sentReminderDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return reminders;
  }

  /**
   * 生成测试设置数据
   */
  static generateMockSettings(userId: string): Settings {
    const now = new Date().toISOString();
    
    return {
      _id: `settings_${userId}`,
      userId,
      ...DefaultSettings,
      notifyAheadDays: 3,
      reminderTime: '09:00',
      enablePushNotification: true,
      enableSmsNotification: false,
      enableEmailNotification: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 生成完整的测试数据集
   */
  static generateCompleteDataSet() {
    const users = this.generateMockUsers(2);
    const allData: any = { users, pets: [], vaccineRecords: [], dewormRecords: [], reminders: [], settings: [] };

    users.forEach(user => {
      const pets = this.generateMockPets(user._id, 2);
      allData.pets.push(...pets);

      const settings = this.generateMockSettings(user._id);
      allData.settings.push(settings);

      pets.forEach(pet => {
        const vaccineRecords = this.generateMockVaccineRecords(pet._id, pet.species as 'dog' | 'cat');
        allData.vaccineRecords.push(...vaccineRecords);

        const dewormRecords = this.generateMockDewormRecords(pet._id);
        allData.dewormRecords.push(...dewormRecords);

        const reminders = this.generateMockReminders(user._id, pet._id);
        allData.reminders.push(...reminders);
      });
    });

    return allData;
  }
}

/**
 * 数据迁移工具
 */
export class DataMigration {
  /**
   * 从本地存储迁移到云数据库
   */
  static async migrateToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      if (!wx.cloud) {
        return { success: false, message: '云开发未初始化' };
      }

      const db = wx.cloud.database();
      let migratedCount = 0;

      // 迁移用户数据
      const userData = wx.getStorageSync('user_info');
      if (userData) {
        await db.collection('users').add({ data: userData });
        migratedCount++;
      }

      // 迁移宠物数据
      const pets = wx.getStorageSync('pets') || [];
      for (const pet of pets) {
        await db.collection('pets').add({ data: pet });
        migratedCount++;
      }

      // 迁移疫苗记录
      const vaccineRecords = wx.getStorageSync('vaccine_records') || [];
      for (const record of vaccineRecords) {
        await db.collection('vaccine_records').add({ data: record });
        migratedCount++;
      }

      // 迁移驱虫记录
      const dewormRecords = wx.getStorageSync('deworm_records') || [];
      for (const record of dewormRecords) {
        await db.collection('deworm_records').add({ data: record });
        migratedCount++;
      }

      // 迁移提醒数据
      const reminders = wx.getStorageSync('reminders') || [];
      for (const reminder of reminders) {
        await db.collection('reminders').add({ data: reminder });
        migratedCount++;
      }

      // 迁移设置数据
      const settings = wx.getStorageSync('user_settings');
      if (settings) {
        await db.collection('settings').add({ data: settings });
        migratedCount++;
      }

      return { 
        success: true, 
        message: `成功迁移 ${migratedCount} 条记录到云数据库` 
      };
    } catch (error) {
      console.error('数据迁移失败:', error);
      return { 
        success: false, 
        message: `数据迁移失败: ${error}` 
      };
    }
  }

  /**
   * 从云数据库备份到本地
   */
  static async backupFromCloud(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!wx.cloud) {
        return { success: false, message: '云开发未初始化' };
      }

      const db = wx.cloud.database();
      let backupCount = 0;

      // 备份用户数据
      const userResult = await db.collection('users').where({ _openid: userId }).get();
      if (userResult.data.length > 0) {
        wx.setStorageSync('user_info_backup', userResult.data[0]);
        backupCount++;
      }

      // 备份宠物数据
      const petsResult = await db.collection('pets').where({ userId }).get();
      wx.setStorageSync('pets_backup', petsResult.data);
      backupCount += petsResult.data.length;

      // 备份疫苗记录
      const vaccineResults = await Promise.all(
        petsResult.data.map((pet: any) => 
          db.collection('vaccine_records').where({ petId: pet._id }).get()
        )
      );
      const allVaccineRecords = vaccineResults.reduce((acc: any[], result) => acc.concat(result.data), []);
      wx.setStorageSync('vaccine_records_backup', allVaccineRecords);
      backupCount += allVaccineRecords.length;

      // 备份驱虫记录
      const dewormResults = await Promise.all(
        petsResult.data.map((pet: any) => 
          db.collection('deworm_records').where({ petId: pet._id }).get()
        )
      );
      const allDewormRecords = dewormResults.reduce((acc: any[], result) => acc.concat(result.data), []);
      wx.setStorageSync('deworm_records_backup', allDewormRecords);
      backupCount += allDewormRecords.length;

      // 备份提醒数据
      const remindersResult = await db.collection('reminders').where({ userId }).get();
      wx.setStorageSync('reminders_backup', remindersResult.data);
      backupCount += remindersResult.data.length;

      // 备份设置数据
      const settingsResult = await db.collection('settings').where({ userId }).get();
      if (settingsResult.data.length > 0) {
        wx.setStorageSync('user_settings_backup', settingsResult.data[0]);
        backupCount++;
      }

      // 设置备份时间戳
      wx.setStorageSync('backup_timestamp', new Date().toISOString());

      return { 
        success: true, 
        message: `成功备份 ${backupCount} 条记录到本地` 
      };
    } catch (error) {
      console.error('数据备份失败:', error);
      return { 
        success: false, 
        message: `数据备份失败: ${error}` 
      };
    }
  }

  /**
   * 清理本地缓存
   */
  static clearLocalCache(): void {
    const cacheKeys = [
      'pets_cache', 'knowledge_cache', 'user_info_cache',
      'vaccine_records_cache', 'deworm_records_cache', 'reminders_cache'
    ];
    
    cacheKeys.forEach(key => {
      wx.removeStorageSync(key);
      wx.removeStorageSync(`${key}_timestamp`);
    });
  }

  /**
   * 初始化开发环境数据
   */
  static async initDevelopmentData(): Promise<void> {
    const mockData = SeedDataGenerator.generateCompleteDataSet();
    
    // 保存到本地存储
    wx.setStorageSync('user_info', mockData.users[0]);
    wx.setStorageSync('pets', mockData.pets);
    wx.setStorageSync('vaccine_records', mockData.vaccineRecords);
    wx.setStorageSync('deworm_records', mockData.dewormRecords);
    wx.setStorageSync('reminders', mockData.reminders);
    wx.setStorageSync('user_settings', mockData.settings[0]);
    
    console.log('开发环境数据初始化完成:', {
      users: mockData.users.length,
      pets: mockData.pets.length,
      vaccineRecords: mockData.vaccineRecords.length,
      dewormRecords: mockData.dewormRecords.length,
      reminders: mockData.reminders.length,
      settings: mockData.settings.length,
    });
  }
}
