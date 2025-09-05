// constants/schedule.ts
// 宠物疫苗/驱虫计划配置常量

/**
 * 疫苗类型定义
 */
export interface VaccineConfig {
  /** 疫苗名称 */
  name: string;
  /** 疫苗类型标识 */
  type: string;
  /** 适用物种 */
  species: ('dog' | 'cat')[];
  /** 初免计划 */
  primary: {
    /** 开始周龄 */
    startWeeks: number;
    /** 结束周龄 */
    endWeeks: number;
    /** 间隔周数 */
    intervalWeeks: number;
    /** 最小剂次 */
    minDoses: number;
    /** 推荐剂次 */
    recommendedDoses: number;
  };
  /** 加强免疫 */
  booster: {
    /** 首次加强间隔（月） */
    firstBoosterMonths: number;
    /** 后续加强间隔（月） */
    intervalMonths: number;
  };
  /** 接种窗口期（天） */
  windowDays: number;
  /** 备注信息 */
  note?: string;
}

/**
 * 驱虫类型定义
 */
export interface DewormConfig {
  /** 驱虫名称 */
  name: string;
  /** 驱虫类型 */
  type: 'internal' | 'external' | 'both';
  /** 适用物种 */
  species: ('dog' | 'cat')[];
  /** 幼期计划（月龄） */
  puppy: {
    /** 开始月龄 */
    startMonths: number;
    /** 结束月龄 */
    endMonths: number;
    /** 间隔月数 */
    intervalMonths: number;
  };
  /** 成年期计划 */
  adult: {
    /** 间隔月数 */
    intervalMonths: number;
  };
  /** 接种窗口期（天） */
  windowDays: number;
  /** 备注信息 */
  note?: string;
}

/**
 * 计划生成结果
 */
export interface ScheduleItem {
  /** 类型 */
  type: 'vaccine' | 'deworm';
  /** 名称 */
  name: string;
  /** 剂次（疫苗用） */
  doseNo?: number;
  /** 计划日期 */
  plannedDate: string;
  /** 接种窗口 */
  window: {
    start: string;
    end: string;
  };
  /** 备注 */
  note?: string;
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 配置来源 */
  configId: string;
}

/**
 * 狗狗疫苗配置
 */
export const DOG_VACCINE_CONFIGS: VaccineConfig[] = [
  {
    name: '犬二联疫苗',
    type: 'core_2',
    species: ['dog'],
    primary: {
      startWeeks: 8,
      endWeeks: 16,
      intervalWeeks: 3,
      minDoses: 2,
      recommendedDoses: 3,
    },
    booster: {
      firstBoosterMonths: 12,
      intervalMonths: 12,
    },
    windowDays: 14,
    note: '预防犬瘟热、犬细小病毒',
  },
  {
    name: '犬四联疫苗',
    type: 'core_4',
    species: ['dog'],
    primary: {
      startWeeks: 8,
      endWeeks: 16,
      intervalWeeks: 3,
      minDoses: 2,
      recommendedDoses: 3,
    },
    booster: {
      firstBoosterMonths: 12,
      intervalMonths: 12,
    },
    windowDays: 14,
    note: '预防犬瘟热、犬细小病毒、犬副流感、犬腺病毒',
  },
  {
    name: '犬八联疫苗',
    type: 'core_8',
    species: ['dog'],
    primary: {
      startWeeks: 8,
      endWeeks: 16,
      intervalWeeks: 3,
      minDoses: 2,
      recommendedDoses: 3,
    },
    booster: {
      firstBoosterMonths: 12,
      intervalMonths: 12,
    },
    windowDays: 14,
    note: '预防8种犬类常见疾病，推荐使用',
  },
  {
    name: '狂犬疫苗',
    type: 'rabies',
    species: ['dog'],
    primary: {
      startWeeks: 12,
      endWeeks: 16,
      intervalWeeks: 0,
      minDoses: 1,
      recommendedDoses: 1,
    },
    booster: {
      firstBoosterMonths: 12,
      intervalMonths: 12,
    },
    windowDays: 14,
    note: '法律要求，每年必须接种',
  },
];

/**
 * 猫咪疫苗配置
 */
