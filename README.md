# 3D quality-engineer-day

《品保工程師的一天 3D》：獨立於原版的可探索工廠遊戲。Three.js 方塊人物與斜俯視 3D 場景；繁體中文職場黑色幽默。原版檔案與存檔不受影響。

## 玩什麼

- WASD／方向鍵走動、Shift 快走、滑鼠點地板尋路、靠近 E 互動。
- 手機方向按鈕與互動鍵；任務「帶我去」會沿路走到站點，不是瞬移。
- 工廠十個工作區加換裝閘門、下班門禁；設備與牆體碰撞。
- 液冷區唯一入口是閘門。刷卡換無塵服、開門、出站換回工作服；再次進入需再次更衣。
- 三條普通主線每輪隨機分配，優先未完成路線：消失的序號／今天一定要出貨／客戶說漏了。
- CQE 查閱過保、無新單、重複支援案件的歷次承諾，會啟動第四條隱藏主線「保固過了，服務沒有下班」。原案保留為待交接。
- 三條支線各三階段、六件隨機插單每輪抽兩件、八職能與代班熟練度。
- 品質、壓力、信用、停線、加班、換裝次數、更衣分鐘；選項影響預覽。
- 日班可離場；接電話進入獨立家中場景的三個夜間事件。
- 13 個可收藏結局、自動存檔、文字交接報告。

## 本機開啟

需要網頁伺服器，**不要直接雙擊 index.html**。3D 模組由瀏覽器載入，本機檔案模式會被跨來源限制擋住。

在此專案資料夾執行：

```sh
python -m http.server 4174 --bind 127.0.0.1
```

開啟 http://127.0.0.1:4174/ 。需要支援 WebGL 2 的現代瀏覽器。沒有 WebGL 2 時，起始畫面會顯示啟動失敗說明。

## GitHub Pages 部署

建議建立**新的** GitHub 儲存庫 `3d-quality-engineer-day`，與舊版分開。

1. 解壓縮專案，打開 `3d-quality-engineer-day` 資料夾。
2. 上傳裡面的全部檔案與子資料夾到新儲存庫最外層。必須直接看得到 `index.html`、`js`、`css`、`vendor`，不要只上傳 ZIP，也不要包第二層。
3. Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save。
4. 發布完成後使用 `https://你的帳號.github.io/3d-quality-engineer-day/`。

**vendor 資料夾必須一併上傳**；Three.js 已隨專案附上，遊玩時不依賴外部 CDN。所有程式路徑均為相對路徑，支援 Pages 子目錄。無打包、無 npm 安裝、無後端；附 `.nojekyll`。本交付沒有自動建立 GitHub 儲存庫或公開發布。

## 檔案與擴充

```text
index.html              畫面骨架、起始卡、控制與對話
css/style.css           企業系統 UI、桌機／手機適配
js/data.js              三主線＋隱藏線、支線、插單、夜班
js/engine.js            狀態、條件、代班、數值、結局與存檔驗證
js/navigation.js        純碰撞與 BFS 尋路（與測試共用）
js/world.js             3D 場景、方塊人物、服裝、動畫、攝影機
js/app.js               DOM、互動、存檔、導航、報告、小地圖
vendor/                 Three.js 0.180.0、MIT 授權與來源
docs/GAME_DESIGN.md      完整設計
docs/ARCHITECTURE.md     擴充契約
docs/QA.md               實際驗證結果與限制
tests/engine.test.cjs    規則與碰撞／尋路測試
```

測試：`node tests/engine.test.cjs`。無第三方測試套件。

存檔命名空間 `qe3d-workday-v1` 與 `qe3d-collection-v1`，與原版完全分開。永久職能資格限本輪；跨輪保留結局與已完成普通路線。清除瀏覽器資料、換瀏覽器或換網址不會攜帶進度。

所有組織、品牌、NPC、批次與情節皆為虛構；不含實際公司/供應商/同事名稱，無真實規格與可識別資產。Three.js 為 MIT 授權，授權文本與版本來源保留在 vendor。程式生成的場景與人物為本專案建立，未取用參考網站資產。
