// 知识库服务
/// <reference path="../typings/index.d.ts" />

import { StorageUtils } from '../utils/storage';

export interface Article {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  content: string;
  readTime: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  articleCount: number;
}

export class KnowledgeService {
  /**
   * 获取所有分类
   */
  static async getCategories(): Promise<ApiResult<Category[]>> {
    try {
      // 模拟数据，实际项目中应该从服务端获取
      const categories: Category[] = [
        {
          id: 'vaccine',
          name: '疫苗知识',
          icon: '💉',
          description: '宠物疫苗接种相关知识',
          articleCount: 5,
        },
        {
          id: 'deworming',
          name: '驱虫知识',
          icon: '🪱',
          description: '宠物驱虫相关知识',
          articleCount: 4,
        },
        {
          id: 'health',
          name: '健康护理',
          icon: '🏥',
          description: '宠物日常健康护理',
          articleCount: 8,
        },
        {
          id: 'nutrition',
          name: '营养饮食',
          icon: '🍽️',
          description: '宠物营养与饮食指南',
          articleCount: 6,
        },
      ];

      return {
        code: 0,
        msg: '获取成功',
        data: categories,
      };
    } catch (error) {
      console.error('获取分类失败:', error);
      return {
        code: -1,
        msg: '获取分类失败',
        data: [],
      };
    }
  }

  /**
   * 根据分类获取文章列表
   */
  static async getArticlesByCategory(
    categoryId: string
  ): Promise<ApiResult<Article[]>> {
    try {
      // 模拟数据
      const articles: Article[] = this.getMockArticles().filter(
        article => article.categoryId === categoryId
      );

      return {
        code: 0,
        msg: '获取成功',
        data: articles,
      };
    } catch (error) {
      console.error('获取文章列表失败:', error);
      return {
        code: -1,
        msg: '获取文章列表失败',
        data: [],
      };
    }
  }

  /**
   * 根据ID获取文章详情
   */
  static async getArticleById(
    articleId: string
  ): Promise<ApiResult<Article | null>> {
    try {
      const articles = this.getMockArticles();
      const article = articles.find(a => a.id === articleId);

      if (article) {
        return {
          code: 0,
          msg: '获取成功',
          data: article,
        };
      }

      return {
        code: -1,
        msg: '文章不存在',
        data: null,
      };
    } catch (error) {
      console.error('获取文章详情失败:', error);
      return {
        code: -1,
        msg: '获取文章详情失败',
        data: null,
      };
    }
  }

  /**
   * 搜索文章
   */
  static async searchArticles(keyword: string): Promise<ApiResult<Article[]>> {
    try {
      const articles = this.getMockArticles();
      const results = articles.filter(
        article =>
          article.title.includes(keyword) ||
          article.summary.includes(keyword) ||
          article.tags.some(tag => tag.includes(keyword))
      );

      return {
        code: 0,
        msg: '搜索成功',
        data: results,
      };
    } catch (error) {
      console.error('搜索文章失败:', error);
      return {
        code: -1,
        msg: '搜索失败',
        data: [],
      };
    }
  }

  /**
   * 获取热门文章
   */
  static async getPopularArticles(limit = 5): Promise<ApiResult<Article[]>> {
    try {
      const articles = this.getMockArticles();
      // 模拟热门文章（实际应该根据阅读量等数据排序）
      const popular = articles.slice(0, limit);

      return {
        code: 0,
        msg: '获取成功',
        data: popular,
      };
    } catch (error) {
      console.error('获取热门文章失败:', error);
      return {
        code: -1,
        msg: '获取热门文章失败',
        data: [],
      };
    }
  }

  /**
   * 模拟文章数据
   */
  private static getMockArticles(): Article[] {
    return [
      {
        id: 'vaccine_basic',
        categoryId: 'vaccine',
        title: '宠物疫苗基础知识',
        summary: '了解宠物疫苗的基本概念、作用和重要性',
        content: '疫苗是预防宠物疾病的重要手段...',
        readTime: '5分钟',
        tags: ['疫苗', '预防', '基础知识'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'vaccine_schedule',
        categoryId: 'vaccine',
        title: '疫苗接种时间表',
        summary: '详细的犬猫疫苗接种时间安排指南',
        content: '幼犬疫苗接种时间表...',
        readTime: '8分钟',
        tags: ['疫苗', '时间表', '接种'],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
      // 更多模拟数据...
    ];
  }
}
