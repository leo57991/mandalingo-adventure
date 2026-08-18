# Mandalingo：字境行者

一款原創的 2.5D 瀏覽器中文學習冒險。玩家在漂浮書頁世界中尋回五枚字靈，透過字義、拼音與聲調挑戰，讓沉睡的月門再次甦醒。

![Mandalingo title screen](assets/mandalingo-key-art.png)

## 遊戲特色

- 五段可重玩的中文挑戰：字義、拼音與聲調
- 即時移動、衝刺、追蹤型墨影與生命系統
- 連擊、分數、準確率與本機最高紀錄
- 程式繪製的 2.5D 地形、角色、敵人、粒子與動態月門
- 原創主視覺與 Web Audio 程序音效
- 鍵盤及觸控搖桿支援，響應式手機介面
- 使用瀏覽器語音合成播放正體中文讀音

## 開始遊玩

這是零相依套件的靜態網頁遊戲。需要本機伺服器來載入 ES modules：

```bash
npm run dev
```

接著開啟 `http://127.0.0.1:4173`。

### 操作

| 動作 | 鍵盤 | 手機 |
| --- | --- | --- |
| 移動 | `WASD` 或方向鍵 | 左側虛擬搖桿 |
| 靈步衝刺 | `Space` | 右側「靈步」按鈕 |
| 選擇答案 | `1`–`4` 或滑鼠 | 點選答案 |
| 開始／重玩 | `Enter` / `R` | 畫面按鈕 |

## 測試

```bash
npm run check
```

專案包含課程資料完整性、選項唯一性、正解與分數計算的 Node 測試。

## 技術

Vanilla JavaScript、HTML Canvas、CSS、Web Audio API、Web Speech API。無框架、無打包器，適合直接部署到 GitHub Pages。

## 授權

[MIT](LICENSE)
