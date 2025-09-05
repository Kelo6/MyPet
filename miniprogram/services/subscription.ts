// services/subscription.ts
// 订阅消息服务

import { 
  UserSubscription, 
  MessageSendRecord, 
  SUBSCRIPTION_TEMPLATES,
  getTemplateByType,
  MessageErrorCode,
  ERROR_MESSAGES 
} from '../models/subscription';
import { DatabaseService } from './database';
import { CacheManager } from '../utils/cache-manager';

/**
 * 订阅消息服务
 */
export class SubscriptionService {
  
  /**
   * 请求订阅消息授权
   */
  static async requestSubscription(
    templateIds: string[], 
    scene?: string
  ): Promise<{ success: boolean; results: Record<string, string>; error?: string }> {
    try {
      const result = await wx.requestSubscribeMessage({
        tmplIds: templateIds,
      });

      // 记录授权结果
      const userId = 'current_user'; // 实际应用中获取真实用户ID
      await this.saveSubscriptionResults(userId, result, templateIds);

      return {
        success: true,
        results: result,
      };
    } catch (error: any) {
      console.error('请求订阅授权失败:', error);
      return {
        success: false,
        results: {},
        error: error.errMsg || '请求授权失败',
      };
    }
  }

  /**
   * 保存授权结果
   */
  private static async saveSubscriptionResults(
    userId: string, 
    results: Record<string, string>,
    templateIds: string[]
  ): Promise<void> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天后过期

    for (const templateId of templateIds) {
      const status = results[templateId];
      let subscriptionStatus: 'authorized' | 'rejected' | 'expired' = 'rejected';
      let remainingCount = 0;

      if (status === 'accept') {
        subscriptionStatus = 'authorized';
        remainingCount = 1; // 一次性订阅消息只能使用一次
      }

      const subscription: UserSubscription = {
        userId,
        templateId,
        status: subscriptionStatus,
        authorizedAt: subscriptionStatus === 'authorized' ? now : '',
        expiresAt,
        remainingCount,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await DatabaseService.saveUserSubscription(subscription);
      } catch (error) {
        console.error('保存订阅记录失败:', error);
      }
    }
  }

  /**
   * 检查用户订阅状态
   */
  static async checkSubscriptionStatus(
    userId: string, 
    templateId: string
  ): Promise<UserSubscription | null> {
    try {
      const result = await DatabaseService.getUserSubscription(userId, templateId);
      if (result.success && result.data) {
        const subscription = result.data;
        
        // 检查是否过期
        if (new Date(subscription.expiresAt) < new Date()) {
          subscription.status = 'expired';
          await DatabaseService.saveUserSubscription(subscription);
        }

        return subscription;
      }
      return null;
    } catch (error) {
      console.error('检查订阅状态失败:', error);
      return null;
    }
  }

  /**
   * 获取用户所有订阅状态
   */
  static async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    try {
      const result = await DatabaseService.getUserSubscriptions(userId);
      return result.success ? result.data || [] : [];
    } catch (error) {
      console.error('获取用户订阅失败:', error);
      return [];
    }
  }

  /**
   * 智能请求订阅（检查状态后请求）
   */
  static async smartRequestSubscription(
    reminderType: 'vaccine' | 'deworm' | 'checkup',
    forceRequest = false
  ): Promise<{ success: boolean; authorized: boolean; templateId?: string; error?: string }> {
    const template = getTemplateByType(reminderType);
    if (!template) {
      return { success: false, authorized: false, error: '未找到对应的消息模板' };
    }

    const userId = 'current_user';
    
    // 检查现有授权状态
    if (!forceRequest) {
      const existingSubscription = await this.checkSubscriptionStatus(userId, template.templateId);
      if (existingSubscription?.status === 'authorized' && existingSubscription.remainingCount > 0) {
        return { 
          success: true, 
          authorized: true, 
          templateId: template.templateId 
        };
      }
    }

    // 请求新的授权
    const result = await this.requestSubscription([template.templateId], reminderType);
    if (result.success) {
      const authorized = result.results[template.templateId] === 'accept';
      return {
        success: true,
        authorized,
        templateId: template.templateId,
      };
    }

    return {
      success: false,
      authorized: false,
      error: result.error,
    };
  }

  /**
   * 批量请求所有类型的订阅授权
   */
  static async requestAllSubscriptions(): Promise<{
    success: boolean;
    authorizedCount: number;
    results: Record<string, boolean>;
    error?: string;
  }> {
    const templateIds = SUBSCRIPTION_TEMPLATES.map(t => t.templateId);
    const result = await this.requestSubscription(templateIds, 'batch_request');

    if (result.success) {
      const results: Record<string, boolean> = {};
      let authorizedCount = 0;

      SUBSCRIPTION_TEMPLATES.forEach(template => {
        const authorized = result.results[template.templateId] === 'accept';
        results[template.type] = authorized;
        if (authorized) authorizedCount++;
      });

      return {
        success: true,
        authorizedCount,
        results,
      };
    }

    return {
      success: false,
      authorizedCount: 0,
      results: {},
      error: result.error,
    };
  }

  /**
   * 创建消息发送任务
   */
  static async createSendTask(
    reminderId: string,
    userId: string,
    templateId: string
  ): Promise<MessageSendRecord> {
    const now = new Date().toISOString();
    
    const sendRecord: MessageSendRecord = {
      reminderId,
      userId,
      templateId,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now,
    };

    const result = await DatabaseService.saveMessageSendRecord(sendRecord);
    return result.success ? result.data || sendRecord : sendRecord;
  }

  /**
   * 本地开发模拟器
   */
  static async simulateMessageSend(
    reminderId: string,
    templateId: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟不同的结果
    const random = Math.random();
    
    if (random < 0.8) {
      // 80% 成功率
      console.log('🔔 模拟消息发送成功:', {
        reminderId,
        templateId,
        data,
        timestamp: new Date().toLocaleString(),
      });
      
      return { success: true };
    } else if (random < 0.9) {
      // 10% 用户未授权
      return { 
        success: false, 
        error: ERROR_MESSAGES[MessageErrorCode.NOT_AUTHORIZED]
      };
    } else {
      // 10% 其他错误
      return { 
        success: false, 
        error: ERROR_MESSAGES[MessageErrorCode.SYSTEM_ERROR]
      };
    }
  }

  /**
   * 获取订阅状态统计
   */
  static async getSubscriptionStats(userId: string): Promise<{
    total: number;
    authorized: number;
    expired: number;
    rejected: number;
  }> {
    const subscriptions = await this.getUserSubscriptions(userId);
    
    return {
      total: subscriptions.length,
      authorized: subscriptions.filter(s => s.status === 'authorized' && s.remainingCount > 0).length,
      expired: subscriptions.filter(s => s.status === 'expired').length,
      rejected: subscriptions.filter(s => s.status === 'rejected').length,
    };
  }

  /**
   * 清理过期的订阅记录
   */
  static async cleanupExpiredSubscriptions(): Promise<number> {
    try {
      const now = new Date().toISOString();
      // 这里需要实现批量更新过期记录的逻辑
      // 实际实现时需要根据具体的数据库服务来完成
      console.log('清理过期订阅记录:', now);
      return 0;
    } catch (error) {
      console.error('清理过期订阅失败:', error);
      return 0;
    }
  }
}




