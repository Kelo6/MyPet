# 🗄️ 宠物疫苗/驱虫提醒系统 - 数据库设计文档

## 📋 概述

本文档详细描述了宠物疫苗/驱虫提醒系统的完整数据模型设计，支持微信云开发(TCB)和本地存储，具备未来迁移到自建后端的能力。

---

## 🏗️ 数据模型架构

### 核心实体关系图

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │  Settings   │    │ Knowledge   │
│             │────│             │    │             │
│ - _id       │    │ - userId    │    │ - category  │
│ - openid    │    │ - notify    │    │ - content   │
│ - nickname  │    │   Settings  │    │ - tags      │
└─────────────┘    └─────────────┘    └─────────────┘
        │
        │ 1:N
        ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     Pet     │    │  Reminder   │    │VaccineRecord│
│             │────│             │    │             │
│ - userId    │    │ - userId    │    │ - petId     │
│ - species   │    │ - petId     │    │ - doseNo    │
│ - breed     │    │ - type      │    │ - status    │
└─────────────┘    │ - fireAt    │    └─────────────┘
        │          └─────────────┘
        │ 1:N              │ 1:N
        ▼                  ▼
┌─────────────┐    ┌─────────────┐
│DewormRecord │    │             │
│             │    │             │
│ - petId     │    │             │
│ - type      │    │             │
│ - status    │    │             │
└─────────────┘    └─────────────┘
```

---

## 📊 数据模型定义

### 1. User (用户表)

```typescript
interface User {
  _id: string;              // 主键，用户唯一标识
  openid: string;           // 微信openid，唯一索引
  nickname: string;         // 用户昵称
  avatar: string;           // 头像URL
  phone?: string;           // 手机号(可选，脱敏存储)
  createdAt: string;        // 创建时间 ISO 8601
  updatedAt?: string;       // 更新时间 ISO 8601
}
```

**字段说明：**
- `_id`: 系统生成的唯一标识符
- `openid`: 微信用户唯一标识，用于安全验证
- `phone`: 可选字段，用于短信提醒功能
- 创建索引：`openid` (唯一)、`createdAt`

---

### 2. Pet (宠物表)

```typescript
interface Pet {
  _id: string;              // 主键
  userId: string;           // 关联用户ID，外键
  name: string;             // 宠物名称
  species: 'cat'|'dog'|'bird'|'rabbit'|'hamster'|'other'; // 物种
  breed?: string;           // 品种(可选)
  gender?: 'male'|'female'|'unknown'; // 性别
  birthday?: string;        // 生日 YYYY-MM-DD
  avatar?: string;          // 头像URL
  sterilized?: boolean;     // 是否绝育
  weightKg?: number;        // 体重(千克)
  microchipId?: string;     // 芯片号(可选)
  createdAt: string;        // 创建时间
  updatedAt?: string;       // 更新时间
}
```

**字段说明：**
- `species`: 限定枚举值，便于疫苗推荐
- `microchipId`: 15位芯片号，用于宠物身份识别
- `weightKg`: 用于药物剂量计算
- 创建索引：`userId + createdAt`、`userId + species`

---

### 3. VaccineRecord (疫苗记录表)

```typescript
interface VaccineRecord {
  _id: string;              // 主键
  petId: string;            // 关联宠物ID，外键
  name: string;             // 疫苗名称，如"狂犬病疫苗"
  doseNo: number;           // 第几针 (1,2,3...)
  plannedDate: string;      // 计划接种日期 YYYY-MM-DD
  actualDate?: string;      // 实际接种日期 YYYY-MM-DD
  hospital?: string;        // 接种医院
  veterinarian?: string;    // 接种兽医
  batchNumber?: string;     // 疫苗批号
  manufacturer?: string;    // 生产厂家
  nextDueDate?: string;     // 下次应接种日期
  note?: string;            // 备注信息
  status: 'pending'|'completed'|'overdue'|'cancelled'; // 状态
  createdAt: string;        // 创建时间
  updatedAt?: string;       // 更新时间
}
```

**字段说明：**
- `doseNo`: 支持多针疫苗管理
- `nextDueDate`: 自动计算下次接种时间
- `status`: 状态流转管理
- 创建索引：`petId + plannedDate`、`petId + status`、`status + plannedDate`

---

### 4. DewormRecord (驱虫记录表)

```typescript
interface DewormRecord {
  _id: string;              // 主键
  petId: string;            // 关联宠物ID，外键
  type: 'internal'|'external'|'both'; // 驱虫类型
  plannedDate: string;      // 计划驱虫日期 YYYY-MM-DD
  actualDate?: string;      // 实际驱虫日期 YYYY-MM-DD
  product?: string;         // 驱虫产品名称
  dosage?: string;          // 用量描述
  targetParasites?: string[]; // 目标寄生虫列表
  nextDueDate?: string;     // 下次应驱虫日期
  hospital?: string;        // 驱虫医院
  veterinarian?: string;    // 执行兽医
  note?: string;            // 备注信息
  status: 'pending'|'completed'|'overdue'|'cancelled'; // 状态
  createdAt: string;        // 创建时间
  updatedAt?: string;       // 更新时间
}
```

**字段说明：**
- `type`: 区分内驱、外驱、内外同驱
- `targetParasites`: 数组存储，支持多种寄生虫
- `dosage`: 文本描述，如"1片"、"0.5ml"
- 创建索引：`petId + plannedDate`、`petId + type + status`

---

### 5. Reminder (提醒表)

```typescript
interface Reminder {
  _id: string;              // 主键
  userId: string;           // 关联用户ID，外键
  petId: string;            // 关联宠物ID，外键
  type: 'vaccine'|'deworm'|'checkup'|'custom'; // 提醒类型
  title: string;            // 提醒标题
  content?: string;         // 提醒详细内容
  fireAt: string;           // 触发时间 ISO 8601 datetime
  status: 'pending'|'sent'|'done'|'cancelled'; // 提醒状态
  subscribeMsgTemplateId?: string; // 微信订阅消息模板ID
  relatedRecordId?: string; // 关联的记录ID
  reminderDays: number;     // 提前几天提醒
  isRepeating?: boolean;    // 是否重复提醒
  repeatInterval?: number;  // 重复间隔(天)
  createdAt: string;        // 创建时间
  updatedAt?: string;       // 更新时间
}
```

**字段说明：**
- `fireAt`: 精确到分钟的触发时间
- `relatedRecordId`: 链接到具体的疫苗或驱虫记录
- `subscribeMsgTemplateId`: 支持微信订阅消息
- 创建索引：`userId + fireAt`、`status + fireAt`、`petId + type + status`

---

### 6. Knowledge (知识库表)

```typescript
interface Knowledge {
  _id: string;              // 主键
  slug: string;             // URL友好标识符，唯一索引
  title: string;            // 文章标题
  category: 'vaccine'|'deworm'|'health'|'nutrition'|'care'|'emergency'; // 分类
  summary?: string;         // 文章摘要
  contentMD: string;        // Markdown格式内容
  tags?: string[];          // 标签数组
  readTime?: number;        // 预估阅读时间(分钟)
  viewCount?: number;       // 阅读次数
  isPublished: boolean;     // 是否发布
  author?: string;          // 作者
  coverImage?: string;      // 封面图URL
  createdAt: string;        // 创建时间
  updatedAt: string;        // 更新时间
}
```

**字段说明：**
- `slug`: SEO友好的URL标识
- `contentMD`: 支持富文本内容
- `tags`: 支持多标签分类
- 创建索引：`slug` (唯一)、`category + isPublished + updatedAt`

---

### 7. Settings (用户设置表)

```typescript
interface Settings {
  _id: string;              // 主键
  userId: string;           // 关联用户ID，外键，唯一索引
  notifyAheadDays: number;  // 提前几天提醒，默认3天
  timezone?: string;        // 时区，默认Asia/Shanghai
  reminderTime?: string;    // 提醒时间 HH:mm，默认09:00
  enablePushNotification: boolean;  // 启用推送通知
  enableSmsNotification: boolean;   // 启用短信通知
  enableEmailNotification: boolean; // 启用邮件通知
  vaccinePeriodMonths: number;      // 疫苗周期(月)，默认12
  dewormPeriodDays: number;         // 驱虫周期(天)，默认90
  autoCreateReminders: boolean;     // 自动创建提醒
  privacyLevel: 'public'|'friends'|'private'; // 隐私级别
  dataBackup: boolean;              // 启用数据备份
  createdAt: string;        // 创建时间
  updatedAt: string;        // 更新时间
}
```

**字段说明：**
- `notifyAheadDays`: 个性化提醒时间
- `vaccinePeriodMonths/dewormPeriodDays`: 个性化周期设置
- `privacyLevel`: 为社交功能预留
- 创建索引：`userId` (唯一)

---

## 🔍 数据库索引策略

### 复合索引设计

```typescript
// 1. 用户相关索引
users: [
  { fields: [{ field: 'openid', direction: 1 }], unique: true },
  { fields: [{ field: 'createdAt', direction: -1 }] }
]

