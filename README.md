# 澳洲旅行攻略 Web App

一款展示澳洲行程（2025年 9/25–10/6，悉尼→大洋路→墨尔本）的个人旅行攻略站。访客可独立勾选/取消目的地与活动，定制状态编码到 URL，支持一键分享。

---

## 功能特性

- 🗺️ **互动地图**：Google Maps 深色主题，景点标记 + 路线动线
- 📅 **按天浏览**：左侧行程列表按目的地分组，点击日期展开活动详情
- ✅ **行程定制**：勾选/取消目的地、天、活动，地图实时同步
- 🔗 **一键分享**：定制状态序列化到 URL，分享给朋友直接还原
- 📱 **响应式**：桌面端左右分栏，移动端垂直堆叠

---

## 本地开发

### 前置要求

- Node.js ≥ 18
- Google Maps API Key

### 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Google Maps API Key

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173
```

### 获取 Google Maps API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 创建项目或选择现有项目
3. 启用 **Maps JavaScript API**
4. 创建 API Key（建议限制域名）
5. 可选：在 Map Styles 创建深色主题样式，获取 Map ID

### 环境变量

```bash
# .env.local（不提交 Git）
VITE_GOOGLE_MAPS_KEY=your_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_style_id_here   # 可选，深色地图主题
```

---

## 部署到 Vercel

1. **推送代码到 GitHub**

2. **在 Vercel 导入**
   - 打开 [vercel.com/new](https://vercel.com/new)
   - 选择该 GitHub 仓库，Framework Preset 选 **Vite**

3. **配置环境变量**（Vercel Dashboard → Settings → Environment Variables）
   - `VITE_GOOGLE_MAPS_KEY`
   - `VITE_GOOGLE_MAPS_MAP_ID`（可选）

4. 点击 **Deploy**，每次 `git push` 自动重新部署

---

## 分享行程

1. 点击「⚙ 定制行程」→ 勾选/取消目的地、活动
2. 点击「生成我的行程 ✓」
3. 点击「🔗 分享行程」→ 链接已复制到剪贴板

---

## 新增目的地 / 活动

编辑 `src/data/itinerary.ts`，在 `destinations` 数组中添加新对象。UI 完全数据驱动，无需修改任何组件代码。

Activity ID 格式：`{目的地缩写}-d{天序号}-a{活动序号}`，如 `syd-d1-a1`，全局唯一。

---

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Vite 8 + React 19 + TypeScript 6 |
| 样式 | Tailwind CSS 3（深色主题） |
| 地图 | Google Maps JavaScript API |
| 状态管理 | URL SearchParams（`?skip=...`） |
| 测试 | Vitest（17 个测试） |
| 部署 | GitHub → Vercel（免费计划） |
