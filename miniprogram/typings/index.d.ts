/// <reference types="@types/wechat-miniprogram" />

declare global {
  interface IAppOption {
    globalData: {
      userInfo?: WechatMiniprogram.UserInfo;
      openId?: string;
    };
    userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
    checkForUpdate?: () => void;
  }

  // API 统一返回格式
  interface ApiResult<T = any> {
    code: number;
    msg: string;
    data: T | null;
  }

  // 存储信息接口
  interface StorageInfo {
    keys: string[];
    currentSize: number;
    limitSize: number;
  }

  namespace WechatMiniprogram {
    interface Wx {
      cloud: any;
    }
  }
}

export {};
