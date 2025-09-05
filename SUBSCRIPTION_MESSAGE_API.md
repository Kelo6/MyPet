# 📱 订阅消息提醒系统 - API接口文档

## 🎯 系统概述

本系统实现了完整的微信小程序订阅消息提醒流程，包括前端授权收集、后端消息发送、错误处理和重试机制。

## 📋 消息模板定义

### 1. 疫苗接种提醒模板
```
模板ID: VACCINE_REMINDER_TEMPLATE_ID
模板内容: 您的宠物{{thing1.DATA}}需要接种{{thing2.DATA}}，计划时间：{{date3.DATA}}。{{thing4.DATA}}

变量说明:
- thing1: 宠物名称 (最大20字符)
- thing2: 疫苗类型 (最大20字符) 
- date3: 计划日期 (YYYY-MM-DD格式)
- thing4: 注意事项 (最大20字符)
```

### 2. 驱虫提醒模板
```
模板ID: DEWORM_REMINDER_TEMPLATE_ID
模板内容: 您的宠物{{thing1.DATA}}需要进行{{thing2.DATA}}，计划时间：{{date3.DATA}}。{{thing4.DATA}}

变量说明:
- thing1: 宠物名称 (最大20字符)
- thing2: 驱虫类型 (最大20字符)
- date3: 计划日期 (YYYY-MM-DD格式) 
- thing4: 温馨提示 (最大20字符)
```

### 3. 体检提醒模板
```
模板ID: CHECKUP_REMINDER_TEMPLATE_ID
模板内容: 您的宠物{{thing1.DATA}}的{{thing2.DATA}}预约在{{date3.DATA}}。医院：{{thing4.DATA}}

变量说明:
- thing1: 宠物名称 (最大20字符)
- thing2: 体检项目 (最大20字符)
- date3: 预约时间 (YYYY-MM-DD格式)
- thing4: 医院信息 (最大20字符)
```

## 🔧 前端API

### 1. 请求订阅授权

#### 单个类型授权
```typescript
import { SubscriptionService } from '../services/subscription';

// 智能请求授权（会检查现有状态）
const result = await SubscriptionService.smartRequestSubscription('vaccine');

if (result.success && result.authorized) {
  console.log('授权成功:', result.templateId);
} else {
  console.error('授权失败:', result.error);
}
```

#### 批量授权
```typescript
const result = await SubscriptionService.requestAllSubscriptions();

console.log('授权结果:', {
  总数: result.total,
  成功: result.authorizedCount,
  详情: result.results
});
```

### 2. 检查授权状态

```typescript
// 检查单个模板授权
const subscription = await SubscriptionService.checkSubscriptionStatus(
  'current_user',
  'VACCINE_REMINDER_TEMPLATE_ID'
);

if (subscription?.status === 'authorized' && subscription.remainingCount > 0) {
  console.log('授权有效');
} else {
  console.log('需要重新授权');
}

// 获取授权统计
const stats = await SubscriptionService.getSubscriptionStats('current_user');
console.log('授权统计:', stats);
```

### 3. 本地开发模拟

```typescript
import { MessageSimulator } from '../utils/message-simulator';

// 启用模拟器
MessageSimulator.setEnabled(true);
MessageSimulator.setSimulationParams(0.8, 1000); // 80%成功率，1秒延迟

// 模拟单条消息发送
const result = await MessageSimulator.simulateSendMessage(reminder, petName);

// 模拟定时任务
await MessageSimulator.simulateScheduledTask();
```

## ☁️ 云函数API

### 1. 消息发送云函数

#### 函数名称
```
notifyDispatch
```

#### 调用方式
```javascript
// 手动触发
wx.cloud.callFunction({
  name: 'notifyDispatch',
  success: res => {
    console.log('消息发送结果:', res.result);
  }
});

// 定时触发 (需要在云开发控制台配置)
// 建议每小时执行一次
```

