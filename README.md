# English Learning Hub

一個 AI 驅動的智慧英文學習平台，結合 SRS 間隔重複、沉浸式影片學習、遊戲化激勵和 AI 課程生成，幫助學習者從國中程度逐步提升到多益 700 分。

## 🎯 核心功能

### 1. **SRS 智慧單字卡系統**
- 採用 SM-2 演算法實現間隔重複學習
- 根據複習品質自動調整複習時間
- 支援多個單字卡組 (Deck) 管理
- 自動計算下次複習時間

### 2. **AI 課程生成**
- 使用本地 Ollama 按需生成自訂英文課程
- 包含詞彙、文法、閱讀材料和練習題
- 支援多個難度等級（國中、高中、大學、進階）
- 一鍵匯入生成課程到 SRS 系統

### 3. **每日學習內容**
- 每三天自動生成適合當前程度的學習材料
- 包含單字、短語、句子和文法
- 支援內容歸檔和追蹤

### 4. **影片學習**
- 支援 YouTube 和自訂影片
- 實時字幕同步顯示（基於時間碼）
- 字幕內容可點擊查看單字定義
- 影片進度追蹤與 XP 獲得

### 5. **寫作練習**
- 根據難度等級的寫作挑戰
- Ollama LLM 驅動的文法檢查
- 自動提供語法糾正和改進建議
- 寫作提交記錄與評分追蹤

### 6. **遊戲化激勵系統**
- 經驗值 (XP) 累積
- 連續學習日數追蹤
- 學習熱力圖可視化
- 進度里程碑達成

### 7. **學習路徑管理**
- 個性化學習進度追蹤
- 難度等級自動升級
- 里程碑達成提醒

## 🏗️ 技術架構

### 前端
- **React 18** - UI 框架
- **Vite** - 構建工具
- **Tailwind CSS 4** - 樣式框架
- **shadcn/ui** - UI 組件庫
- **tRPC** - 端到端類型安全的 RPC
- **Wouter** - 輕量級路由

### 後端
- **Express 4** - Web 服務器
- **tRPC 11** - RPC 框架
- **Drizzle ORM** - 資料庫 ORM
- **MySQL/TiDB** - 資料庫
- **Ollama** - 本地 LLM 推理

### 認證
- **Manus OAuth** - 統一認證系統
- **JWT** - 會話管理

### 資料庫架構

#### 核心表
- `users` - 用戶信息與認證
- `cards` - 單字卡（包含 SRS 元數據）
- `decks` - 單字卡組
- `studyLogs` - 學習記錄
- `dailySignIns` - 每日簽到記錄

#### 學習內容表
- `aiCourses` - AI 生成的課程
- `generatedContent` - 每日生成的學習內容
- `videos` - 影片資源
- `writingChallenges` - 寫作挑戰
- `writingSubmissions` - 寫作提交記錄

#### 參考表
- `dictionary` - 單字定義快取
- `learningPaths` - 用戶學習路徑

## 🚀 快速開始

### 前置需求
- Node.js 22+
- pnpm 或 npm
- MySQL 5.7+ 或 TiDB
- Ollama（用## 🚀 快速開始

### 安裝與啟動

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd english-learning-hub
   ```

2. **安裝依賴**
   ```bash
   pnpm install
   ```

3. **配置環境變數**
   建立 `.env.local` 檔案並填入必要的配置（參考 `.env.example`）：
   ```bash
   DATABASE_URL=mysql://user:password@localhost/english_learning_hub
   JWT_SECRET=<use 'openssl rand -hex 32' to generate>
   VITE_APP_ID=<your-manus-oauth-app-id>
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   APP_ORIGIN=http://localhost:3000
   ```

4. **初始化資料庫**
   ```bash
   pnpm db:push
   ```

5. **啟動開發服務器**
   ```bash
   pnpm dev
   ```

   應用將在 `http://localhost:3000` 啟動

### 可用指令

| 指令 | 說明 |
|------|------|
| `pnpm dev` | 啟動開發服務器 (含熱重載) |
| `pnpm build` | 構建生產版本 |
| `pnpm start` | 啟動生產服務器 |
| `pnpm test` | 運行單元測試 |
| `pnpm check` | 檢查 TypeScript 型別 |
| `pnpm db:push` | 執行資料庫遷移 |
| `pnpm format` | 格式化代碼 |

### 環境變數配置

必填環境變數：
- `DATABASE_URL` - MySQL 連接字符串
- `JWT_SECRET` - JWT 簽名密鑰（使用 `openssl rand -hex 32` 生成）
- `VITE_APP_ID` - Manus OAuth 應用 ID
- `OAUTH_SERVER_URL` - Manus OAuth 服務器 URL
- `VITE_OAUTH_PORTAL_URL` - Manus OAuth 登入入口
- `APP_ORIGIN` - 應用源地址（用於 OAuth 回調）

可選環境變數：
- `BUILT_IN_FORGE_API_URL` - Manus 內置 API URL
- `BUILT_IN_FORGE_API_KEY` - 服務器端 API 密鑰
- `VITE_FRONTEND_FORGE_API_KEY` - 前端 API 密鑰
- `OWNER_NAME` - 項目所有者名稱
- `OWNER_OPEN_ID` - 所有者 Open ID

詳見上方環境變數配置了解完整說明。

## 📦 主要依賴

### 前端
```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "vite": "^7.x",
  "tailwindcss": "^4.x",
  "@trpc/client": "^11.x",
  "wouter": "^3.x"
}
```

### 後端
```json
{
  "express": "^4.x",
  "@trpc/server": "^11.x",
  "drizzle-orm": "^0.x",
  "mysql2": "^3.x"
}
```

## 🔄 開發工作流

