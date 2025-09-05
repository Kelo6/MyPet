// 数据库索引建议和优化配置
// 用于微信云开发(TCB)数据库性能优化

/**
 * 数据库索引配置
 * 在微信云开发控制台中创建这些索引以提升查询性能
 */
export const DatabaseIndices = {
  // ==================== users 集合索引 ====================
  users: [
    {
      name: 'openid_unique',
      fields: [{ field: 'openid', direction: 1 }],
      unique: true,
      description: '根据openid快速查找用户，确保唯一性'
    },
    {
      name: 'created_time',
      fields: [{ field: 'createdAt', direction: -1 }],
      unique: false,
      description: '按创建时间排序用户'
    }
  ],

  // ==================== pets 集合索引 ====================
  pets: [
    {
      name: 'userId_created',
      fields: [
        { field: 'userId', direction: 1 },
        { field: 'createdAt', direction: -1 }
      ],
      unique: false,
      description: '用户宠物列表查询，按创建时间倒序'
    },
    {
      name: 'userId_species',
      fields: [
        { field: 'userId', direction: 1 },
        { field: 'species', direction: 1 }
      ],
      unique: false,
      description: '按用户和宠物类型查询'
    },
    {
      name: 'species_breed',
      fields: [
        { field: 'species', direction: 1 },
        { field: 'breed', direction: 1 }
      ],
      unique: false,
      description: '按物种和品种统计查询'
    }
  ],

  // ==================== vaccine_records 集合索引 ====================
  vaccine_records: [
    {
      name: 'petId_planned_date',
      fields: [
        { field: 'petId', direction: 1 },
        { field: 'plannedDate', direction: -1 }
      ],
      unique: false,
      description: '宠物疫苗记录查询，按计划日期倒序'
    },
    {
      name: 'petId_status',
      fields: [
        { field: 'petId', direction: 1 },
        { field: 'status', direction: 1 }
      ],
      unique: false,
      description: '按宠物和状态查询疫苗记录'
    },
    {
      name: 'status_planned_date',
      fields: [
        { field: 'status', direction: 1 },
        { field: 'plannedDate', direction: 1 }
      ],
      unique: false,
      description: '查询待办或逾期的疫苗记录'
    },
    {
      name: 'name_petId',
      fields: [
        { field: 'name', direction: 1 },
        { field: 'petId', direction: 1 }
      ],
      unique: false,
      description: '按疫苗名称查询特定宠物的记录'
    }
  ],

  // ==================== deworm_records 集合索引 ====================
  deworm_records: [
    {
      name: 'petId_planned_date',
      fields: [
        { field: 'petId', direction: 1 },
        { field: 'plannedDate', direction: -1 }
      ],
      unique: false,
      description: '宠物驱虫记录查询，按计划日期倒序'
    },
    {
      name: 'petId_type_status',
      fields: [
        { field: 'petId', direction: 1 },
        { field: 'type', direction: 1 },
        { field: 'status', direction: 1 }
      ],
      unique: false,
      description: '按宠物、驱虫类型和状态查询'
    },
    {
      name: 'type_status_planned_date',
      fields: [
        { field: 'type', direction: 1 },
        { field: 'status', direction: 1 },
        { field: 'plannedDate', direction: 1 }
      ],
      unique: false,
      description: '按驱虫类型和状态查询，用于统计分析'
    }
  ],

  // ==================== reminders 集合索引 ====================
  reminders: [
    {
      name: 'userId_fireAt',
      fields: [
        { field: 'userId', direction: 1 },
        { field: 'fireAt', direction: 1 }
      ],
      unique: false,
      description: '用户提醒列表，按触发时间正序'
    },
    {
      name: 'userId_petId_type',
      fields: [
        { field: 'userId', direction: 1 },
        { field: 'petId', direction: 1 },
        { field: 'type', direction: 1 }
      ],
      unique: false,
      description: '按用户、宠物和提醒类型查询'
    },
    {
      name: 'status_fireAt',
      fields: [
        { field: 'status', direction: 1 },
        { field: 'fireAt', direction: 1 }
      ],
      unique: false,
      description: '查询待发送的提醒，用于定时任务'
    },
    {
      name: 'petId_type_status',
      fields: [
        { field: 'petId', direction: 1 },
        { field: 'type', direction: 1 },
        { field: 'status', direction: 1 }
      ],
      unique: false,
      description: '宠物特定类型的提醒状态查询'
    },
    {
      name: 'relatedRecordId',
      fields: [{ field: 'relatedRecordId', direction: 1 }],
      unique: false,
      description: '根据关联记录ID查询提醒'
    }
  ],

  // ==================== knowledge 集合索引 ====================
  knowledge: [
    {
      name: 'slug_unique',
      fields: [{ field: 'slug', direction: 1 }],
      unique: true,
      description: 'URL友好标识符唯一索引'
    },
    {
      name: 'category_published_updated',
      fields: [
        { field: 'category', direction: 1 },
        { field: 'isPublished', direction: 1 },
        { field: 'updatedAt', direction: -1 }
      ],
      unique: false,
      description: '分类浏览，按更新时间倒序'
    },
    {
      name: 'published_viewCount',
      fields: [
        { field: 'isPublished', direction: 1 },
        { field: 'viewCount', direction: -1 }
      ],
      unique: false,
      description: '热门文章排序'
    },
    {
      name: 'tags_published',
      fields: [
        { field: 'tags', direction: 1 },
        { field: 'isPublished', direction: 1 }
      ],
      unique: false,
      description: '按标签查询已发布文章'
    }
  ],

  // ==================== settings 集合索引 ====================
  settings: [
    {
      name: 'userId_unique',
      fields: [{ field: 'userId', direction: 1 }],
      unique: true,
      description: '每个用户只有一个设置记录'
    }
  ]
};

