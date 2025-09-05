# 项目初始化命令记录

## 1. 安装依赖
```bash
npm install
```

## 2. 编译TypeScript
```bash
npm run build
```

## 3. 开发模式（监听编译）
```bash
npm run dev
```

## 4. 代码检查
```bash
npm run lint
```

## 5. 代码格式化
```bash
npm run format
```

## 6. Git提交（会自动触发pre-commit钩子）
```bash
git add .
git commit -m "feat: 初始化宠物健康助手小程序项目"
```

## 微信开发者工具导入步骤

1. 打开微信开发者工具
2. 点击"导入项目"
3. 选择项目根目录：`D:\code\wxminiprogram\MyPet`
4. AppID：选择"测试号"或输入真实AppID
5. 项目名称：宠物健康助手
6. 点击"确定"

## 云开发配置（可选）

如需使用云开发功能：

1. 在微信开发者工具中点击"云开发"
2. 开通云开发服务
3. 创建云环境
4. 在`miniprogram/app.ts`中配置环境ID：
   ```typescript
   wx.cloud.init({
     env: 'your-env-id', // 替换为实际环境ID
     traceUser: true,
   });
   ```

## 项目验证

### 1. 检查编译输出
确认`miniprogram`目录下生成了对应的`.js`文件

### 2. 在微信开发者工具中预览
- 主要页面能正常显示
- TabBar导航功能正常
- 基础交互无错误

### 3. 功能测试
- 添加宠物信息
- 查看首页统计
- 切换不同Tab页面

## 常用开发命令

```bash
# 开发环境编译监听
npm run dev

# 生产环境编译
npm run build

# 代码检查和修复
npm run lint

# 代码格式化
npm run format

# 查看项目信息
npm run --help
```