### 添加新功能

1. **更新資料庫 Schema**
   ```bash
   # 編輯 drizzle/schema.ts
   pnpm db:push
   ```

2. **添加數據庫查詢幫助函數**
   ```typescript
   // server/db.ts
   export async function getMyData(userId: number) {
     const db = await getDb();
     return db.select().from(myTable).where(eq(myTable.userId, userId));
   }
   ```

3. **創建 tRPC 程序**
   ```typescript
   // server/routers.ts
   myFeature: protectedProcedure
     .input(z.object({ id: z.number() }))
     .query(async ({ ctx, input }) => {
       return getMyData(ctx.user.id);
     })
   ```

4. **前端調用 API**
   ```typescript
   // client/src/pages/MyPage.tsx
   const { data } = trpc.myFeature.useQuery({ id: 1 });
   ```

5. **添加測試**
   ```bash
   # server/myFeature.test.ts
   pnpm test
   ```

### 資料庫遷移

```bash
# 生成遷移文件
pnpm db:generate

# 應用遷移
pnpm db:push

# 查看遷移歷史
pnpm db:studio
```

## 🧪 測試

運行所有測試：
```bash
pnpm test
```

運行特定測試文件：
```bash
pnpm test server/auth.logout.test.ts
```

監視模式：
```bash
pnpm test:watch
```

## 🏗️ 構建與部署

### 開發構建
```bash
pnpm dev
```

### 生產構建
```bash
pnpm build
```

### 啟動生產服務器
```bash
pnpm start
```

## 📊 API 文檔

### 認證
- `auth.me` - 獲取當前用戶信息
- `auth.logout` - 登出用戶

### SRS 系統
- `srs.getDueCards` - 獲取待複習卡片
- `srs.addCard` - 添加新卡片
- `srs.updateCard` - 更新卡片複習狀態
- `srs.getStats` - 獲取 SRS 統計

### AI 課程
- `aiCourse.generate` - 生成新課程
- `aiCourse.list` - 列出用戶課程
- `aiCourse.importToSRS` - 匯入課程到 SRS

### 內容
- `content.generateToday` - 生成今日內容
- `content.getTodayContent` - 獲取今日內容
- `content.archive` - 歸檔內容

### 影片學習
- `video.list` - 列出可用影片（可按難度等級篩選）
- `video.detail` - 獲取影片詳細信息（包含字幕）
- `video.logProgress` - 記錄影片觀看進度並獲得 XP

### 寫作練習
- `writing.getTodayChallenge` - 獲取今日寫作挑戰
- `writing.checkGrammar` - 檢查文法（返回糾正和建議）
- `writing.submit` - 提交寫作並獲得評分與 XP
- `writing.listSubmissions` - 列出用戶的寫作提交記錄

### 學習路徑
- `learningPath.get` - 獲取用戶學習路徑
- `learningPath.upsert` - 更新學習路徑

## 📝 資料庫架構詳解

### Videos 表
- `youtubeId` - YouTube 影片 ID（可選）
- `url` - 影片 URL（自訂影片或 YouTube 嵌入）
- `durationSeconds` - 影片時長（秒）
- `transcript` - JSON 格式的字幕陣列 `[{time: number, text: string}]`
- `proficiencyLevel` - 難度等級

### WritingChallenges 表
- `topic` - 寫作主題
- `title` - 挑戰標題
- `prompt` - 寫作提示
- `proficiencyLevel` - 難度等級

### WritingSubmissions 表
- `content` - 用戶提交的寫作內容
- `feedback` - LLM 生成的整體反饋
- `errors` - JSON 格式的錯誤陣列（包含位置、原文、建議、類型、解釋）
- `score` - 0-100 的評分
- `xpEarned` - 獲得的經驗值

### StudyLogs 表
- `cardId` - 可為 NULL（支援非卡片活動如影片、寫作、測驗）
- `activityType` - 活動類型：review, video, writing, quiz
- `xpEarned` - 該活動獲得的 XP

## 🔐 安全性

### 認證
- 所有受保護的 API 端點使用 `protectedProcedure`
- JWT 會話 cookie 自動管理
- OAuth 流程由 Manus 平台處理

### 授權
- 用戶只能訪問自己的數據
- 所有查詢都驗證 `userId == ctx.user.id`
- 敏感操作需要額外驗證
- importToSRS 驗證課程與 deck 所有權
- 寫作提交只能由提交者本人查看

### 資料驗證
- 所有輸入使用 Zod 驗證
- 類型安全的 tRPC 程序
- SQL 注入防護由 Drizzle ORM 提供
- 寫作內容長度限制 10-5000 字
- 文法檢查基於用戶難度等級

## 🐛 常見問題

### 資料庫連接失敗
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**解決方案**：確保 MySQL 服務正在運行，`DATABASE_URL` 配置正確

### OAuth 登入失敗
```
Error: Invalid app ID
```
**解決方案**：檢查 `VITE_APP_ID` 和 `OAUTH_SERVER_URL` 是否正確

### Ollama 連接失敗
```
Error: Failed to connect to Ollama
```
**解決方案**：確保 Ollama 服務在運行，檢查連接地址

## 📝 提交規範

遵循 Conventional Commits：
```
feat: 添加新功能
fix: 修復 bug
docs: 文檔更新
style: 代碼格式調整
refactor: 代碼重構
test: 添加測試
chore: 依賴更新
```

## 📄 許可證

MIT License

## 🤝 貢獻

歡迎提交 Pull Request 和 Issue！

## 📧 聯繫方式

如有問題或建議，請通過以下方式聯繫：
- 提交 GitHub Issue
- 發送郵件至 support@example.com

---

**最後更新**：2026 年 3 月 13 日
