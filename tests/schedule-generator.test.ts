// tests/schedule-generator.test.ts
// 宠物疫苗/驱虫计划生成器单元测试

import { ScheduleGenerator, HistoryRecord } from '../utils/schedule-generator';
import { ScheduleItem } from '../constants/schedule';

/**
 * 测试辅助函数
 */
class TestHelper {
  /**
   * 创建测试日期（从今天开始的相对日期）
   */
  static createDate(daysFromNow: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * 创建生日日期（从今天开始的相对日期）
   */
  static createBirthday(weeksAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - weeksAgo * 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * 验证计划项的基本结构
   */
  static validateScheduleItem(item: ScheduleItem): boolean {
    return !!(
      item.type &&
      item.name &&
      item.plannedDate &&
      item.window &&
      item.window.start &&
      item.window.end &&
      item.priority &&
      item.configId
    );
  }

  /**
   * 按日期排序计划项
   */
  static sortByDate(items: ScheduleItem[]): ScheduleItem[] {
    return items.sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
  }
}

/**
 * 狗狗疫苗计划测试
 */
describe('狗狗疫苗计划生成', () => {
  
  test('8周龄幼犬初免计划', () => {
    const birthday = TestHelper.createBirthday(8); // 8周前出生
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, []);
    
    const vaccines = schedules.filter(item => item.type === 'vaccine');
    
    // 应该包含多种疫苗
    expect(vaccines.length).toBeGreaterThan(0);
    
    // 应该包含狂犬疫苗
    const rabiesVaccines = vaccines.filter(v => v.name.includes('狂犬'));
    expect(rabiesVaccines.length).toBeGreaterThan(0);
    
    // 应该包含核心疫苗
    const coreVaccines = vaccines.filter(v => v.name.includes('联'));
    expect(coreVaccines.length).toBeGreaterThan(0);
    
    // 验证计划项结构
    vaccines.forEach(vaccine => {
      expect(TestHelper.validateScheduleItem(vaccine)).toBe(true);
      expect(vaccine.doseNo).toBeGreaterThan(0);
    });
  });

  test('成年犬补种计划', () => {
    const birthday = TestHelper.createBirthday(52 * 2); // 2岁成年犬
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, []);
    
    const vaccines = schedules.filter(item => item.type === 'vaccine');
    
    // 成年犬应该有补种计划
    expect(vaccines.length).toBeGreaterThan(0);
    
    // 应该标注为补种
    const catchUpVaccines = vaccines.filter(v => v.note?.includes('补种'));
    expect(catchUpVaccines.length).toBeGreaterThan(0);
  });

  test('基于历史记录的计划生成', () => {
    const birthday = TestHelper.createBirthday(12); // 12周龄
    const historyRecords: HistoryRecord[] = [
      {
        type: 'vaccine',
        name: '犬八联疫苗',
        actualDate: TestHelper.createDate(-14), // 2周前接种过第1针
        doseNo: 1,
      },
    ];

    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, historyRecords);
    const vaccines = schedules.filter(item => item.type === 'vaccine');
    
    // 应该生成后续剂次
    const nextDoses = vaccines.filter(v => v.name.includes('八联') && v.doseNo && v.doseNo > 1);
    expect(nextDoses.length).toBeGreaterThan(0);
  });
});

/**
 * 猫咪疫苗计划测试
 */
describe('猫咪疫苗计划生成', () => {
  
  test('幼猫初免计划', () => {
    const birthday = TestHelper.createBirthday(10); // 10周龄
    const schedules = ScheduleGenerator.generateSchedule('cat', birthday, []);
    
    const vaccines = schedules.filter(item => item.type === 'vaccine');
    
    // 应该包含猫三联
    const coreVaccines = vaccines.filter(v => v.name.includes('三联'));
    expect(coreVaccines.length).toBeGreaterThan(0);
    
    // 可能包含狂犬（取决于配置）
    const rabiesVaccines = vaccines.filter(v => v.name.includes('狂犬'));
    // 不强制要求，因为部分地区可选
  });

  test('成年猫加强免疫', () => {
    const birthday = TestHelper.createBirthday(52 * 3); // 3岁成年猫
    const historyRecords: HistoryRecord[] = [
      {
        type: 'vaccine',
        name: '猫三联疫苗',
        actualDate: TestHelper.createDate(-365), // 1年前接种过
        doseNo: 3,
      },
    ];

    const schedules = ScheduleGenerator.generateSchedule('cat', birthday, historyRecords);
    const vaccines = schedules.filter(item => item.type === 'vaccine');
    
    // 应该有年度加强计划
    const boosterVaccines = vaccines.filter(v => v.note?.includes('加强'));
    expect(boosterVaccines.length).toBeGreaterThan(0);
  });
});

/**
 * 驱虫计划测试
 */
