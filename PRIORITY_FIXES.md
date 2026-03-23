# 英文學習平台 - 優先修復清單

## 🔴 第一層：高優先（必須先做）

### 1️⃣ DailyContent.tsx 資料格式對齊 [HIGH]
**問題**：前後端資料結構完全不匹配
- 前端期待：`contentType`, `content`, `definition`, `exampleUsage`, `proficiencyLevel`
- 後端回傳：`generatedDate`, `vocabulary`, `grammar`, `readingMaterial`, `exercises`
- 結果：畫面空白、Add to Cards 邏輯失效

**修復步驟**：
- [ ] 檢查 `server/contentGeneration.ts` 的 `generateDailyContent()` 回傳結構
- [ ] 檢查 `server/routers.ts` 的 `content.generateToday` 回傳值
- [ ] 修改 `client/src/pages/DailyContent.tsx` 的資料映射邏輯
- [ ] 實現正確的 `ContentItem[]` 轉換
- [ ] 修正 `setIsLoading` 的非同步問題（改用 mutation 的 `isLoading` 狀態）

**檔案**：
- `server/contentGeneration.ts` (generateDailyContent)
- `server/routers.ts` (content.generateToday)
- `client/src/pages/DailyContent.tsx` (整個資料映射邏輯)

---

### 2️⃣ MyCourses.tsx 改用 aiCourse.importToSRS [HIGH]
**問題**：前端沒用後端已寫好的批次匯入 API
- 現狀：逐筆呼叫 `trpc.srs.addCard.useMutation()` (N 個單字 = N 次 request)
- 後端已有：`aiCourse.importToSRS` (批次匯入、原子性)
- 結果：效率低、容易部分失敗、無法作為課程 deck 管理

**修復步驟**：
- [ ] 確認 `server/routers.ts` 的 `aiCourse.importToSRS` 邏輯完整
- [ ] 修改 `client/src/pages/MyCourses.tsx` 的導入邏輯
- [ ] 改成呼叫 `trpc.aiCourse.importToSRS.useMutation()`
- [ ] 整理 `backText` 包含 `definition` + `chineseTranslation`
- [ ] 添加成功/失敗的 toast 提示

**檔案**：
- `server/routers.ts` (aiCourse.importToSRS - 驗證)
- `client/src/pages/MyCourses.tsx` (importSRSMutation 邏輯)

---

## 🟡 第二層：中優先（功能完整性）

### 3️⃣ VideoLearning.tsx 從 mock 改為真實功能 [MEDIUM]
**問題**：目前還是展示版，不是可用功能
- YouTube ID 固定
- 字幕硬寫
- 字典本地 mock
- 沒接 videos table、字幕來源、dictionary cache
- 沒寫 study log

**修復步驟**：
- [ ] 確認 `videos` table schema 存在
- [ ] 確認 `videoSubtitles` table 存在
- [ ] 在 `server/routers.ts` 添加 `video.getById` 和 `video.list` 程序
- [ ] 在 `server/db.ts` 添加查詢助手
- [ ] 修改 `client/src/pages/VideoLearning.tsx` 連接真實資料
- [ ] 實現單字點擊 → 查詢 dictionary cache → 添加卡片
- [ ] 實現字幕點擊時記錄 study log

**檔案**：
- `drizzle/schema.ts` (確認 videos、videoSubtitles table)
- `server/db.ts` (添加查詢助手)
- `server/routers.ts` (添加 video.* 程序)
- `client/src/pages/VideoLearning.tsx` (連接真實資料)

---

### 4️⃣ WritingPractice.tsx 從 demo 改為真實功能 [MEDIUM]
**問題**：UI 概念稿，沒接真實後端
- prompt 固定字串
- grammar check 用 setTimeout 假裝
- submit 只是 alert
- 沒寫 writingSubmissions
- sidebar 進度全假資料

**修復步驟**：
- [ ] 確認 `writingChallenges` 和 `writingSubmissions` table 存在
- [ ] 在 `server/routers.ts` 添加 `writing.getChallenge`、`writing.submit`、`writing.getStats` 程序
- [ ] 在 `server/db.ts` 添加查詢和寫入助手
- [ ] 修改 `client/src/pages/WritingPractice.tsx` 連接真實資料
- [ ] 實現真實的 grammar check（呼叫 LLM）
- [ ] 實現 submit → 寫入 writingSubmissions → 更新 sidebar 進度

**檔案**：
- `drizzle/schema.ts` (確認 writingChallenges、writingSubmissions table)
- `server/db.ts` (添加查詢助手)
- `server/routers.ts` (添加 writing.* 程序)
- `client/src/pages/WritingPractice.tsx` (連接真實資料)

---