// 2. 宠物相关索引
pets: [
  { fields: [{ field: 'userId', direction: 1 }, { field: 'createdAt', direction: -1 }] },
  { fields: [{ field: 'userId', direction: 1 }, { field: 'species', direction: 1 }] },
  { fields: [{ field: 'species', direction: 1 }, { field: 'breed', direction: 1 }] }
]

// 3. 疫苗记录索引
vaccine_records: [
  { fields: [{ field: 'petId', direction: 1 }, { field: 'plannedDate', direction: -1 }] },
  { fields: [{ field: 'petId', direction: 1 }, { field: 'status', direction: 1 }] },
  { fields: [{ field: 'status', direction: 1 }, { field: 'plannedDate', direction: 1 }] }
]

// 4. 提醒相关索引
reminders: [
  { fields: [{ field: 'userId', direction: 1 }, { field: 'fireAt', direction: 1 }] },
  { fields: [{ field: 'status', direction: 1 }, { field: 'fireAt', direction: 1 }] },
  { fields: [{ field: 'petId', direction: 1 }, { field: 'type', direction: 1 }] }
]
```

### 查询性能优化

1. **高频查询优化**
   - 用户宠物列表：`userId + createdAt` 复合索引
   - 待办提醒查询：`status + fireAt` 复合索引
   - 宠物记录查询：`petId + plannedDate` 复合索引

2. **范围查询优化**
   - 日期范围查询将范围字段放在索引最后
   - 状态筛选放在范围查询之前

3. **文本搜索优化**
   - 知识库文章使用 `tags` 数组索引
   - 考虑引入全文搜索服务

---

## 💾 本地存储策略

### 存储键名设计

```typescript
export const StorageKeys = {
  // 用户数据
  USER_INFO: 'user_info',                    // 当前用户信息
  USER_SETTINGS: 'user_settings',            // 用户设置
  
  // 宠物数据
  PETS: 'pets',                              // 宠物列表
  PETS_CACHE: 'pets_cache',                  // 宠物缓存
  
  // 记录数据
  VACCINE_RECORDS: 'vaccine_records',        // 疫苗记录
  DEWORM_RECORDS: 'deworm_records',          // 驱虫记录
  
  // 提醒数据
  REMINDERS: 'reminders',                    // 提醒列表
  REMINDER_SETTINGS: 'reminder_settings',    // 提醒设置
  
  // 知识库
  KNOWLEDGE_CACHE: 'knowledge_cache',        // 知识库缓存
  KNOWLEDGE_FAVORITES: 'knowledge_favorites', // 收藏文章
  
  // 缓存控制
  CACHE_TIMESTAMP: 'cache_timestamp',        // 缓存时间戳
  LAST_SYNC_TIME: 'last_sync_time',          // 最后同步时间
}
```

### 缓存过期策略

```typescript
export const CacheExpiration = {
  USER_INFO: 24 * 60 * 60 * 1000,        // 24小时
  PETS: 12 * 60 * 60 * 1000,             // 12小时  
  RECORDS: 6 * 60 * 60 * 1000,           // 6小时
  REMINDERS: 30 * 60 * 1000,             // 30分钟
  KNOWLEDGE: 7 * 24 * 60 * 60 * 1000,    // 7天
  SETTINGS: 24 * 60 * 60 * 1000,         // 24小时
}
```

### 数据一致性保证

1. **写入策略**
   - 优先写入云端，失败时写入本地
   - 使用事务保证多表数据一致性
   - 冲突解决：以最新时间戳为准

2. **读取策略**
   - 优先读取本地缓存
   - 缓存过期时从云端刷新
   - 降级处理：云端失败时使用本地数据

3. **同步策略**
   - 应用启动时自动同步
   - 网络恢复时增量同步
   - 定期全量备份

---

## 🔄 数据迁移方案

### 1. Mock数据生成

```typescript
// 生成测试用户
const mockUsers = SeedDataGenerator.generateMockUsers(3);