#### 返回结果
```typescript
interface NotifyResult {
  success: boolean;
  data?: {
    total: number;      // 总处理数量
    success: number;    // 成功数量
    failed: number;     // 失败数量
    errors: Array<{     // 错误详情
      reminderId: string;
      error: string;
    }>;
  };
  error?: string;
}
```

### 2. HTTP API接口 (云托管)

#### POST /api/notify/dispatch

**请求体:**
```json
{
  "timeRange": {
    "start": "2024-01-20T00:00:00Z",
    "end": "2024-01-21T00:00:00Z"
  },
  "limit": 100,
  "dryRun": false
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "success": 20,
    "failed": 5,
    "processed": [
      {
        "reminderId": "reminder_123",
        "status": "sent",
        "sentAt": "2024-01-20T10:30:00Z"
      }
    ],
    "errors": [
      {
        "reminderId": "reminder_456", 
        "error": "用户未授权或授权已过期",
        "errorCode": 43101
      }
    ]
  }
}
```

## 📊 数据库集合设计

### 1. user_subscriptions (用户订阅记录)

```typescript
{
  _id: string;
  userId: string;           // 用户ID
  templateId: string;       // 模板ID
  status: 'authorized' | 'rejected' | 'expired';
  authorizedAt: string;     // 授权时间
  expiresAt: string;        // 过期时间
  remainingCount: number;   // 剩余使用次数
  createdAt: string;
  updatedAt: string;
}
```

**建议索引:**
```javascript
// 复合索引
{ "userId": 1, "templateId": 1 }
{ "status": 1, "expiresAt": 1 }
```

### 2. message_send_records (消息发送记录)

```typescript
{
  _id: string;
  reminderId: string;       // 提醒ID
  userId: string;           // 用户ID
  templateId: string;       // 模板ID
  status: 'pending' | 'sent' | 'failed' | 'expired';
  sentAt?: string;          // 发送时间
  errorMessage?: string;    // 错误信息
  retryCount: number;       // 重试次数
  maxRetries: number;       // 最大重试次数
  nextRetryAt?: string;     // 下次重试时间
  createdAt: string;
  updatedAt: string;
}
```

**建议索引:**
```javascript
// 单字段索引
{ "status": 1 }
{ "reminderId": 1 }
{ "nextRetryAt": 1 }

// 复合索引
{ "status": 1, "nextRetryAt": 1 }
```

## ⚠️ 错误处理

### 1. 错误码定义

```typescript
enum MessageErrorCode {
  NOT_AUTHORIZED = 43101,      // 用户未授权
  USER_REJECTED = 43102,       // 用户拒绝接收
  TEMPLATE_NOT_FOUND = 43103,  // 模板不存在
  TEMPLATE_EXPIRED = 43104,    // 模板已过期
  INVALID_PARAMS = 47001,      // 参数错误
  SYSTEM_ERROR = -1,           // 系统错误
}
```

### 2. 重试策略

```typescript
// 指数退避重试
const retryDelays = [
  1 * 60 * 1000,     // 1分钟
  5 * 60 * 1000,     // 5分钟  
  30 * 60 * 1000,    // 30分钟
];

// 最大重试3次
const maxRetries = 3;
```

### 3. 错误处理流程

```typescript
async function handleSendError(record: MessageSendRecord, error: any) {
  const errorCode = error.errCode || -1;
  
  // 不可重试的错误
  const nonRetryableErrors = [43101, 43102, 43103];
  
  if (nonRetryableErrors.includes(errorCode)) {
    record.status = 'failed';
    record.errorMessage = getErrorMessage(errorCode);
  } else if (record.retryCount < record.maxRetries) {
    // 可重试错误
    record.retryCount++;
    record.nextRetryAt = new Date(
      Date.now() + getRetryDelay(record.retryCount)
    ).toISOString();
  } else {
    // 超过最大重试次数
    record.status = 'failed';
    record.errorMessage = '超过最大重试次数';
  }
  
  await DatabaseService.saveMessageSendRecord(record);
}
```

## 🔄 幂等性保证

### 1. 发送记录检查

