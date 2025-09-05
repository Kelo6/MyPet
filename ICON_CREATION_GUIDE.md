# TabBar 图标创建指南

## 🚨 当前问题
微信开发者工具提示找不到 TabBar 图标文件。

## 📋 需要的图标文件

在 `miniprogram/assets/icons/` 目录下需要创建以下图标：

### 📁 图标列表
```
miniprogram/assets/icons/
├── home.png              # 首页图标（未选中）
├── home-active.png       # 首页图标（选中）
├── calendar.png          # 日程图标（未选中）
├── calendar-active.png   # 日程图标（选中）
├── bell.png              # 提醒图标（未选中）
├── bell-active.png       # 提醒图标（选中）
├── book.png              # 百科图标（未选中）
├── book-active.png       # 百科图标（选中）
├── user.png              # 我的图标（未选中）
└── user-active.png       # 我的图标（选中）
```

## 🎨 图标规范

### 尺寸要求
- **推荐尺寸**: 81px × 81px
- **最小尺寸**: 40px × 40px
- **格式**: PNG（支持透明背景）

### 设计建议
- **线条风格**: 简洁的线条图标
- **颜色**: 
  - 未选中: #8B5CF6 (浅紫色)
  - 选中: #6366F1 (深紫色)
- **背景**: 透明背景
- **风格**: 统一的设计风格

## 🛠️ 解决方案

### 方案1: 创建简单图标（推荐）
使用在线图标工具创建：
1. 访问 [Iconfont](https://www.iconfont.cn/) 或 [IconPark](https://iconpark.oceanengine.com/)
2. 搜索对应图标：home, calendar, bell, book, user
3. 下载 PNG 格式，调整为 81x81px
4. 创建两个版本（普通和高亮）

### 方案2: 使用占位符图标
创建纯色的简单占位符图标，后续替换

### 方案3: 临时移除TabBar
暂时移除 app.json 中的 tabBar 配置，使用普通页面导航

## 🚀 快速修复

我将采用方案3，先移除TabBar配置，让项目可以正常运行：

```json
{
  "pages": [...],
  "window": {...},
  // 暂时注释掉 tabBar 配置
  // "tabBar": {...}
}
```

## 📝 后续步骤

1. 项目正常运行后
2. 设计或下载合适的图标
3. 重新启用 TabBar 配置
4. 测试图标显示效果

## 💡 图标资源推荐

### 免费图标库
- [Feather Icons](https://feathericons.com/) - 简洁线条风格
- [Heroicons](https://heroicons.com/) - 现代设计风格
- [Tabler Icons](https://tablericons.com/) - 一致的设计系统

### 在线工具
- [Figma](https://figma.com) - 专业设计工具
- [Canva](https://canva.com) - 简单易用的设计工具
- [GIMP](https://gimp.org) - 免费图像编辑软件