// 生成测试宠物  
const mockPets = SeedDataGenerator.generateMockPets(userId, 2);

// 生成测试记录
const vaccineRecords = SeedDataGenerator.generateMockVaccineRecords(petId, 'dog');
const dewormRecords = SeedDataGenerator.generateMockDewormRecords(petId);

// 生成测试提醒
const reminders = SeedDataGenerator.generateMockReminders(userId, petId);
```

### 2. 本地到云端迁移

```typescript
// 迁移用户数据到云数据库
await DataMigration.migrateToCloud();

// 结果示例：
// { success: true, message: "成功迁移 25 条记录到云数据库" }
```

### 3. 云端到本地备份

```typescript
// 备份云端数据到本地
await DataMigration.backupFromCloud(userId);

// 结果示例：
// { success: true, message: "成功备份 25 条记录到本地" }
```

### 4. 数据清理工具

```typescript
// 清理过期缓存
DataMigration.clearLocalCache();

// 初始化开发数据
await DataMigration.initDevelopmentData();
```

---

## 🔒 安全与隐私

### 数据脱敏策略

1. **敏感信息脱敏**
   ```typescript
   // 手机号脱敏
   phone: "138****8000"
   
   // 宠物医疗记录最小化
   allergies: ["过敏源A"] // 不存储具体药物名称
   ```

2. **数据访问控制**
   ```typescript
   // 云数据库安全规则
   read: "doc._openid == auth.openid"
   write: "doc._openid == auth.openid" 
   ```

3. **本地数据加密**
   ```typescript
   // 敏感数据加密存储
   CacheManager.set(key, data, expiration, { encrypt: true });
   ```

### 数据备份策略

1. **自动备份**
   - 每日自动备份到云端
   - 本地保留最近7天的备份

2. **手动备份**
   - 用户可手动触发数据导出
   - 支持JSON格式数据包下载

3. **数据恢复**
   - 支持从备份恢复数据
   - 提供数据版本选择

---

## 📈 性能优化建议

### 1. 查询优化

- **分页查询**：大列表使用分页加载
- **索引覆盖**：查询字段全部包含在索引中
- **查询计划**：使用 `explain()` 分析查询性能

### 2. 缓存策略

- **多级缓存**：内存 → 本地存储 → 云数据库
- **预加载**：应用启动时预加载常用数据
- **懒加载**：非关键数据按需加载

### 3. 数据压缩

- **大文档压缩**：知识库文章内容使用压缩存储
- **批量操作**：合并多个小请求为批量请求
- **增量同步**：只同步变更的数据

---

## 🚀 部署与运维

### 微信云开发配置

1. **环境配置**
   ```bash
   # 开发环境
   env: 'dev-xxx'
   
   # 生产环境  
   env: 'prod-xxx'
   ```

2. **集合创建**
   ```javascript
   // 在云开发控制台执行
   const collections = ['users', 'pets', 'vaccine_records', 'deworm_records', 'reminders', 'knowledge', 'settings'];
   ```

3. **索引创建**
   ```javascript
   // 参考 database-indices.ts 中的配置
   db.collection("pets").createIndex({"userId": 1, "createdAt": -1}, {name: "userId_created"});
   ```

### 自建后端迁移

1. **API设计**
   ```typescript
   // RESTful API 设计
   GET    /api/pets           // 获取宠物列表
   POST   /api/pets           // 创建宠物
   PUT    /api/pets/:id       // 更新宠物
   DELETE /api/pets/:id       // 删除宠物
   ```

2. **数据库选择**
   - **MySQL**: 关系型数据，ACID事务支持
   - **MongoDB**: 文档型数据，与云开发兼容
   - **PostgreSQL**: 功能丰富，支持JSON字段

3. **迁移工具**
   ```typescript
   // 导出微信云开发数据
   const exportData = await CloudDBExporter.exportAll();
   
   // 导入到自建数据库
   await SelfHostedDBImporter.importData(exportData);
   ```

---

## 📞 技术支持

如需了解更多实现细节，请参考：

- 📁 `/miniprogram/models/database.ts` - 完整数据模型定义
- 📁 `/miniprogram/services/database.ts` - 数据访问层实现  
- 📁 `/miniprogram/services/database-indices.ts` - 索引配置
- 📁 `/miniprogram/scripts/migration.ts` - 迁移脚本
- 📁 `/miniprogram/utils/cache-manager.ts` - 缓存管理器

---

*本设计文档遵循数据最小化原则，保护用户隐私的同时提供完整的业务功能支持。*