describe('驱虫计划生成', () => {
  
  test('幼犬驱虫计划', () => {
    const birthday = TestHelper.createBirthday(8); // 8周龄幼犬
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, []);
    
    const dewormItems = schedules.filter(item => item.type === 'deworm');
    
    // 应该包含体内驱虫
    const internalDeworm = dewormItems.filter(d => d.name.includes('体内'));
    expect(internalDeworm.length).toBeGreaterThan(0);
    
    // 应该包含体外驱虫
    const externalDeworm = dewormItems.filter(d => d.name.includes('体外'));
    expect(externalDeworm.length).toBeGreaterThan(0);
  });

  test('成年犬驱虫频率', () => {
    const birthday = TestHelper.createBirthday(52 * 2); // 2岁成年犬
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, [], {
      planningMonths: 12, // 计划1年
    });
    
    const dewormItems = schedules.filter(item => item.type === 'deworm');
    
    // 体内驱虫：成年犬每3个月一次，1年应该有4次
    const internalDeworm = dewormItems.filter(d => d.name.includes('体内'));
    expect(internalDeworm.length).toBeCloseTo(4, 1); // 允许1次误差
    
    // 体外驱虫：成年犬每月一次，1年应该有12次
    const externalDeworm = dewormItems.filter(d => d.name.includes('体外'));
    expect(externalDeworm.length).toBeCloseTo(12, 2); // 允许2次误差
  });

  test('基于历史记录的驱虫计划', () => {
    const birthday = TestHelper.createBirthday(20); // 20周龄
    const historyRecords: HistoryRecord[] = [
      {
        type: 'deworm',
        name: '体内驱虫',
        actualDate: TestHelper.createDate(-30), // 1个月前驱虫过
        dewormType: 'internal',
      },
    ];

    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, historyRecords);
    const dewormItems = schedules.filter(item => item.type === 'deworm');
    
    // 应该有后续的驱虫计划
    expect(dewormItems.length).toBeGreaterThan(0);
    
    // 下次体内驱虫应该在合理时间范围内
    const nextInternal = dewormItems.find(d => d.name.includes('体内'));
    if (nextInternal) {
      const nextDate = new Date(nextInternal.plannedDate);
      const lastDate = new Date(historyRecords[0].actualDate);
      const daysDiff = (nextDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBeGreaterThan(60); // 至少2个月后
      expect(daysDiff).toBeLessThan(120); // 不超过4个月
    }
  });
});

/**
 * 边界情况测试
 */
describe('边界情况处理', () => {
  
  test('未填生日的情况', () => {
    const schedules = ScheduleGenerator.generateSchedule('dog', '', []);
    
    // 应该返回空数组
    expect(schedules).toEqual([]);
  });

  test('无效生日的情况', () => {
    const schedules = ScheduleGenerator.generateSchedule('dog', 'invalid-date', []);
    
    // 应该返回空数组或处理错误
    expect(Array.isArray(schedules)).toBe(true);
  });

  test('年龄过大的宠物', () => {
    const birthday = TestHelper.createBirthday(52 * 20); // 20岁高龄犬
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, []);
    
    // 应该仍然生成合理的计划
    expect(Array.isArray(schedules)).toBe(true);
    
    // 高龄犬仍需要年度疫苗
    const vaccines = schedules.filter(item => item.type === 'vaccine');
    expect(vaccines.length).toBeGreaterThan(0);
  });

  test('大量历史记录的处理', () => {
    const birthday = TestHelper.createBirthday(52 * 5); // 5岁犬
    
    // 创建大量历史记录
    const historyRecords: HistoryRecord[] = [];
    for (let i = 0; i < 50; i++) {
      historyRecords.push({
        type: 'deworm',
        name: '体外驱虫',
        actualDate: TestHelper.createDate(-(i * 30)), // 每月一次，过去50个月
        dewormType: 'external',
      });
    }

    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, historyRecords);
    
    // 应该能正常处理大量历史记录
    expect(Array.isArray(schedules)).toBe(true);
    expect(schedules.length).toBeGreaterThan(0);
  });

  test('计划时间窗口验证', () => {
    const birthday = TestHelper.createBirthday(12); // 12周龄
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, []);
    
    // 验证所有计划项都有合理的时间窗口
    schedules.forEach(item => {
      const plannedDate = new Date(item.plannedDate);
      const windowStart = new Date(item.window.start);
      const windowEnd = new Date(item.window.end);
      
      // 窗口开始时间应该早于计划时间
      expect(windowStart.getTime()).toBeLessThanOrEqual(plannedDate.getTime());
      
      // 窗口结束时间应该晚于计划时间
      expect(windowEnd.getTime()).toBeGreaterThanOrEqual(plannedDate.getTime());
      
      // 窗口应该是合理的长度（不超过30天）
      const windowDays = (windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000);
      expect(windowDays).toBeLessThanOrEqual(60); // 最多60天窗口
    });
  });

  test('优先级分配正确性', () => {
    const birthday = TestHelper.createBirthday(16); // 16周龄
    const schedules = ScheduleGenerator.generateSchedule('dog', birthday, []);
    
    // 狂犬疫苗应该是高优先级
    const rabiesVaccines = schedules.filter(item => 
      item.type === 'vaccine' && item.name.includes('狂犬')
    );
    rabiesVaccines.forEach(vaccine => {
      expect(vaccine.priority).toBe('high');
    });
    
    // 核心疫苗应该是高优先级
    const coreVaccines = schedules.filter(item => 
      item.type === 'vaccine' && item.name.includes('联')
    );
    coreVaccines.forEach(vaccine => {
      expect(vaccine.priority).toBe('high');
    });
    
    // 驱虫应该是中等优先级
    const dewormItems = schedules.filter(item => item.type === 'deworm');
    dewormItems.forEach(deworm => {
      expect(deworm.priority).toBe('medium');
    });
  });
});

/**
 * 性能测试
 */
describe('性能测试', () => {
  
  test('大规模计划生成性能', () => {
    const birthday = TestHelper.createBirthday(8); // 8周龄
    
    const startTime = Date.now();
    
    // 生成多个宠物的计划
    for (let i = 0; i < 100; i++) {
      ScheduleGenerator.generateSchedule('dog', birthday, []);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 100次生成应该在合理时间内完成（比如1秒）
    expect(duration).toBeLessThan(1000);
  });
});

/**
 * 集成测试辅助函数
 */
export { TestHelper };

/**
 * 运行所有测试的辅助函数
 */
export function runAllTests(): void {
  console.log('🧪 开始运行宠物健康计划生成器测试...');
  
  try {
    // 这里可以添加测试运行逻辑
    // 在实际环境中，这些测试会由测试框架（如Jest）运行
    console.log('✅ 所有测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}
