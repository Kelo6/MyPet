// 数据验证工具类

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class Validator {
  /**
   * 验证手机号
   * @param phone 手机号
   */
  static validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return { isValid: false, message: '请输入手机号' };
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, message: '请输入正确的手机号' };
    }

    return { isValid: true };
  }

  /**
   * 验证邮箱
   * @param email 邮箱地址
   */
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, message: '请输入邮箱地址' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: '请输入正确的邮箱地址' };
    }

    return { isValid: true };
  }

  /**
   * 验证宠物名称
   * @param name 宠物名称
   */
  static validatePetName(name: string): ValidationResult {
    if (!name || !name.trim()) {
      return { isValid: false, message: '请输入宠物名称' };
    }

    if (name.trim().length < 1 || name.trim().length > 20) {
      return { isValid: false, message: '宠物名称长度应在1-20个字符之间' };
    }

    return { isValid: true };
  }

  /**
   * 验证体重
   * @param weight 体重
   */
  static validateWeight(weight: number | string): ValidationResult {
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;

    if (isNaN(weightNum)) {
      return { isValid: false, message: '请输入有效的体重数值' };
    }

    if (weightNum <= 0) {
      return { isValid: false, message: '体重必须大于0' };
    }

    if (weightNum > 1000) {
      return { isValid: false, message: '体重不能超过1000kg' };
    }

    return { isValid: true };
  }

  /**
   * 验证日期
   * @param date 日期字符串
   * @param allowFuture 是否允许未来日期
   */
  static validateDate(date: string, allowFuture = true): ValidationResult {
    if (!date) {
      return { isValid: false, message: '请选择日期' };
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, message: '请输入正确的日期格式' };
    }

    if (!allowFuture && dateObj > new Date()) {
      return { isValid: false, message: '日期不能选择未来时间' };
    }

    // 检查日期是否合理（不能太早）
    const minDate = new Date('1900-01-01');
    if (dateObj < minDate) {
      return { isValid: false, message: '日期不能早于1900年' };
    }

    return { isValid: true };
  }

  /**
   * 验证微信昵称
   * @param nickname 昵称
   */
  static validateNickname(nickname: string): ValidationResult {
    if (!nickname || !nickname.trim()) {
      return { isValid: false, message: '请输入昵称' };
    }

    if (nickname.trim().length < 1 || nickname.trim().length > 30) {
      return { isValid: false, message: '昵称长度应在1-30个字符之间' };
    }

    return { isValid: true };
  }

  /**
   * 验证密码（如果需要）
   * @param password 密码
   */
  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, message: '请输入密码' };
    }

    if (password.length < 6) {
      return { isValid: false, message: '密码长度不能少于6位' };
    }

    if (password.length > 20) {
      return { isValid: false, message: '密码长度不能超过20位' };
    }

    return { isValid: true };
  }

  /**
   * 验证芯片号
   * @param chipId 芯片号
   */
  static validateChipId(chipId: string): ValidationResult {
    if (!chipId) {
      return { isValid: true }; // 芯片号是可选的
    }

    // 芯片号通常是15位数字
    const chipRegex = /^\d{15}$/;
    if (!chipRegex.test(chipId)) {
      return { isValid: false, message: '芯片号应为15位数字' };
    }

    return { isValid: true };
  }

  /**
   * 验证时间格式 (HH:mm)
   * @param time 时间字符串
   */
  static validateTime(time: string): ValidationResult {
    if (!time) {
      return { isValid: false, message: '请输入时间' };
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return { isValid: false, message: '请输入正确的时间格式（HH:mm）' };
    }

    return { isValid: true };
  }

  /**
   * 批量验证
   * @param validations 验证数组
   */
  static validateAll(
    validations: (() => ValidationResult)[]
  ): ValidationResult {
    for (const validate of validations) {
      const result = validate();
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }
}

// 常用验证规则
export const ValidationRules = {
  required: (value: any, message = '此字段为必填项'): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, message };
    }
    return { isValid: true };
  },

  minLength: (
    value: string,
    min: number,
    message?: string
  ): ValidationResult => {
    if (value && value.length < min) {
      return {
        isValid: false,
        message: message || `最少需要${min}个字符`,
      };
    }
    return { isValid: true };
  },

  maxLength: (
    value: string,
    max: number,
    message?: string
  ): ValidationResult => {
    if (value && value.length > max) {
      return {
        isValid: false,
        message: message || `最多只能输入${max}个字符`,
      };
    }
    return { isValid: true };
  },

  range: (
    value: number,
    min: number,
    max: number,
    message?: string
  ): ValidationResult => {
    if (value < min || value > max) {
      return {
        isValid: false,
        message: message || `数值应在${min}-${max}之间`,
      };
    }
    return { isValid: true };
  },
};




