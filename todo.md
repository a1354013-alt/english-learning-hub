# English Learning Hub - 專案待辦事項

## 資料庫與後端架構
- [x] 設計完整的資料庫 Schema（用戶、卡片、SRS 數據、遊戲化、內容生成）
- [x] 實現 SM-2 間隔重複演算法
- [x] 建立字典 API 代理與緩存機制
- [x] 設計內容生成系統架構

## 後端 API 開發
- [x] 實現 SRS 複習邏輯 API
- [x] 建立單字卡 CRUD 操作
- [x] 開發字典查詢與緩存 API
- [ ] 實現寫作糾錯 API（LanguageTool 集成）
- [x] 建立內容生成定時任務
- [x] 實現內容歸檔系統

## 前端介面開發
- [x] 設計整體 UI/UX 風格與色彩方案
- [x] 建立首頁與導航結構
- [x] 實現 SRS 單字卡組件
- [x] 開發卡片評分機制（Again/Hard/Good/Easy）
- [x] 建立單字卡列表與管理頁面

## 影片播放器與沉浸式學習
- [x] 集成 YouTube 播放器
- [x] 實現字幕同步與高亮顯示
- [x] 開發點擊單字即時查詢功能
- [ ] 建立字幕解析與分詞系統

## 寫作與語法糾錯
- [x] 集成 LanguageTool API（模擬）
- [x] 實現即時語法檢查功能（模擬）
- [x] 建立每日寫作挑戰系統
- [x] 開發錯誤標示與建議展示

## 遊戲化系統
- [x] 實現每日簽到與連勝追蹤
- [x] 建立經驗值系統與行為權重定義
- [x] 開發熱力圖組件（學習活動可視化）
- [ ] 實現進度環組件
- [ ] 建立排行榜系統

## 自動內容生成與歸檔
- [x] 設計內容生成演算法（難度分級）
- [x] 實現每三天自動生成內容的定時任務
- [x] 建立內容歸檔系統（按時間與難度分類）
- [ ] 開發內容管理後台

## 學習路徑系統
- [x] 設計漸進式學習路徑（國中→多益 700）
- [x] 實現難度評估系統
- [ ] 建立個性化推薦引擎

## 測試與部署
- [x] 編寫後端單元測試
- [ ] 編寫前端組件測試
- [ ] 整合測試與端到端測試
- [ ] 性能優化與監控
- [ ] 部署與上線

## Ollama AI 集成功能
- [x] 配置 Ollama 後端連接
- [x] 實現課程生成提示詞系統
- [x] 建立 AI 課程生成 API 端點
- [x] 開發課程內容結構化解析
- [x] 實現前端「生成課程」按鈕和界面
- [x] 將生成的課程保存到數據庫
- [ ] 實現課程預覽和編輯功能
- [ ] 添加課程生成進度顯示

## 產產級代碼改進
- [x] 修改 server/_core/vite.ts 的 serveStatic()
- [x] 修改 server/_core/cookies.ts 的 getSessionCookieOptions
- [x] 重構 server/db.ts 的 getDb() 使用連線池
- [x] 加強 OAuth state 機制
- [x] 改進 server/_core/env.ts 啟動驗證
- [x] 修正 server/db.ts 的 getGeneratedContent()
- [x] 修正 server/contentGeneration.ts 的 archiveOldContent
- [x] 修改 server/routers.ts 的 srs.addCard
- [x] 重構 server/routers.ts 的 import 語句

## 已完成項目
- [x] 初始化專案架構（React + Express + MySQL）
- [x] 設置開發環境
- [x] 實現 SM-2 SRS 演算法
- [x] 建立後端 API 路由
- [x] 開發前端主要頁面
- [x] 集成定時任務系統
- [x] 實現自動內容生成與歸檔
- [x] 集成 Ollama 本地 AI 按需課程生成
