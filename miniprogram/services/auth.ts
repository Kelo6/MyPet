// 认证服务
import { StorageUtils, StorageKeys } from '../utils/storage';

export class AuthService {
  /**
   * 微信登录
   */
  static async wxLogin(): Promise<
    ApiResult<{ openId: string; sessionKey: string }>
  > {
    try {
      // 获取微信登录code
      const loginRes = await wx.login();

      if (!loginRes.code) {
        return {
          code: -1,
          msg: '获取微信登录code失败',
          data: null,
        };
      }

      // 这里应该调用后端API换取openId和sessionKey
      // 为了演示，我们使用本地存储模拟
      const mockData = {
        openId: `mock_openid_${Date.now()}`,
        sessionKey: `mock_session_${Date.now()}`,
      };

      return {
        code: 0,
        msg: '登录成功',
        data: mockData,
      };
    } catch (error) {
      console.error('微信登录失败:', error);
      return {
        code: -1,
        msg: '登录失败',
        data: null,
      };
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(): Promise<ApiResult<WechatMiniprogram.UserInfo>> {
    try {
      const userInfo = StorageUtils.get<WechatMiniprogram.UserInfo>(
        StorageKeys.USER_INFO
      );

      if (userInfo) {
        return {
          code: 0,
          msg: '获取成功',
          data: userInfo,
        };
      }

      return {
        code: -1,
        msg: '用户信息不存在',
        data: null,
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        code: -1,
        msg: '获取用户信息失败',
        data: null,
      };
    }
  }

  /**
   * 保存用户信息
   */
  static saveUserInfo(userInfo: WechatMiniprogram.UserInfo): void {
    try {
      StorageUtils.set(StorageKeys.USER_INFO, userInfo);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  }

  /**
   * 检查登录状态
   */
  static isLoggedIn(): boolean {
    const userInfo = StorageUtils.get<WechatMiniprogram.UserInfo>(
      StorageKeys.USER_INFO
    );
    return !!userInfo;
  }

  /**
   * 退出登录
   */
  static logout(): void {
    try {
      StorageUtils.remove(StorageKeys.USER_INFO);
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  }
}
