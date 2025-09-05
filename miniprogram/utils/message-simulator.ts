// utils/message-simulator.ts
// 本地开发订阅消息模拟器

import { Reminder } from '../models/database';
import { 
  MessageSendRecord, 
  MessageErrorCode, 
  ERROR_MESSAGES,
  getTemplateByType 
} from '../models/subscription';
import { DatabaseService } from '../services/database';

/**
 * 消息发送模拟器
 */
export class MessageSimulator {
  private static isEnabled = true; // 是否启用模拟器
  private static simulationDelay = 1000; // 模拟延迟 (ms)
  private static successRate = 0.8; // 成功率 80%
  
  /**
   * 启用/禁用模拟器
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`消息模拟器${enabled ? '已启用' : '已禁用'}`);
  }
  
  /**
   * 设置模拟参数
   */
  static setSimulationParams(successRate: number, delay: number): void {
    this.successRate = Math.max(0, Math.min(1, successRate));
    this.simulationDelay = Math.max(0, delay);
    console.log(`模拟参数更新: 成功率=${this.successRate}, 延迟=${this.simulationDelay}ms`);
  }
  
  /**
   * 模拟消息发送
   */
  static async simulateSendMessage(
    reminder: Reminder,
    petName: string
  ): Promise<{ success: boolean; error?: string; record?: MessageSendRecord }> {
    if (!this.isEnabled) {
      return { success: false, error: '模拟器未启用' };
    }
    
    console.log('🔔 开始模拟消息发送:', {
      reminderId: reminder._id,
      type: reminder.type,
      petName,
      fireAt: reminder.fireAt,
    });
    
    // 模拟网络延迟
    await this.delay(this.simulationDelay);
    
    // 创建发送记录
    const sendRecord: MessageSendRecord = {
      reminderId: reminder._id as string,
      userId: reminder.userId,
      templateId: reminder.subscribeMsgTemplateId || '',
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 模拟不同的发送结果
    const random = Math.random();
    
    if (random < this.successRate) {
      // 发送成功
      sendRecord.status = 'sent';
      sendRecord.sentAt = new Date().toISOString();
      
      console.log('✅ 模拟消息发送成功:', {
        reminderId: reminder._id,
        templateId: reminder.subscribeMsgTemplateId,
        message: this.buildMockMessage(reminder, petName),
        timestamp: sendRecord.sentAt,
      });
      
      // 保存成功记录
      await DatabaseService.saveMessageSendRecord(sendRecord);
      
      return { success: true, record: sendRecord };
      
    } else if (random < this.successRate + 0.1) {
      // 10% 概率：用户未授权
      sendRecord.status = 'failed';
      sendRecord.errorMessage = ERROR_MESSAGES[MessageErrorCode.NOT_AUTHORIZED];
      
      console.log('❌ 模拟消息发送失败 - 用户未授权:', {
        reminderId: reminder._id,
        error: sendRecord.errorMessage,
      });
      
      await DatabaseService.saveMessageSendRecord(sendRecord);
      return { success: false, error: sendRecord.errorMessage, record: sendRecord };
      
    } else if (random < this.successRate + 0.15) {
      // 5% 概率：模板过期
      sendRecord.status = 'failed';
      sendRecord.errorMessage = ERROR_MESSAGES[MessageErrorCode.TEMPLATE_EXPIRED];
      
      console.log('❌ 模拟消息发送失败 - 模板过期:', {
        reminderId: reminder._id,
        error: sendRecord.errorMessage,
      });
      
      await DatabaseService.saveMessageSendRecord(sendRecord);
      return { success: false, error: sendRecord.errorMessage, record: sendRecord };
      
    } else {
      // 5% 概率：系统错误
      sendRecord.status = 'failed';
      sendRecord.errorMessage = ERROR_MESSAGES[MessageErrorCode.SYSTEM_ERROR];
      
      console.log('❌ 模拟消息发送失败 - 系统错误:', {
        reminderId: reminder._id,
        error: sendRecord.errorMessage,
      });
      
      await DatabaseService.saveMessageSendRecord(sendRecord);
      return { success: false, error: sendRecord.errorMessage, record: sendRecord };
    }
  }
  
  /**
   * 构建模拟消息内容
   */
  private static buildMockMessage(reminder: Reminder, petName: string): string {
    const template = getTemplateByType(reminder.type);
    if (!template) {
      return `您的宠物${petName}有一个${reminder.type}提醒`;
    }
    
    const fireDate = new Date(reminder.fireAt).toLocaleDateString('zh-CN');
    
    switch (reminder.type) {
      case 'vaccine':
        return `您的宠物${petName}需要接种疫苗，计划时间：${fireDate}。请提前预约，按时接种`;
      case 'deworm':
        return `您的宠物${petName}需要进行驱虫治疗，计划时间：${fireDate}。请按时进行驱虫治疗`;
      case 'checkup':
        return `您的宠物${petName}的体检预约在${fireDate}。请准时前往医院`;
      default:
        return `您的宠物${petName}有一个提醒：${reminder.title}，时间：${fireDate}`;
    }
  }
  
  /**
   * 批量模拟消息发送
   */
  static async batchSimulateSendMessages(
    reminders: Reminder[]
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ reminderId: string; success: boolean; error?: string }>;
  }> {
    console.log(`🚀 开始批量模拟消息发送，共 ${reminders.length} 条提醒`);
    
    const results = {
      total: reminders.length,
      success: 0,
      failed: 0,
      results: [] as Array<{ reminderId: string; success: boolean; error?: string }>,
    };
    
    for (const reminder of reminders) {
      try {
        // 获取宠物信息（模拟）
        const petName = await this.getMockPetName(reminder.petId);
        
        const result = await this.simulateSendMessage(reminder, petName);
        
        results.results.push({
          reminderId: reminder._id as string,
          success: result.success,
          error: result.error,
        });
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
        }
        
        // 批量处理时增加小延迟避免过快
        await this.delay(100);
        
      } catch (error) {
        console.error('批量发送模拟失败:', reminder._id, error);
        results.failed++;
        results.results.push({
          reminderId: reminder._id as string,
          success: false,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }
    
    console.log('📊 批量模拟发送完成:', {
      total: results.total,
      success: results.success,
      failed: results.failed,
      successRate: `${((results.success / results.total) * 100).toFixed(1)}%`,
    });
    
    return results;
  }
  
  /**
   * 获取模拟宠物名称
   */
  private static async getMockPetName(petId: string): Promise<string> {
    try {
      const result = await DatabaseService.getPetById(petId);
      return result.success && result.data ? result.data.name : '宠物';
    } catch (error) {
      return '宠物';
    }
  }
  
  /**
   * 模拟定时任务
   */
  static async simulateScheduledTask(): Promise<void> {
    if (!this.isEnabled) {
      console.log('模拟定时任务跳过：模拟器未启用');
      return;
    }
    
    console.log('🕒 开始模拟定时消息发送任务');
    
    try {
      // 获取未来24小时内的待发送提醒
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // 这里简化为获取所有pending状态的提醒
      const allReminders = await this.getMockPendingReminders(now, next24Hours);
      
      if (allReminders.length === 0) {
        console.log('📭 没有待发送的提醒');
        return;
      }
      
      console.log(`📨 找到 ${allReminders.length} 个待发送的提醒`);
      
      // 批量发送
      const results = await this.batchSimulateSendMessages(allReminders);
      
      console.log('🎯 定时任务模拟完成:', results);
      
    } catch (error) {
      console.error('定时任务模拟失败:', error);
    }
  }
  
  /**
   * 获取模拟的待发送提醒
   */
  private static async getMockPendingReminders(
    startTime: Date,
    endTime: Date
  ): Promise<Reminder[]> {
    // 这里创建一些模拟数据用于测试
    const mockReminders: Reminder[] = [
      {
        _id: 'mock_reminder_1',
        userId: 'current_user',
        petId: 'mock_pet_1',
        type: 'vaccine',
        title: '疫苗接种提醒',
        fireAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小时后
        status: 'pending',
        subscribeMsgTemplateId: 'VACCINE_REMINDER_TEMPLATE_ID',
        reminderDays: 3,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'mock_reminder_2',
        userId: 'current_user',
        petId: 'mock_pet_2',
        type: 'deworm',
        title: '驱虫提醒',
        fireAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6小时后
        status: 'pending',
        subscribeMsgTemplateId: 'DEWORM_REMINDER_TEMPLATE_ID',
        reminderDays: 2,
        createdAt: new Date().toISOString(),
      },
    ];
    
    return mockReminders.filter(reminder => {
      const fireTime = new Date(reminder.fireAt);
      return fireTime >= startTime && fireTime <= endTime && reminder.status === 'pending';
    });
  }
  
  /**
   * 延迟工具方法
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取模拟器状态
   */
  static getStatus(): {
    enabled: boolean;
    successRate: number;
    delay: number;
  } {
    return {
      enabled: this.isEnabled,
      successRate: this.successRate,
      delay: this.simulationDelay,
    };
  }
  
  /**
   * 重置模拟器
   */
  static reset(): void {
    this.isEnabled = true;
    this.successRate = 0.8;
    this.simulationDelay = 1000;
    console.log('🔄 消息模拟器已重置到默认设置');
  }
}
