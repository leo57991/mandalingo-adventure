# Mandalingo：霧隱鎮（Godot 物件化切片）

這個資料夾是把南門從「一張背景圖」重構成 Godot 4 可編輯物件的第一個垂直切片。

## 執行

1. 使用 Godot 4.3 或更新版本開啟此資料夾。
2. 按 F6/F5 執行 `scenes/main.tscn`。
3. WASD／方向鍵移動，E 觀察或交談，N 開啟筆記本，F3 顯示碰撞。

## 物件結構

- `scenes/props/gatehouse.tscn`：門樓，左右門柱分離碰撞，中央可通行。
- `scenes/props/wall_segment.tscn`：可重複拼接的城牆。
- `scenes/props/stele.tscn`：石碑，含碰撞與「霧隱鎮」情境互動。
- `scenes/props/lantern.tscn`：獨立燈籠與底座碰撞。
- `scenes/props/bamboo_cluster.tscn`：竹叢與根部碰撞。
- `scenes/props/scholar_rock.tscn`：太湖石與獨立碰撞。
- `scenes/props/gatekeeper.tscn`：守門人與「你好」情境互動。
- `scenes/player.tscn`：玩家、碰撞、跟隨鏡頭與慢速探索移動。

每個物件都能在 Godot 編輯器中單獨移動、縮放、替換圖片或修改 CollisionShape2D，不再依賴整張場景圖片。
