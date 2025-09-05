# 云函数目录

本目录用于存放微信云开发的云函数。

## 使用说明

### 1. 创建云函数

1. 在微信开发者工具中右键此目录
2. 选择 "新建Node.js云函数"
3. 输入函数名称

### 2. 常用云函数示例

#### 用户认证函数 (login)
```javascript
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
```

#### 定时提醒函数 (reminder)
```javascript
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  // 查询需要提醒的日程
  const db = cloud.database()
  const schedules = await db.collection('schedules')
    .where({
      status: 'pending',
      scheduledDate: db.command.lte(new Date())
    })
    .get()
  
  // 发送提醒消息
  for (const schedule of schedules.data) {
    await cloud.openapi.subscribeMessage.send({
      touser: schedule.userId,
      template_id: 'YOUR_TEMPLATE_ID',
      data: {
        thing1: { value: schedule.title },
        date2: { value: schedule.scheduledDate }
      }
    })
  }
  
  return { success: true }
}
```

### 3. 数据库集合设计

#### pets 集合
```javascript
{
  _id: "auto_generated",
  _openid: "user_openid",
  name: "宠物名称",
  type: "dog|cat|bird|rabbit|hamster|other",
  breed: "品种",
  gender: "male|female|neutered_male|spayed_female",
  birthDate: "2023-01-01",
  weight: 5.5,
  avatar: "云存储文件ID",
  microchipId: "芯片号",
  ownerInfo: {
    name: "主人姓名",
    phone: "手机号"
  },
  medicalInfo: {
    allergies: ["过敏源"],
    chronicDiseases: ["慢性疾病"],
    veterinarian: {
      name: "兽医姓名",
      clinic: "诊所名称",
      phone: "联系电话"
    }
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

#### schedules 集合
```javascript
{
  _id: "auto_generated",
  _openid: "user_openid",
  petId: "pet_id",
  type: "vaccine|deworming|checkup|grooming|custom",
  title: "日程标题",
  description: "详细描述",
  scheduledDate: "2024-01-01T00:00:00.000Z",
  completedDate: null,
  status: "pending|completed|overdue|cancelled",
  reminders: [{
    type: "push|sms|email",
    triggerTime: "2024-01-01T00:00:00.000Z",
    message: "提醒内容",
    isEnabled: true,
    isSent: false
  }],
  vaccineInfo: {
    vaccineName: "疫苗名称",
    manufacturer: "生产厂家",
    batchNumber: "批次号",
    veterinarian: "接种兽医",
    clinic: "接种诊所",
    nextDueDate: "2025-01-01",
    notes: "备注"
  },
  dewormingInfo: {
    medicationName: "药物名称",
    dosage: "剂量",
    targetParasites: ["目标寄生虫"],
    veterinarian: "开药兽医",
    clinic: "开药诊所",
    nextDueDate: "2024-04-01",
    notes: "备注"
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### 4. 云函数部署

1. 右键云函数文件夹
2. 选择 "创建并部署：云端安装依赖"
3. 等待部署完成

### 5. 定时触发器

在云函数配置中添加定时触发器：
```
0 9 * * * // 每天早上9点执行
```

## 注意事项

1. 云函数需要在云开发控制台中配置相应权限
2. 使用订阅消息需要先配置模板
3. 定时触发器需要在云开发控制台中设置
4. 注意云函数的并发限制和调用次数限制