### 5️⃣ srs.getStats 實現真實統計 [MEDIUM]
**問題**：API 存在但是 placeholder，回傳固定值
```ts
// 現狀
totalCards: 0
dueCards: 0
reviewedToday: 0
averageEasiness: 2.5
```

**修復步驟**：
- [ ] 在 `server/db.ts` 添加 `getSRSStats(userId)` 助手函數
- [ ] 計算 `totalCards` = 用戶所有 deck 的 card 總數
- [ ] 計算 `dueCards` = `nextReviewAt <= now()` 的 card 數
- [ ] 計算 `reviewedToday` = 今天有 `studyLog` 記錄的 card 數
- [ ] 計算 `averageEasiness` = 所有 card 的 `easinessFactor` 平均值
- [ ] 修改 `server/routers.ts` 的 `srs.getStats` 呼叫真實函數

**檔案**：
- `server/db.ts` (添加 getSRSStats)
- `server/routers.ts` (srs.getStats 實現)

---

## 🟢 第三層：低優先（使用體驗與文件）

### 6️⃣ 登入保護統一為自動 redirect [LOW]
**問題**：需要登入的頁面只顯示「請先登入」，沒自動導向
- 現狀：進入功能頁 → 看到一句話 → 自己想辦法回去登入
- 應該：進入功能頁 → 自動 redirect 到 OAuth

**修復步驟**：
- [ ] 在 `client/src/components/` 創建 `ProtectedRoute.tsx` 或 `ProtectedLayout.tsx`
- [ ] 檢查 `useAuth()` 的 `isAuthenticated` 狀態
- [ ] 如果未登入，自動 `setLocation(getLoginUrl())`
- [ ] 將需要登入的頁面包裝起來

**檔案**：
- `client/src/components/ProtectedRoute.tsx` (新建)
- `client/src/App.tsx` (修改路由)

---

### 7️⃣ 首頁按鈕互動完成度提升 [LOW]
**問題**：一些按鈕沒有真正完成互動
- 「個人資料」按鈕沒動作
- 功能入口不全
- heatmap 是 mock data

**修復步驟**：
- [ ] 檢查 Home.tsx 的所有按鈕是否都有 onClick 處理
- [ ] 「個人資料」按鈕連接到 Profile 頁面（或新建）
- [ ] heatmap 改用真實 `studyLogs` 資料
- [ ] 確保所有功能入口都能走到完整流程

**檔案**：
- `client/src/pages/Home.tsx`
- `client/src/pages/Profile.tsx` (如需新建)

---

### 8️⃣ 提升測試含金量與覆蓋率 [LOW]
**問題**：現有測試不足以保證專案穩定性
- 沒測資料庫 CRUD
- 沒測 router caller 實際資料流
- 沒測 `generateEnglishCourse` 的 parsing robustness
- 沒測 MyCourses → importToSRS 核心流程

**修復步驟**：
- [ ] 添加 `server/db.test.ts` - 測試資料庫操作
- [ ] 添加 `server/contentGeneration.test.ts` - 測試內容生成
- [ ] 添加 `server/srs.test.ts` - 測試 SRS 邏輯
- [ ] 添加 `server/routers.test.ts` - 測試 API 端點
- [ ] 提升覆蓋率到 80%+

**檔案**：
- `server/db.test.ts` (新建)
- `server/contentGeneration.test.ts` (新建)
- `server/srs.test.ts` (擴展)
- `server/routers.test.ts` (新建)

---

### 9️⃣ 補充 .env.example 和完整 README [LOW]
**問題**：缺少對外說明文件，別人拿到專案不知道怎麼開始
- 沒有 `.env.example`
- README 不完整
- 沒說明必填環境變數
- 沒說明 MySQL、Ollama 需求
- 沒說明 migration 流程
- 沒說明 OAuth 配置
- 沒說明 scheduler 行為

**修復步驟**：
- [ ] 創建 `.env.example` 列出所有環境變數
- [ ] 創建或更新 `README.md`
- [ ] 添加「快速開始」章節
- [ ] 添加「環境配置」章節
- [ ] 添加「資料庫設置」章節
- [ ] 添加「OAuth 配置」章節
- [ ] 添加「專案結構」章節
- [ ] 添加「開發指南」章節

**檔案**：
- `.env.example` (新建)
- `README.md` (更新/新建)

---

## 📊 修復優先順序

```
第一天：修復 #1 + #2 (高優先，資料流完整)
第二天：修復 #3 + #4 + #5 (中優先，功能完整)
第三天：修復 #6 + #7 + #8 + #9 (低優先，體驗與文件)
```

## ✅ 驗收標準

- [ ] 所有高優先項目完成
- [ ] 所有中優先項目完成
- [ ] 所有測試通過（20+ 個）
- [ ] TypeScript 編譯無誤
- [ ] Production build 成功
- [ ] 新增 checkpoint

---

**更新時間**: 2026-03-13
**狀態**: 規劃中
