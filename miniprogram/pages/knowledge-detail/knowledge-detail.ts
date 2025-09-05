// pages/knowledge-detail/knowledge-detail.ts
import { Knowledge } from '../../models/database';
import { DateUtils } from '../../utils/date';

Page({
  data: {
    // 文章数据
    article: {} as Knowledge,
    relatedArticles: [] as Knowledge[],
    
    // 渲染内容
    renderedContent: '',
    
    // 状态
    loading: true,
    isCollected: false,
    
    // 分类信息
    categories: [
      { value: 'health', label: '健康护理', icon: '🏥' },
      { value: 'nutrition', label: '营养饮食', icon: '🍖' },
      { value: 'training', label: '训练教育', icon: '🎓' },
      { value: 'behavior', label: '行为习性', icon: '🐕' },
      { value: 'emergency', label: '急救常识', icon: '🚨' },
      { value: 'breeding', label: '繁育知识', icon: '👶' },
      { value: 'grooming', label: '美容护理', icon: '✂️' },
      { value: 'lifestyle', label: '生活贴士', icon: '🏠' },
    ],
  },

  onLoad(options: any) {
    const articleId = options.id;
    if (articleId) {
      this.loadArticle(articleId);
    } else {
      wx.showToast({
        title: '文章不存在',
        icon: 'error',
      });
      wx.navigateBack();
    }
  },

  /**
   * 加载文章详情
   */
  async loadArticle(articleId: string) {
    this.setData({ loading: true });
    
    try {
      // 加载文章详情（使用模拟数据）
      const articleResult = await this.loadMockArticle(articleId);
      
      if (articleResult.success && articleResult.data) {
        const article = articleResult.data;
        
        // 渲染Markdown内容
        const renderedContent = this.renderMarkdown(article.contentMD);
        
        // 加载相关文章
        const relatedArticles = await this.loadRelatedArticles(article);
        
        // 检查收藏状态
        const isCollected = await this.checkCollectionStatus(articleId);
        
        this.setData({
          article,
          renderedContent,
          relatedArticles,
          isCollected,
        });
        
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: article.title.length > 10 ? article.title.substring(0, 10) + '...' : article.title,
        });
      } else {
        throw new Error('文章不存在');
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
      wx.navigateBack();
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载模拟文章数据
   */
  async loadMockArticle(articleId: string): Promise<{ success: boolean; data?: Knowledge }> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 模拟数据（与knowledge页面保持一致）
    const mockArticles: Record<string, Knowledge> = {
      '1': {
        _id: '1',
        slug: 'dog-vaccination-guide',
        title: '狗狗疫苗接种完全指南',
        category: 'health',
        isPublished: true,
        createdAt: '2024-01-15T10:00:00Z',
        contentMD: `# 狗狗疫苗接种完全指南

疫苗接种是保护狗狗健康的最重要措施之一，可以有效预防多种严重的传染性疾病。作为负责任的宠物主人，了解疫苗接种的相关知识至关重要。

## 疫苗的重要性

疫苗通过刺激狗狗的免疫系统产生抗体，从而在真正遇到病原体时能够快速识别并消灭它们。这不仅保护了您的狗狗，也有助于维护整个社区宠物的健康。

## 疫苗种类详解

### 核心疫苗（必须接种）

**狂犬病疫苗**
- 法律强制要求接种
- 预防致命的狂犬病病毒
- 对人类也有传播风险

**犬瘟热疫苗**
- 预防犬瘟热病毒感染
- 症状包括发热、咳嗽、神经症状
- 致死率极高，必须预防

**犬细小病毒疫苗**
- 预防细小病毒性肠炎
- 主要影响幼犬
- 症状包括严重腹泻、呕吐

**犬腺病毒疫苗**
- 预防传染性肝炎
- 影响肝脏、眼部等器官
- 可导致急性肝衰竭

### 非核心疫苗（根据风险评估）

**犬窝咳疫苗**
- 预防犬传染性气管支气管炎
- 适合经常与其他狗接触的犬只
- 症状为持续性咳嗽

**莱姆病疫苗**
- 预防蜱虫传播的莱姆病
- 适合蜱虫高发地区
- 可导致关节炎和肾病

**钩端螺旋体疫苗**
- 预防钩端螺旋体病
- 通过污染的水源传播
- 可传播给人类

## 详细接种时间表

### 幼犬免疫程序（6-16周）

**6-8周龄**
- 第一次核心疫苗接种
- 包含犬瘟热、细小病毒、腺病毒
- 此时母源抗体开始下降

**10-12周龄**
- 第二次核心疫苗接种
- 加强免疫效果
- 可考虑添加非核心疫苗

**14-16周龄**
- 第三次核心疫苗接种
- 确保充分免疫保护
- 完成基础免疫程序

**12-16周龄**
- 狂犬病疫苗首次接种
- 法律要求的最低年龄
- 单独接种效果更好

### 成犬维持免疫

**年度加强免疫**
- 每年接种一次核心疫苗
- 维持有效的抗体水平
- 根据抗体检测调整频率

**狂犬病疫苗**
- 根据当地法规要求
- 通常每1-3年接种一次
- 保持有效的法律证明

## 接种前后注意事项

### 接种前准备

1. **健康检查**
   - 确保狗狗身体健康
   - 体温正常，精神状态良好
   - 无腹泻、呕吐等症状

2. **驱虫处理**
   - 接种前1-2周完成驱虫
   - 肠道寄生虫会影响免疫效果
   - 选择安全有效的驱虫药

3. **避免应激**
   - 接种前保持正常作息
   - 避免长途旅行或环境变化
   - 确保充足的休息

### 接种后护理

1. **观察反应**
   - 接种后24-48小时密切观察
   - 注意注射部位是否肿胀
   - 监测体温和精神状态

2. **限制活动**
   - 接种后1-2天避免剧烈运动
   - 不要洗澡或游泳
   - 保持安静的环境

3. **饮食调理**
   - 提供易消化的食物
   - 保证充足的饮水
   - 如食欲下降属正常现象

## 可能的不良反应

### 轻微反应（常见）
- 注射部位轻微疼痛或肿胀
- 轻度发热（体温升高1-2度）
- 食欲暂时下降
- 嗜睡或精神沉郁

### 严重反应（罕见）
- 过敏性休克
- 持续高热
- 严重呕吐腹泻
- 呼吸困难

**重要提醒**：如出现严重反应，请立即联系兽医！

## 特殊情况处理

### 怀孕母犬
- 一般不建议接种活疫苗
- 可接种灭活疫苗维持免疫
- 产前2-4周接种可提高母源抗体

### 老年犬
- 免疫功能可能下降
- 需要更频繁的抗体检测
- 可能需要调整疫苗种类和频率

### 免疫缺陷犬
- 需要兽医制定个性化方案
- 可能无法接种活疫苗
- 需要额外的保护措施

## 疫苗接种记录

建议建立完整的疫苗接种档案，包括：
- 接种日期和疫苗种类
- 生产厂家和批号
- 接种医院和兽医签名
- 下次接种提醒日期

这些记录对于：
- 制定后续免疫计划
- 宠物寄养和旅行
- 疾病诊断参考
都具有重要价值。

## 总结

疫苗接种是一项长期的健康投资，正确的免疫程序可以让您的狗狗远离多种致命疾病。请务必选择正规的动物医院，遵循专业兽医的建议，为您的毛孩子建立完善的免疫保护。

记住：预防永远比治疗更重要！`,
        updatedAt: '2024-01-15T10:00:00Z',
      },
      // 可以添加更多文章...
    };
    
    const article = mockArticles[articleId];
    return article ? { success: true, data: article } : { success: false };
  },

  /**
   * 渲染Markdown内容为富文本
   */
  renderMarkdown(markdown: string): string {
    // 简单的Markdown转HTML实现
    let html = markdown
      // 标题
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 粗体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 代码
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // 换行
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    // 包装段落
    html = '<p>' + html + '</p>';
    
    // 处理列表
    html = html
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    return html;
  },

  /**
   * 加载相关文章
   */
  async loadRelatedArticles(currentArticle: Knowledge): Promise<Knowledge[]> {
    // 模拟加载相关文章
    const mockRelated: Knowledge[] = [
      {
        _id: '2',
        slug: 'cat-nutrition-basics',
        title: '猫咪营养需求基础知识',
        category: 'nutrition',
        isPublished: true,
        createdAt: '2024-01-14T15:30:00Z',
        contentMD: '猫咪营养需求的基础知识...',
        updatedAt: '2024-01-14T15:30:00Z',
      },
      {
        _id: '3',
        slug: 'pet-emergency-first-aid',
        title: '宠物急救基础知识',
        category: 'emergency',
        isPublished: true,
        createdAt: '2024-01-13T09:15:00Z',
        contentMD: '宠物急救的基础知识...',
        updatedAt: '2024-01-13T09:15:00Z',
      },
    ];
    
    // 过滤掉当前文章
    return mockRelated.filter(article => article._id !== currentArticle._id);
  },

  /**
   * 检查收藏状态
   */
  async checkCollectionStatus(articleId: string): Promise<boolean> {
    try {
      const collections = wx.getStorageSync('collected_articles') || [];
      return collections.includes(articleId);
    } catch {
      return false;
    }
  },

  /**
   * 分享文章
   */
  onShare() {
    const { article } = this.data;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  },

  /**
   * 收藏文章
   */
  async onCollect() {
    const { article, isCollected } = this.data;
    
    try {
      let collections = wx.getStorageSync('collected_articles') || [];
      
      if (isCollected) {
        // 取消收藏
        collections = collections.filter((id: string) => id !== article._id);
        wx.showToast({
          title: '已取消收藏',
          icon: 'success',
        });
      } else {
        // 添加收藏
        collections.push(article._id);
        wx.showToast({
          title: '收藏成功',
          icon: 'success',
        });
      }
      
      wx.setStorageSync('collected_articles', collections);
      this.setData({ isCollected: !isCollected });
    } catch (error) {
      console.error('收藏操作失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error',
      });
    }
  },

  /**
   * 反馈
   */
  onFeedback() {
    wx.showModal({
      title: '文章反馈',
      content: '请选择反馈类型',
      showCancel: true,
      cancelText: '内容错误',
      confirmText: '建议改进',
      success: (res) => {
        const feedbackType = res.confirm ? '建议改进' : '内容错误';
        wx.showModal({
          title: feedbackType,
          content: '请描述具体问题或建议',
          editable: true,
          placeholderText: '请输入详细描述...',
          success: (feedbackRes) => {
            if (feedbackRes.confirm && feedbackRes.content) {
              wx.showToast({
                title: '感谢您的反馈！',
                icon: 'success',
              });
              // TODO: 提交反馈到服务器
              console.log('文章反馈:', {
                articleId: this.data.article._id,
                type: feedbackType,
                content: feedbackRes.content,
              });
            }
          },
        });
      },
    });
  },

  /**
   * 查看相关文章
   */
  onRelatedArticle(e: any) {
    const article = e.currentTarget.dataset.article;
    wx.redirectTo({
      url: `/pages/knowledge-detail/knowledge-detail?id=${article._id}`,
    });
  },

  /**
   * 滚动到顶部
   */
  onScrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300,
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

  getReadingTime(contentMD: string): number {
    // 估算阅读时间（按每分钟200字计算）
    const wordCount = contentMD.length;
    return Math.max(1, Math.ceil(wordCount / 200));
  },

  getWordCount(contentMD: string): number {
    return contentMD.length;
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
    
    return plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;
  },

  formatDate(dateStr: string): string {
    return DateUtils.format(new Date(dateStr), 'YYYY年MM月DD日');
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    const { article } = this.data;
    return {
      title: article.title,
      path: `/pages/knowledge-detail/knowledge-detail?id=${article._id}`,
    };
  },

  onShareTimeline() {
    const { article } = this.data;
    return {
      title: article.title,
      query: `id=${article._id}`,
    };
  },
});