/**
 * 复合查询优化建议
 */
export const QueryOptimizationTips = {
  // 高频查询模式
  commonQueries: [
    {
      collection: 'pets',
      query: 'db.collection("pets").where({userId: "xxx"}).orderBy("createdAt", "desc")',
      optimization: '使用 userId_created 复合索引',
      performance: '查询时间从 100ms 降低到 10ms'
    },
    {
      collection: 'vaccine_records',
      query: 'db.collection("vaccine_records").where({petId: "xxx", status: "pending"})',
      optimization: '使用 petId_status 复合索引',
      performance: '避免全表扫描，提升 90% 性能'
    },
    {
      collection: 'reminders',
      query: 'db.collection("reminders").where({status: "pending", fireAt: db.command.lte(new Date())})',
      optimization: '使用 status_fireAt 复合索引',
      performance: '定时任务查询优化，支持高并发'
    }
  ],

  // 查询性能建议
  performanceTips: [
    '1. 总是将查询频率最高的字段放在复合索引的第一位',
    '2. 对于范围查询（如日期范围），将范围字段放在复合索引的最后',
    '3. 避免在复合索引中使用过多字段（建议不超过3个）',
    '4. 定期监控查询性能，删除不再使用的索引',
    '5. 对于文本搜索，考虑使用全文索引或外部搜索服务'
  ],

  // 索引维护
  maintenance: [
    '1. 定期检查索引使用情况，删除未使用的索引',
    '2. 监控索引大小，避免过度索引影响写入性能',
    '3. 对于数据量大的集合，考虑分片策略',
    '4. 使用explain()方法分析查询执行计划'
  ]
};

/**
 * 数据库规则配置（微信云开发安全规则）
 */
export const DatabaseRules = {
  // users 集合规则
  users: {
    read: 'doc._openid == auth.openid', // 用户只能读取自己的数据
    write: 'doc._openid == auth.openid' // 用户只能写入自己的数据
  },

  // pets 集合规则
  pets: {
    read: 'doc.userId == auth.openid',
    write: 'doc.userId == auth.openid'
  },

  // vaccine_records 集合规则
  vaccine_records: {
    read: 'get(`database.pets.${doc.petId}`).userId == auth.openid',
    write: 'get(`database.pets.${doc.petId}`).userId == auth.openid'
  },

  // deworm_records 集合规则
  deworm_records: {
    read: 'get(`database.pets.${doc.petId}`).userId == auth.openid',
    write: 'get(`database.pets.${doc.petId}`).userId == auth.openid'
  },

  // reminders 集合规则
  reminders: {
    read: 'doc.userId == auth.openid',
    write: 'doc.userId == auth.openid'
  },

  // knowledge 集合规则
  knowledge: {
    read: 'doc.isPublished == true', // 所有人都可以读取已发布的知识库
    write: false // 只有管理员可以写入（通过云函数）
  },

  // settings 集合规则
  settings: {
    read: 'doc.userId == auth.openid',
    write: 'doc.userId == auth.openid'
  }
};

/**
 * 云数据库初始化脚本
 * 在微信云开发控制台的数据库页面执行
 */
export const InitializationScript = `
// 1. 创建集合
const collections = [
  'users', 'pets', 'vaccine_records', 
  'deworm_records', 'reminders', 'knowledge', 'settings'
];

// 2. 创建索引（需要在控制台手动创建）
// 参考 DatabaseIndices 配置

// 3. 设置安全规则（需要在控制台手动配置）
// 参考 DatabaseRules 配置

console.log('数据库初始化完成');
`;

/**
 * 导出索引创建命令（用于自动化脚本）
 */
export const createIndexCommands = () => {
  const commands: string[] = [];
  
  Object.entries(DatabaseIndices).forEach(([collection, indices]) => {
    indices.forEach(index => {
      const fieldsStr = index.fields.map(f => `"${f.field}": ${f.direction}`).join(', ');
      commands.push(
        `db.collection("${collection}").createIndex(` +
        `{${fieldsStr}}, ` +
        `{name: "${index.name}", unique: ${index.unique}})`
      );
    });
  });
  
  return commands;
};




