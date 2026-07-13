# 澳洲旅行攻略 Web App

一款展示澳洲行程（2026年 9/25–10/6，悉尼→大洋路→墨尔本）的旅行攻略应用，支持地图联动、行程编辑、预订追踪、离线访问与多人协作。

---

## 功能特性

- **互动地图**：Google Maps 景点标记、路线与行程联动
- **行程编辑**：新增、修改、排序、备选标记和本地持久化
- **出行准备**：天气提示、预订追踪、旅行凭证和 Packing List
- **离线访问**：PWA 应用壳与本地数据缓存
- **多人协作**：Supabase 邮箱登录、邀请链接、实时同步和版本冲突检测
- **响应式体验**：桌面双栏与移动端上下文地图、底部导航

---

## 本地开发

### 前置要求

- Node.js 20、22 或 24+
- Google Maps API Key
- Google Maps Map ID（可选；配置后使用 Advanced Markers 和云端地图样式）

### 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，至少填入 Google Maps API Key

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173
```

### 获取 Google Maps API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 创建项目或选择现有项目
3. 启用 **Maps JavaScript API**
4. 创建 API Key，并在网站限制中加入本地地址（如 `http://localhost:*/*` 和 `http://127.0.0.1:*/*`）及正式域名
5. 可选：在 **Map Management** 创建 JavaScript 类型 Map ID，以启用 Advanced Markers
6. 可选：在 Map Styles 创建自定义样式，并关联到该 Map ID

### 环境变量

```bash
# .env.local（不提交 Git）
VITE_GOOGLE_MAPS_KEY=your_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here   # 可选
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OWNER_EMAIL=owner@example.com          # 推荐：限制行程所有者邮箱
```

### 启用多人协作

1. 在 Supabase 创建项目。
2. 打开 SQL Editor，完整执行最新的 `supabase/schema.sql`。
3. 在 Authentication → URL Configuration 中加入本地和正式站点地址。
4. 在 Authentication → Sign In / Providers 中开启 Anonymous Sign-Ins。
5. 将 Project URL、publishable/anon key 和所有者邮箱写入 `.env.local`。
6. 重启开发服务，所有者通过邮箱登录后会自动创建或恢复共享行程。

所有者在协作面板填写朋友名字即可生成一次性邀请链接。朋友打开链接后自动建立访客会话并加入同一行程，无需邮箱登录；邀请 7 天内有效且只能由一位成员接受。所有者可以撤销待接受邀请或移除已加入成员。未配置 Supabase 时应用自动保持本地模式，已有编辑功能不受影响。

---

## 部署到 Vercel

1. **推送代码到 GitHub**

2. **在 Vercel 导入**
   - 打开 [vercel.com/new](https://vercel.com/new)
   - 选择该 GitHub 仓库，Framework Preset 选 **Vite**

3. **配置环境变量**（Vercel Dashboard → Settings → Environment Variables）
   - `VITE_GOOGLE_MAPS_KEY`
   - `VITE_GOOGLE_MAPS_MAP_ID`（可选）
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OWNER_EMAIL`

4. 点击 **Deploy**，每次 `git push` 自动重新部署

---

## 分享行程

普通分享使用头部“分享行程”。多人编辑使用“协作”创建云端行程，再复制邀请链接。

---

## 新增目的地 / 活动

编辑 `src/data/itinerary.ts`，在 `destinations` 数组中添加新对象。UI 完全数据驱动，无需修改任何组件代码。

Activity ID 格式：`{目的地缩写}-d{天序号}-a{活动序号}`，如 `syd-d1-a1`，全局唯一。

---

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Vite 8 + React 19 + TypeScript 6 |
| 样式 | Tailwind CSS 3 + Lucide Icons |
| 地图 | Google Maps JavaScript API |
| 天气 | Open-Meteo Forecast API（无 API Key，前端缓存） |
| 云端协作 | Supabase Auth + Postgres + Realtime + RLS |
| 状态管理 | 本地优先缓存 + URL SearchParams + 云端版本号 |
| 测试 | Vitest |
| 部署 | GitHub → Vercel（免费计划） |