```typescript
// 发送前检查是否已有记录
const existingRecord = await db.collection('message_send_records')
  .where({
    reminderId: reminder._id,
    status: db.command.in(['sent', 'pending'])
  })
  .limit(1)
  .get();

if (existingRecord.data.length > 0) {
  console.log('消息已发送或待发送，跳过');
  return;
}
```

### 2. 状态更新原子性

```typescript
// 使用事务确保状态更新的原子性
const transaction = db.startTransaction();

try {
  // 更新提醒状态
  await transaction.collection('reminders')
    .doc(reminderId)
    .update({ status: 'sent' });
  
  // 更新订阅次数
  await transaction.collection('user_subscriptions')
    .doc(subscriptionId)
    .update({ remainingCount: db.command.inc(-1) });
  
  // 记录发送结果
  await transaction.collection('message_send_records')
    .add({ data: sendRecord });
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## 🚀 部署配置

### 1. 云函数部署

```bash
# 进入云函数目录
cd cloudfunctions/notifyDispatch

# 安装依赖
npm install

# 上传并部署
wx-cli cloud functions deploy notifyDispatch
```

### 2. 定时触发器配置

```json
{
  "triggers": [
    {
      "name": "hourly_notify",
      "type": "timer",
      "config": "0 0 * * * * *"
    }
  ]
}
```

### 3. 环境变量配置

```javascript
// 云函数环境变量
const config = {
  ENV: process.env.ENV || 'production',
  DEBUG: process.env.DEBUG === 'true',
  MAX_BATCH_SIZE: parseInt(process.env.MAX_BATCH_SIZE) || 100,
  RETRY_DELAY_BASE: parseInt(process.env.RETRY_DELAY_BASE) || 60000,
};
```

## 🧪 测试指南

### 1. 本地开发测试

```typescript
// 启用模拟器进行本地测试
MessageSimulator.setEnabled(true);
MessageSimulator.setSimulationParams(0.8, 500);

// 测试单条消息
const testReminder = {
  _id: 'test_reminder',
  userId: 'test_user',
  petId: 'test_pet',
  type: 'vaccine',
  title: '疫苗接种提醒',
  fireAt: new Date().toISOString(),
  status: 'pending',
  subscribeMsgTemplateId: 'VACCINE_REMINDER_TEMPLATE_ID',
  reminderDays: 3,
  createdAt: new Date().toISOString(),
};

const result = await MessageSimulator.simulateSendMessage(testReminder, '小白');
console.log('测试结果:', result);
```

### 2. 生产环境测试

```bash
# 调用云函数进行测试
wx-cli cloud functions invoke notifyDispatch --params '{}'

# 查看执行日志
wx-cli cloud logs --function notifyDispatch
```

## 📈 监控与统计

### 1. 发送统计查询

```javascript
// 按日期统计发送情况
db.collection('message_send_records')
  .aggregate()
  .match({
    createdAt: db.command.gte('2024-01-01').and(db.command.lt('2024-02-01'))
  })
  .group({
    _id: {
      date: db.command.dateToString({
        date: '$createdAt',
        format: '%Y-%m-%d'
      }),
      status: '$status'
    },
    count: db.command.sum(1)
  })
  .end();
```

### 2. 性能监控

```typescript
// 发送耗时统计
const startTime = Date.now();
const result = await sendMessage();
const duration = Date.now() - startTime;

console.log('消息发送耗时:', duration, 'ms');

// 记录性能指标
await db.collection('performance_metrics').add({
  data: {
    operation: 'send_message',
    duration: duration,
    success: result.success,
    timestamp: new Date().toISOString()
  }
});
```

---

## 💡 最佳实践

1. **模板管理**: 在微信公众平台申请正式的消息模板ID
2. **授权管理**: 定期清理过期的授权记录
3. **错误监控**: 建立完善的错误日志和告警机制
4. **性能优化**: 合理设置批处理大小和并发限制
5. **用户体验**: 提供清晰的授权说明和状态反馈

**🎉 订阅消息提醒系统已完整实现！支持完整的授权流程、消息发送、错误处理和本地开发调试。**