export const CAT_VACCINE_CONFIGS: VaccineConfig[] = [
  {
    name: '猫三联疫苗',
    type: 'core_3',
    species: ['cat'],
    primary: {
      startWeeks: 8,
      endWeeks: 16,
      intervalWeeks: 3,
      minDoses: 2,
      recommendedDoses: 3,
    },
    booster: {
      firstBoosterMonths: 12,
      intervalMonths: 12,
    },
    windowDays: 14,
    note: '预防猫瘟、猫杯状病毒、猫鼻气管炎',
  },
  {
    name: '猫狂犬疫苗',
    type: 'rabies',
    species: ['cat'],
    primary: {
      startWeeks: 12,
      endWeeks: 16,
      intervalWeeks: 0,
      minDoses: 1,
      recommendedDoses: 1,
    },
    booster: {
      firstBoosterMonths: 12,
      intervalMonths: 12,
    },
    windowDays: 14,
    note: '部分地区要求，建议接种',
  },
];

/**
 * 狗狗驱虫配置
 */
export const DOG_DEWORM_CONFIGS: DewormConfig[] = [
  {
    name: '体内驱虫',
    type: 'internal',
    species: ['dog'],
    puppy: {
      startMonths: 1,
      endMonths: 6,
      intervalMonths: 1,
    },
    adult: {
      intervalMonths: 3,
    },
    windowDays: 7,
    note: '预防蛔虫、钩虫、鞭虫等',
  },
  {
    name: '体外驱虫',
    type: 'external',
    species: ['dog'],
    puppy: {
      startMonths: 2,
      endMonths: 6,
      intervalMonths: 1,
    },
    adult: {
      intervalMonths: 1,
    },
    windowDays: 7,
    note: '预防跳蚤、蜱虫、虱子等',
  },
];

/**
 * 猫咪驱虫配置
 */
export const CAT_DEWORM_CONFIGS: DewormConfig[] = [
  {
    name: '体内驱虫',
    type: 'internal',
    species: ['cat'],
    puppy: {
      startMonths: 1,
      endMonths: 6,
      intervalMonths: 1,
    },
    adult: {
      intervalMonths: 3,
    },
    windowDays: 7,
    note: '预防蛔虫、钩虫、绦虫等',
  },
  {
    name: '体外驱虫',
    type: 'external',
    species: ['cat'],
    puppy: {
      startMonths: 2,
      endMonths: 6,
      intervalMonths: 1,
    },
    adult: {
      intervalMonths: 1,
    },
    windowDays: 7,
    note: '预防跳蚤、蜱虫等，室内猫可适当延长',
  },
];

/**
 * 获取物种疫苗配置
 */
export function getVaccineConfigs(species: 'dog' | 'cat'): VaccineConfig[] {
  return species === 'dog' ? DOG_VACCINE_CONFIGS : CAT_VACCINE_CONFIGS;
}

/**
 * 获取物种驱虫配置
 */
export function getDewormConfigs(species: 'dog' | 'cat'): DewormConfig[] {
  return species === 'dog' ? DOG_DEWORM_CONFIGS : CAT_DEWORM_CONFIGS;
}

/**
 * 年龄阶段定义
 */
export const AGE_STAGES = {
  /** 幼期结束月龄 */
  PUPPY_END_MONTHS: 12,
  /** 成年期开始月龄 */
  ADULT_START_MONTHS: 12,
  /** 老年期开始月龄 */
  SENIOR_START_MONTHS: 84, // 7岁
} as const;

/**
 * 优先级权重
 */
export const PRIORITY_WEIGHTS = {
  /** 狂犬疫苗 - 法律要求 */
  rabies: 'high',
  /** 核心疫苗 - 强烈推荐 */
  core: 'high',
  /** 体内驱虫 - 重要 */
  internal_deworm: 'medium',
  /** 体外驱虫 - 重要 */
  external_deworm: 'medium',
  /** 其他 */
  other: 'low',
} as const;

/**
 * 默认设置
 */
export const DEFAULT_SCHEDULE_SETTINGS = {
  /** 是否启用疫苗计划 */
  enableVaccine: true,
  /** 是否启用驱虫计划 */
  enableDeworm: true,
  /** 提前提醒天数 */
  reminderDays: 7,
  /** 是否自动生成计划 */
  autoGenerate: true,
  /** 计划生成范围（月） */
  planningMonths: 18,
} as const;




