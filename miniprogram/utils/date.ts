// 日期处理工具类

export class DateUtils {
  /**
   * 格式化日期为字符串
   * @param date 日期对象或时间戳
   * @param format 格式化模板，默认 'YYYY-MM-DD'
   */
  static format(date: Date | number | string, format = 'YYYY-MM-DD'): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取相对时间描述
   * @param date 目标日期
   */
  static getRelativeTime(date: Date | string): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      if (absDays === 0) return '今天';
      if (absDays === 1) return '昨天';
      if (absDays < 7) return `${absDays}天前`;
      if (absDays < 30) return `${Math.floor(absDays / 7)}周前`;
      if (absDays < 365) return `${Math.floor(absDays / 30)}个月前`;
      return `${Math.floor(absDays / 365)}年前`;
    } else {
      if (diffDays === 0) return '今天';
      if (diffDays === 1) return '明天';
      if (diffDays === 2) return '后天';
      if (diffDays < 7) return `${diffDays}天后`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周后`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月后`;
      return `${Math.floor(diffDays / 365)}年后`;
    }
  }

  /**
   * 计算年龄
   * @param birthDate 出生日期
   */
  static calculateAge(birthDate: string | Date): string {
    const birth = new Date(birthDate);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years > 0) {
      return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
    } else {
      if (months === 0) {
        const days = Math.floor(
          (now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
        );
        return `${days}天`;
      }
      return `${months}个月`;
    }
  }

  /**
   * 添加天数
   * @param date 基准日期
   * @param days 要添加的天数
   */
  static addDays(date: Date | string, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 添加月数
   * @param date 基准日期
   * @param months 要添加的月数
   */
  static addMonths(date: Date | string, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * 获取日期范围内的所有日期
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  static getDateRange(
    startDate: Date | string,
    endDate: Date | string
  ): Date[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: Date[] = [];

    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * 检查是否为今天
   * @param date 检查的日期
   */
  static isToday(date: Date | string): boolean {
    const today = new Date();
    const target = new Date(date);

    return (
      today.getFullYear() === target.getFullYear() &&
      today.getMonth() === target.getMonth() &&
      today.getDate() === target.getDate()
    );
  }

  /**
   * 检查是否过期
   * @param date 检查的日期
   */
  static isOverdue(date: Date | string): boolean {
    const now = new Date();
    const target = new Date(date);

    // 只比较日期，不比较时间
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate()
    );

    return targetDate < nowDate;
  }

  /**
   * 获取即将到期的项目（7天内）
   * @param date 检查的日期
   */
  static isUpcoming(date: Date | string): boolean {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= 7;
  }
}




