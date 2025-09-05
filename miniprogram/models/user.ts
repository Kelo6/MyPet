// 用户相关数据模型

export interface User {
  id: string;
  openId: string;
  unionId?: string;
  nickName: string;
  avatarUrl: string;
  gender: number;
  city?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  reminderSettings: ReminderSettings;
  privacySettings: PrivacySettings;
  notificationSettings: NotificationSettings;
}

export interface ReminderSettings {
  defaultReminderTime: string; // HH:mm 格式
  reminderDays: number[]; // 提前提醒天数，如 [1, 3, 7]
  enablePushNotification: boolean;
  enableSmsNotification: boolean;
  enableEmailNotification: boolean;
}

export interface PrivacySettings {
  shareLocation: boolean;
  shareHealthData: boolean;
  allowDataAnalysis: boolean;
}

export interface NotificationSettings {
  vaccineReminder: boolean;
  dewormingReminder: boolean;
  checkupReminder: boolean;
  healthTips: boolean;
  systemNotifications: boolean;
}

// 用户设置表单数据
export interface UserSettingsFormData {
  nickName: string;
  phone: string;
  email: string;
  defaultReminderTime: string;
  reminderDays: number[];
  enablePushNotification: boolean;
  enableSmsNotification: boolean;
  enableEmailNotification: boolean;
  shareLocation: boolean;
  shareHealthData: boolean;
  allowDataAnalysis: boolean;
  vaccineReminder: boolean;
  dewormingReminder: boolean;
  checkupReminder: boolean;
  healthTips: boolean;
  systemNotifications: boolean;
}

// 默认用户设置
export const DefaultUserPreferences: UserPreferences = {
  reminderSettings: {
    defaultReminderTime: '09:00',
    reminderDays: [1, 3, 7],
    enablePushNotification: true,
    enableSmsNotification: false,
    enableEmailNotification: false,
  },
  privacySettings: {
    shareLocation: false,
    shareHealthData: false,
    allowDataAnalysis: true,
  },
  notificationSettings: {
    vaccineReminder: true,
    dewormingReminder: true,
    checkupReminder: true,
    healthTips: true,
    systemNotifications: true,
  },
};




