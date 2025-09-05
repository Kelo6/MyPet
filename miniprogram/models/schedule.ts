// 日程相关数据模型

export interface Schedule {
  id: string;
  petId: string;
  type: ScheduleType;
  title: string;
  description?: string;
  scheduledDate: string;
  completedDate?: string;
  status: ScheduleStatus;
  reminders: Reminder[];
  vaccineInfo?: VaccineInfo;
  dewormingInfo?: DewormingInfo;
  createdAt: string;
  updatedAt: string;
}

export enum ScheduleType {
  VACCINE = 'vaccine',
  DEWORMING = 'deworming',
  CHECKUP = 'checkup',
  GROOMING = 'grooming',
  CUSTOM = 'custom',
}

export enum ScheduleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface Reminder {
  id: string;
  scheduleId: string;
  type: ReminderType;
  triggerTime: string;
  message: string;
  isEnabled: boolean;
  isSent: boolean;
}

export enum ReminderType {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
}

export interface VaccineInfo {
  vaccineName: string;
  manufacturer?: string;
  batchNumber?: string;
  veterinarian?: string;
  clinic?: string;
  nextDueDate?: string;
  notes?: string;
}

export interface DewormingInfo {
  medicationName: string;
  dosage?: string;
  targetParasites: string[];
  veterinarian?: string;
  clinic?: string;
  nextDueDate?: string;
  notes?: string;
}

// 疫苗类型配置
export const VaccineTypes = {
  dog: [
    { name: '犬瘟热疫苗', interval: 365, description: '预防犬瘟热病毒感染' },
    {
      name: '犬细小病毒疫苗',
      interval: 365,
      description: '预防犬细小病毒感染',
    },
    {
      name: '犬传染性肝炎疫苗',
      interval: 365,
      description: '预防犬传染性肝炎',
    },
    { name: '犬副流感疫苗', interval: 365, description: '预防犬副流感' },
    { name: '狂犬病疫苗', interval: 365, description: '预防狂犬病，法律要求' },
    { name: '犬腺病毒疫苗', interval: 365, description: '预防犬腺病毒感染' },
  ],
  cat: [
    { name: '猫瘟疫苗', interval: 365, description: '预防猫泛白细胞减少症' },
    { name: '猫鼻气管炎疫苗', interval: 365, description: '预防猫鼻气管炎' },
    {
      name: '猫杯状病毒疫苗',
      interval: 365,
      description: '预防猫杯状病毒感染',
    },
    { name: '狂犬病疫苗', interval: 365, description: '预防狂犬病，法律要求' },
    {
      name: '猫白血病疫苗',
      interval: 365,
      description: '预防猫白血病病毒感染',
    },
  ],
};

// 驱虫药物配置
export const DewormingMedications = {
  internal: [
    {
      name: '拜耳拜宠清',
      interval: 90,
      targetParasites: ['蛔虫', '钩虫', '鞭虫', '绦虫'],
    },
    {
      name: '汽巴杜虫丸',
      interval: 90,
      targetParasites: ['蛔虫', '钩虫', '鞭虫'],
    },
    {
      name: '海乐妙',
      interval: 30,
      targetParasites: ['蛔虫', '钩虫', '鞭虫', '绦虫'],
    },
  ],
  external: [
    { name: '福来恩', interval: 30, targetParasites: ['跳蚤', '蜱虫'] },
    { name: '大宠爱', interval: 30, targetParasites: ['跳蚤', '蜱虫', '螨虫'] },
    { name: '尼可信', interval: 90, targetParasites: ['跳蚤', '蜱虫'] },
  ],
};




