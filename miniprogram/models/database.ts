// 数据库模型定义
// 支持微信云开发(TCB)和本地存储，可迁移到自建后端

/**
 * 用户模型
 */
export interface User {
  _id: string;
  openid: string;
  nickname: string;
  avatar: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 宠物模型
 */
export interface Pet {
  _id: string;
  userId: string;
  name: string;
  species: 'cat' | 'dog' | 'bird' | 'rabbit' | 'hamster' | 'other';
  breed?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthday?: string; // YYYY-MM-DD format
  avatar?: string;
  sterilized?: boolean;
  weightKg?: number;
  microchipId?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 疫苗记录模型
 */
export interface VaccineRecord {
  _id: string;
  petId: string;
  name: string; // 疫苗名称，如"狂犬病疫苗"、"五联疫苗"
  doseNo: number; // 第几针，1,2,3...
  plannedDate: string; // YYYY-MM-DD
  actualDate?: string; // YYYY-MM-DD，实际接种日期
  hospital?: string; // 接种医院
  veterinarian?: string; // 接种兽医
  batchNumber?: string; // 疫苗批号
  manufacturer?: string; // 生产厂家
  nextDueDate?: string; // 下次应接种日期
  note?: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

/**
 * 驱虫记录模型
 */
export interface DewormRecord {
  _id: string;
  petId: string;
  type: 'internal' | 'external' | 'both'; // 内驱/外驱/内外同驱
  plannedDate: string; // YYYY-MM-DD
  actualDate?: string; // YYYY-MM-DD，实际驱虫日期
  product?: string; // 驱虫产品名称
  dosage?: string; // 用量
  targetParasites?: string[]; // 目标寄生虫
  nextDueDate?: string; // 下次应驱虫日期
  hospital?: string; // 驱虫医院
  veterinarian?: string; // 执行兽医
  note?: string;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

/**
 * 提醒模型
 */
export interface Reminder {
  _id: string;
  userId: string;
  petId: string;
  type: 'vaccine' | 'deworm' | 'checkup' | 'custom';
  title: string;
  content?: string; // 提醒详细内容
  fireAt: string; // ISO 8601 datetime
  status: 'pending' | 'sent' | 'done' | 'cancelled';
  subscribeMsgTemplateId?: string; // 微信订阅消息模板ID
  relatedRecordId?: string; // 关联的疫苗或驱虫记录ID
  reminderDays: number; // 提前几天提醒
  isRepeating?: boolean; // 是否重复提醒
  repeatInterval?: number; // 重复间隔(天)
  createdAt: string;
  updatedAt?: string;
}

/**
 * 知识库模型
 */
export interface Knowledge {
  _id: string;
  slug: string; // URL友好的标识符
  title: string;
  category: 'vaccine' | 'deworm' | 'health' | 'nutrition' | 'care' | 'emergency';
  summary?: string; // 摘要
  contentMD: string; // Markdown格式内容
  tags?: string[]; // 标签
  readTime?: number; // 预估阅读时间(分钟)
  viewCount?: number; // 阅读次数
  isPublished: boolean; // 是否发布
  author?: string; // 作者
  coverImage?: string; // 封面图
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户设置模型
 */
export interface Settings {
  _id: string;
  userId: string;
  notifyAheadDays: number; // 提前几天提醒，默认3天
  timezone?: string; // 时区，默认Asia/Shanghai
  reminderTime?: string; // 提醒时间，HH:mm格式，默认09:00
  enablePushNotification: boolean; // 是否启用推送通知
  enableSmsNotification: boolean; // 是否启用短信通知
  enableEmailNotification: boolean; // 是否启用邮件通知
  vaccinePeriodMonths: number; // 疫苗周期(月)，默认12
  dewormPeriodDays: number; // 驱虫周期(天)，默认90
  autoCreateReminders: boolean; // 是否自动创建提醒
  privacyLevel: 'public' | 'friends' | 'private'; // 隐私级别
  dataBackup: boolean; // 是否启用数据备份
  createdAt: string;
  updatedAt: string;
}

/**
 * 数据库集合名称常量
 */
export const Collections = {
  USERS: 'users',
  PETS: 'pets',
  VACCINE_RECORDS: 'vaccine_records',
  DEWORM_RECORDS: 'deworm_records',
  REMINDERS: 'reminders',
  KNOWLEDGE: 'knowledge',
  SETTINGS: 'settings',
} as const;

/**
 * 本地存储键名常量
 */
export const StorageKeys = {
  // 用户相关
  USER_INFO: 'user_info',
  USER_SETTINGS: 'user_settings',
  
  // 宠物相关
  PETS: 'pets',
  PETS_CACHE: 'pets_cache',
  
  // 记录相关
  VACCINE_RECORDS: 'vaccine_records',
  DEWORM_RECORDS: 'deworm_records',
  
  // 提醒相关
  REMINDERS: 'reminders',
  REMINDER_SETTINGS: 'reminder_settings',
  
  // 知识库相关
  KNOWLEDGE_CACHE: 'knowledge_cache',
  KNOWLEDGE_FAVORITES: 'knowledge_favorites',
  
  // 缓存控制
  CACHE_TIMESTAMP: 'cache_timestamp',
  LAST_SYNC_TIME: 'last_sync_time',
  
  // 应用状态
  APP_VERSION: 'app_version',
  FIRST_LAUNCH: 'first_launch',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

/**
 * 缓存过期时间配置(毫秒)
 */
export const CacheExpiration = {
  USER_INFO: 24 * 60 * 60 * 1000,        // 24小时
  PETS: 12 * 60 * 60 * 1000,             // 12小时
  RECORDS: 6 * 60 * 60 * 1000,           // 6小时
  REMINDERS: 30 * 60 * 1000,             // 30分钟
  KNOWLEDGE: 7 * 24 * 60 * 60 * 1000,    // 7天
  SETTINGS: 24 * 60 * 60 * 1000,         // 24小时
} as const;

/**
 * 默认设置值
 */
export const DefaultSettings: Omit<Settings, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  notifyAheadDays: 3,
  timezone: 'Asia/Shanghai',
  reminderTime: '09:00',
  enablePushNotification: true,
  enableSmsNotification: false,
  enableEmailNotification: false,
  vaccinePeriodMonths: 12,
  dewormPeriodDays: 90,
  autoCreateReminders: true,
  privacyLevel: 'private',
  dataBackup: true,
};

/**
 * 疫苗类型配置
 */
export const VaccineTypes = {
  dog: [
    { name: '狂犬病疫苗', interval: 365, required: true },
    { name: '犬五联疫苗', interval: 365, required: true },
    { name: '犬六联疫苗', interval: 365, required: false },
    { name: '犬八联疫苗', interval: 365, required: false },
    { name: '犬瘟热疫苗', interval: 365, required: true },
    { name: '犬细小病毒疫苗', interval: 365, required: true },
  ],
  cat: [
    { name: '狂犬病疫苗', interval: 365, required: true },
    { name: '猫三联疫苗', interval: 365, required: true },
    { name: '猫四联疫苗', interval: 365, required: false },
    { name: '猫瘟疫苗', interval: 365, required: true },
    { name: '猫鼻气管炎疫苗', interval: 365, required: true },
  ],
  other: [
    { name: '狂犬病疫苗', interval: 365, required: false },
  ],
} as const;

/**
 * 驱虫产品配置
 */
export const DewormProducts = {
  internal: [
    { name: '拜耳拜宠清', interval: 90, species: ['dog', 'cat'] },
    { name: '汽巴杜虫丸', interval: 90, species: ['dog'] },
    { name: '海乐妙', interval: 30, species: ['cat'] },
    { name: '犬心保', interval: 30, species: ['dog'] },
  ],
  external: [
    { name: '福来恩', interval: 30, species: ['dog', 'cat'] },
    { name: '大宠爱', interval: 30, species: ['dog', 'cat'] },
    { name: '尼可信', interval: 90, species: ['dog'] },
    { name: '博来恩', interval: 90, species: ['dog', 'cat'] },
  ],
} as const;




