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
- **React 19** - UI 框架
- **Vite 7** - 構建工具
- **Tailwind CSS 4** - 樣式框架
- **shadcn/ui** - UI 組件庫
- **tRPC 11** - 端到端類型安全的 RPC
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
- `dictionaryCache` - 單字定義快取
- `learningPaths` - 用戶學習路徑
- `contentArchive` - 歷史內容歸檔

## 🚀 快速開始

### 前置需求
- Node.js 22+
- pnpm 或 npm
- MySQL 5.7+ 或 TiDB
- Ollama（用於本地 LLM 推理）

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
   建立 `.env.local` 檔案並填入必要的配置：
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
     return db.select().from(myTable).where(eq(myTable.userId, userId));
   }
   ```

3. **添加 tRPC 路由**
   ```typescript
   // server/routers.ts
   export const myRouter = router({
     getData: protectedProcedure
       .input(z.object({ id: z.number() }))
       .query(async ({ ctx, input }) => {
         return getMyData(input.id);
       }),
   });
   ```

4. **在前端調用**
   ```typescript
   const { data } = trpc.myRouter.getData.useQuery({ id: 1 });
   ```

## 🎓 API 文檔

### 影片學習 (video)
- `video.list` - 獲取影片列表
- `video.detail` - 獲取影片詳情（包含字幕）
- `video.logProgress` - 記錄影片學習進度與 XP

影片字幕結構：
```typescript
interface Subtitle {
  start: number;  // 開始時間（秒）
  end: number;    // 結束時間（秒）
  text: string;   // 字幕文本
}
```

### 寫作練習 (writing)
- `writing.getTodayChallenge` - 獲取今日寫作挑戰
- `writing.checkGrammar` - 檢查文法與提供反饋
- `writing.submit` - 提交寫作作品
- `writing.listSubmissions` - 獲取提交歷史

### SRS 單字卡 (srs)
- `srs.addCard` - 添加新單字卡
- `srs.getCards` - 獲取待複習卡片
- `srs.reviewCard` - 複習卡片並更新 SRS 狀態
- `srs.getStats` - 獲取 SRS 統計信息

### AI 課程 (aiCourse)
- `aiCourse.generate` - 生成新課程
- `aiCourse.list` - 獲取用戶課程列表
- `aiCourse.importToSRS` - 批量匯入課程到 SRS

### 每日內容 (dailyContent)
- `dailyContent.getTodayContent` - 獲取今日學習內容
- `dailyContent.generate` - 手動觸發內容生成

## 🧪 測試

運行單元測試：
```bash
pnpm test
```

測試文件位置：`server/*.test.ts`

## 📝 代碼風格

- 使用 TypeScript 進行完整的類型安全
- 遵循 Prettier 格式化規範
- 使用 Tailwind CSS 進行樣式設計
- 使用 shadcn/ui 組件庫保持 UI 一致性

## 🔐 安全性

- OAuth 2.0 認證流程
- JWT 會話管理
- SQL 注入防護（使用 Drizzle ORM）
- CORS 跨域保護
- 速率限制（Express Rate Limit）

## 📊 性能優化

- 客戶端代碼分割與懶加載
- 資料庫查詢優化與索引
- 緩存策略（字典、課程）
- 生產構建優化

## 🐛 故障排除

### 資料庫連接失敗
確保 `DATABASE_URL` 正確配置，並且 MySQL 服務正在運行。

### OAuth 登入失敗
檢查 `VITE_APP_ID` 和 `OAUTH_SERVER_URL` 是否正確配置。

### Ollama 連接失敗
確保 Ollama 服務正在運行（通常在 `http://localhost:11434`）。

## 📄 許可證

MIT License

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

## 📞 聯繫方式

如有問題或建議，請通過以下方式聯繫：
- 提交 GitHub Issue
- 發送郵件至項目所有者
