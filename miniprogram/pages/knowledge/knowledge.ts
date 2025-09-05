// pages/knowledge/knowledge.ts
import { DatabaseService } from '../../services/database';
import { Knowledge } from '../../models/database';
import { DateUtils } from '../../utils/date';

// 知识分类
interface KnowledgeCategory {
  value: string;
  label: string;
  icon: string;
  count: number;
}

// 统计信息
interface KnowledgeStats {
  total: number;
  [key: string]: number;
}

Page({
  data: {
    // 基础数据
    allArticles: [] as Knowledge[],
    filteredArticles: [] as Knowledge[],
    featuredArticles: [] as Knowledge[],
    
    // 搜索和筛选
    searchKeyword: '',
    selectedCategory: 'all',
    
    // 分类和统计
    categories: [
      { value: 'health', label: '健康护理', icon: '🏥', count: 0 },
      { value: 'nutrition', label: '营养饮食', icon: '🍖', count: 0 },
      { value: 'training', label: '训练教育', icon: '🎓', count: 0 },
      { value: 'behavior', label: '行为习性', icon: '🐕', count: 0 },
      { value: 'emergency', label: '急救常识', icon: '🚨', count: 0 },
      { value: 'breeding', label: '繁育知识', icon: '👶', count: 0 },
      { value: 'grooming', label: '美容护理', icon: '✂️', count: 0 },
      { value: 'lifestyle', label: '生活贴士', icon: '🏠', count: 0 },
    ] as KnowledgeCategory[],
    
    stats: {
      total: 0,
    } as KnowledgeStats,
    
    // 状态
    loading: false,
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 页面显示时重新加载数据
    this.loadData();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载数据
   */
  async loadData() {
    this.setData({ loading: true });
    
    try {
      // 加载知识库文章（使用模拟数据）
      const articlesResult = await this.loadMockArticles();
      
      if (articlesResult.success) {
        const allArticles = articlesResult.data || [];
        
        // 计算统计信息
        const stats = this.calculateStats(allArticles);
        const categories = this.updateCategoryCounts(allArticles);
        
        // 获取推荐文章（最新更新的前3篇）
        const featuredArticles = allArticles
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 3);
        
        this.setData({ 
          allArticles, 
          stats, 
          categories, 
          featuredArticles 
        });
        
        this.filterArticles();
      } else {
        throw new Error('加载知识库失败');
      }
    } catch (error) {
      console.error('加载知识库数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载模拟文章数据
   */
  async loadMockArticles(): Promise<{ success: boolean; data?: Knowledge[] }> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockArticles: Knowledge[] = [
      {
        _id: '1',
        slug: 'dog-vaccination-guide',
        title: '狗狗疫苗接种完全指南',
        category: 'health',
        isPublished: true,
        createdAt: '2024-01-15T10:00:00Z',
        contentMD: `# 狗狗疫苗接种完全指南

## 疫苗的重要性

疫苗接种是保护狗狗健康的重要措施，可以预防多种严重的传染性疾病。

## 疫苗种类

### 核心疫苗
- **狂犬病疫苗**：法律要求，预防狂犬病
- **犬瘟热疫苗**：预防犬瘟热病毒
- **犬细小病毒疫苗**：预防细小病毒感染
- **犬腺病毒疫苗**：预防传染性肝炎

### 非核心疫苗
- **犬窝咳疫苗**：预防犬窝咳
- **莱姆病疫苗**：预防莱姆病
- **钩端螺旋体疫苗**：预防钩端螺旋体病

## 接种时间表

### 幼犬（6-16周）
1. **6-8周**：第一次疫苗接种
2. **10-12周**：第二次疫苗接种
3. **14-16周**：第三次疫苗接种
4. **12-16周**：狂犬病疫苗

### 成犬
- 每年进行加强免疫
- 狂犬病疫苗根据当地法规要求

## 注意事项

1. **接种前检查**：确保狗狗身体健康
2. **观察反应**：接种后观察是否有不良反应
3. **记录保存**：保存好疫苗接种记录
4. **定期复查**：按时进行加强免疫

## 可能的副作用

- 注射部位轻微疼痛
- 轻微发热
- 食欲下降
- 嗜睡

如出现严重反应，请立即联系兽医。`,
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        _id: '2',
        slug: 'cat-nutrition-basics',
        title: '猫咪营养需求基础知识',
        category: 'nutrition',
        isPublished: true,
        createdAt: '2024-01-14T15:30:00Z',
        contentMD: `# 猫咪营养需求基础知识

## 猫咪的营养特点

猫咪是严格的肉食动物，有着独特的营养需求。

## 必需营养素

### 蛋白质
- 成年猫需要至少26%的蛋白质
- 幼猫需要至少30%的蛋白质
- 优质动物蛋白是首选

### 脂肪
- 提供必需脂肪酸
- 成年猫需要至少9%的脂肪
- Omega-3和Omega-6脂肪酸很重要

### 碳水化合物
- 猫咪对碳水化合物需求很低
- 过多碳水化合物可能导致肥胖
- 选择低碳水化合物的食品

### 维生素和矿物质
- **牛磺酸**：猫咪必需氨基酸
- **维生素A**：不能从植物中获取
- **烟酸**：必须从食物中获得

## 喂食建议

### 幼猫（2-12个月）
- 每天3-4次
- 高蛋白高脂肪食品
- 自由采食

### 成年猫（1-7岁）
- 每天2次
- 维持体重的食品
- 控制食量

### 老年猫（7岁以上）
- 易消化食品
- 可能需要特殊配方
- 定期检查

## 禁忌食物

- 巧克力
- 洋葱和大蒜
- 葡萄和葡萄干
- 生鱼生肉
- 牛奶（成年猫）`,
        updatedAt: '2024-01-14T15:30:00Z',
      },
      {
        _id: '3',
        slug: 'pet-emergency-first-aid',
        title: '宠物急救基础知识',
        category: 'emergency',
        isPublished: true,
        createdAt: '2024-01-13T09:15:00Z',
        contentMD: `# 宠物急救基础知识

## 急救原则

在紧急情况下，正确的急救措施可能挽救宠物的生命。

## 常见紧急情况

### 外伤出血
1. **止血**：用干净布料压迫伤口
2. **包扎**：用绷带固定止血材料
3. **就医**：尽快送往动物医院

### 中毒
1. **识别症状**：呕吐、腹泻、抽搐、昏迷
2. **收集证据**：保留可疑物品
3. **联系兽医**：立即电话咨询
4. **不要催吐**：除非兽医指导

### 窒息
1. **检查口腔**：移除可见异物
2. **海姆立克法**：适用于小型犬猫
3. **人工呼吸**：必要时进行

### 骨折
1. **固定伤肢**：使用夹板或硬物
2. **避免移动**：减少二次伤害
3. **保暖镇静**：安抚宠物情绪

## 急救包准备

### 必备物品
- 无菌纱布
- 医用胶带
- 消毒液
- 体温计
- 手电筒
- 紧急联系电话

### 药物
- 生理盐水
- 碘伏
- 抗过敏药（兽医推荐）

## 预防措施

1. **定期检查**：及时发现健康问题
2. **环境安全**：移除危险物品
3. **疫苗接种**：预防传染病
4. **学习知识**：了解基本急救`,
        updatedAt: '2024-01-13T09:15:00Z',
      },
      {
        _id: '4',
        slug: 'puppy-training-basics',
        title: '幼犬基础训练方法',
        category: 'care',
        isPublished: true,
        createdAt: '2024-01-12T14:20:00Z',
        contentMD: `# 幼犬基础训练方法

## 训练的重要性

早期训练有助于建立良好的行为习惯，让狗狗更好地融入家庭生活。

## 基础训练项目

### 如厕训练
1. **建立规律**：固定时间带出去
2. **选择地点**：指定排便区域
3. **及时奖励**：正确行为立即表扬
4. **清理彻底**：消除室内气味

### 基本指令
- **坐下（Sit）**：最基础的指令
- **趴下（Down）**：进阶服从训练
- **过来（Come）**：安全性训练
- **等待（Stay）**：自制力培养

### 社会化训练
1. **接触人类**：不同年龄的人
2. **接触动物**：其他狗狗和宠物
3. **环境适应**：不同场所和声音
4. **物品接触**：各种日常用品

## 训练原则

### 正向强化
- 使用奖励而非惩罚
- 及时给予反馈
- 保持一致性

### 耐心和坚持
- 每次训练时间不宜过长
- 重复练习直到熟练
- 循序渐进增加难度

## 常见问题解决

### 乱咬东西
- 提供合适的咬玩具
- 转移注意力
- 增加运动量

### 过度吠叫
- 找出吠叫原因
- 训练"安静"指令
- 避免强化不良行为

### 分离焦虑
- 逐渐增加独处时间
- 提供安全感物品
- 建立离开和回来的仪式`,
        updatedAt: '2024-01-12T14:20:00Z',
      },
      {
        _id: '5',
        slug: 'cat-behavior-understanding',
        title: '理解猫咪的行为语言',
        category: 'care',
        isPublished: true,
        createdAt: '2024-01-11T16:45:00Z',
        contentMD: `# 理解猫咪的行为语言

## 猫咪沟通方式

猫咪通过身体语言、声音和行为来表达情感和需求。

## 身体语言解读

### 尾巴语言
- **直立摆动**：兴奋或友好
- **炸毛竖立**：害怕或愤怒
- **缓慢摆动**：思考或专注
- **夹在腿间**：恐惧或紧张

### 耳朵位置
- **前倾竖立**：警觉或好奇
- **向后贴平**：害怕或愤怒
- **转动监听**：注意周围环境

### 眼神交流
- **慢慢眨眼**：信任和爱意
- **瞪视不眨**：挑衅或威胁
- **避免眼神**：顺从或害怕

## 声音含义

### 喵叫声
- **短促喵叫**：打招呼
- **长声喵叫**：要求或抱怨
- **颤音喵叫**：兴奋或打猎

### 呼噜声
- **满足呼噜**：舒适和快乐
- **紧张呼噜**：自我安慰
- **痛苦呼噜**：不适或疼痛

### 嘶叫和咆哮
- 威胁或恐惧的表现
- 要求保持距离
- 准备攻击的警告

## 常见行为含义

### 蹭人蹭物
- 标记气味
- 表达亲密
- 寻求关注

### 踩奶行为
- 回忆幼时安全感
- 表达满足和放松
- 对主人的信任

### 送"礼物"
- 展示狩猎能力
- 表达关爱
- 分享战利品

## 问题行为处理

### 乱抓家具
- 提供抓板
- 修剪指甲
- 使用驱避剂

### 不用猫砂盆
- 检查健康状况
- 清洁猫砂盆
- 更换猫砂类型

### 过度舔毛
- 排除皮肤病
- 减少压力源
- 增加互动时间`,
        updatedAt: '2024-01-11T16:45:00Z',
      },
    ];
    
    return { success: true, data: mockArticles };
  },

  /**
   * 计算统计信息
   */
  calculateStats(articles: Knowledge[]): KnowledgeStats {
    const stats: KnowledgeStats = { total: articles.length };
    
    articles.forEach(article => {
      if (stats[article.category]) {
        stats[article.category]++;
      } else {
        stats[article.category] = 1;
      }
    });
    
    return stats;
  },

  /**
   * 更新分类计数
   */
  updateCategoryCounts(articles: Knowledge[]): KnowledgeCategory[] {
    const { categories } = this.data;
    
    return categories.map(category => ({
      ...category,
      count: articles.filter(article => article.category === category.value).length,
    }));
  },

  /**
   * 筛选文章
   */
  filterArticles() {
    const { allArticles, searchKeyword, selectedCategory } = this.data;
    let filtered = allArticles;
    
    // 搜索筛选
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(keyword) ||
        article.contentMD.toLowerCase().includes(keyword)
      );
    }
    
    // 分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }
    
    this.setData({ filteredArticles: filtered });
  },

  /**
   * 搜索输入
   */
  onSearchInput(e: any) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    // 实时搜索
    this.filterArticles();
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.filterArticles();
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({ 
      searchKeyword: '',
      selectedCategory: 'all',
    });
    this.filterArticles();
  },

  /**
   * 选择分类
   */
  onCategorySelect(e: any) {
    const category = e.currentTarget.dataset.category;
    this.setData({ selectedCategory: category });
    this.filterArticles();
  },

  /**
   * 重置分类
   */
  onResetCategory() {
    this.setData({ selectedCategory: 'all' });
    this.filterArticles();
  },

  /**
   * 查看文章详情
   */
  onArticleDetail(e: any) {
    const article = e.currentTarget.dataset.article;
    wx.navigateTo({
      url: `/pages/knowledge-detail/knowledge-detail?id=${article._id}`,
    });
  },

  /**
   * 意见反馈
   */
  onFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈！您可以通过以下方式联系我们：\n\n• 小程序内客服消息\n• 邮箱：feedback@mypet.com',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  /**
   * 内容建议
   */
  onRequestContent() {
    wx.showModal({
      title: '内容建议',
      content: '您希望我们增加什么类型的宠物知识？',
      editable: true,
      placeholderText: '请输入您的建议...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.showToast({
            title: '感谢您的建议！',
            icon: 'success',
          });
          // TODO: 提交建议到服务器
          console.log('用户建议:', res.content);
        }
      },
    });
  },

  // 工具方法
  getCategoryLabel(category: string): string {
    const categoryItem = this.data.categories.find(c => c.value === category);
    return categoryItem ? categoryItem.label : category;
  },

  getCategoryIcon(category: string): string {
    const categoryItem = this.data.categories.find(c => c.value === category);
    return categoryItem ? categoryItem.icon : '📚';
  },

  getArticleSummary(contentMD: string): string {
    // 提取Markdown内容的摘要
    const plainText = contentMD
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接标记
      .replace(/`([^`]+)`/g, '$1') // 移除代码标记
      .replace(/\n+/g, ' ') // 替换换行为空格
      .trim();
    
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  },

  getReadingTime(contentMD: string): number {
    // 估算阅读时间（按每分钟200字计算）
    const wordCount = contentMD.length;
    return Math.max(1, Math.ceil(wordCount / 200));
  },

  formatDate(dateStr: string): string {
    return DateUtils.format(new Date(dateStr), 'MM月DD日');
  },

  getEmptyTitle(): string {
    const { selectedCategory } = this.data;
    if (selectedCategory === 'all') {
      return '暂无文章';
    }
    return `暂无${this.getCategoryLabel(selectedCategory)}文章`;
  },

  getEmptyDescription(): string {
    return '我们正在努力为您准备更多优质内容';
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '宠物健康助手 - 知识库',
      path: '/pages/knowledge/knowledge',
    };
  },
});