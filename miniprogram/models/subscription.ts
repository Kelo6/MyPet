// models/subscription.ts
// 订阅消息相关数据模型

/**
 * 订阅消息模板配置
 */
export interface SubscriptionTemplate {
  /** 模板ID (需要在微信公众平台申请) */
  templateId: string;
  /** 模板名称 */
  name: string;
  /** 模板类型 */
  type: 'vaccine' | 'deworm' | 'checkup' | 'custom';
  /** 模板变量定义 */
  variables: TemplateVariable[];
  /** 模板内容示例 */
  example: string;
}

/**
 * 模板变量定义
 */
export interface TemplateVariable {
  /** 变量名 */
  name: string;
  /** 变量键 */
  key: string;
  /** 变量类型 */
  type: 'string' | 'date' | 'time' | 'thing';
  /** 是否必需 */
  required: boolean;
  /** 最大长度 */
  maxLength?: number;
}

/**
 * 用户订阅授权记录
 */
export interface UserSubscription {
  /** 记录ID */
  _id?: string;
  /** 用户ID */
  userId: string;
  /** 模板ID */
  templateId: string;
  /** 授权状态 */
  status: 'authorized' | 'rejected' | 'expired';
  /** 授权时间 */
  authorizedAt: string;
  /** 过期时间 */
  expiresAt: string;
  /** 剩余次数 */
  remainingCount: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 消息发送记录
 */
export interface MessageSendRecord {
  /** 记录ID */
  _id?: string;
  /** 提醒ID */
  reminderId: string;
  /** 用户ID */
  userId: string;
  /** 模板ID */
  templateId: string;
  /** 发送状态 */
  status: 'pending' | 'sent' | 'failed' | 'expired';
  /** 发送时间 */
  sentAt?: string;
  /** 错误信息 */
  errorMessage?: string;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 下次重试时间 */
  nextRetryAt?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 订阅消息模板配置
 */
export const SUBSCRIPTION_TEMPLATES: SubscriptionTemplate[] = [
  {
    templateId: 'VACCINE_REMINDER_TEMPLATE_ID', // 需要替换为真实模板ID
    name: '疫苗接种提醒',
    type: 'vaccine',
    variables: [
      {
        name: '宠物名称',
        key: 'thing1',
        type: 'thing',
        required: true,
        maxLength: 20,
      },
      {
        name: '疫苗类型',
        key: 'thing2',
        type: 'thing',
        required: true,
        maxLength: 20,
      },
      {
        name: '计划日期',
        key: 'date3',
        type: 'date',
        required: true,
      },
      {
        name: '注意事项',
        key: 'thing4',
        type: 'thing',
        required: false,
        maxLength: 20,
      },
    ],
    example: '您的宠物{{thing1.DATA}}需要接种{{thing2.DATA}}，计划时间：{{date3.DATA}}。{{thing4.DATA}}',
  },
  {
    templateId: 'DEWORM_REMINDER_TEMPLATE_ID', // 需要替换为真实模板ID
    name: '驱虫提醒',
    type: 'deworm',
    variables: [
      {
        name: '宠物名称',
        key: 'thing1',
        type: 'thing',
        required: true,
        maxLength: 20,
      },
      {
        name: '驱虫类型',
        key: 'thing2',
        type: 'thing',
        required: true,
        maxLength: 20,
      },
      {
        name: '计划日期',
        key: 'date3',
        type: 'date',
        required: true,
      },
      {
        name: '温馨提示',
        key: 'thing4',
        type: 'thing',
        required: false,
        maxLength: 20,
      },
    ],
    example: '您的宠物{{thing1.DATA}}需要进行{{thing2.DATA}}，计划时间：{{date3.DATA}}。{{thing4.DATA}}',
  },
  {
    templateId: 'CHECKUP_REMINDER_TEMPLATE_ID', // 需要替换为真实模板ID
    name: '体检提醒',
    type: 'checkup',
    variables: [
      {
        name: '宠物名称',
        key: 'thing1',
        type: 'thing',
        required: true,
        maxLength: 20,
      },
      {
        name: '体检项目',
        key: 'thing2',
        type: 'thing',
        required: true,
        maxLength: 20,
      },
      {
        name: '预约时间',
        key: 'date3',
        type: 'date',
        required: true,
      },
      {
        name: '医院信息',
        key: 'thing4',
        type: 'thing',
        required: false,
        maxLength: 20,
      },
    ],
    example: '您的宠物{{thing1.DATA}}的{{thing2.DATA}}预约在{{date3.DATA}}。医院：{{thing4.DATA}}',
  },
];

/**
 * 获取模板配置
 */
export function getTemplateConfig(templateId: string): SubscriptionTemplate | undefined {
  return SUBSCRIPTION_TEMPLATES.find(template => template.templateId === templateId);
}

/**
 * 根据类型获取模板配置
 */
export function getTemplateByType(type: string): SubscriptionTemplate | undefined {
  return SUBSCRIPTION_TEMPLATES.find(template => template.type === type);
}

/**
 * 消息发送错误码
 */
export enum MessageErrorCode {
  /** 用户未授权 */
  NOT_AUTHORIZED = 43101,
  /** 模板已过期 */
  TEMPLATE_EXPIRED = 43104,
  /** 用户拒绝接收 */
  USER_REJECTED = 43102,
  /** 模板不存在 */
  TEMPLATE_NOT_FOUND = 43103,
  /** 参数错误 */
  INVALID_PARAMS = 47001,
  /** 系统错误 */
  SYSTEM_ERROR = -1,
}

/**
 * 错误信息映射
 */
export const ERROR_MESSAGES: Record<MessageErrorCode, string> = {
  [MessageErrorCode.NOT_AUTHORIZED]: '用户未授权或授权已过期',
  [MessageErrorCode.TEMPLATE_EXPIRED]: '消息模板已过期',
  [MessageErrorCode.USER_REJECTED]: '用户拒绝接收消息',
  [MessageErrorCode.TEMPLATE_NOT_FOUND]: '消息模板不存在',
  [MessageErrorCode.INVALID_PARAMS]: '参数错误',
  [MessageErrorCode.SYSTEM_ERROR]: '系统错误',
};




