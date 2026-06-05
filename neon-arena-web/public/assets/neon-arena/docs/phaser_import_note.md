# Phaser 导入备注

- 推荐从 `asset-manifest.json` 自动加载图片和 sprite sheet。
- 地图 JSON 的 `collisionRects` 是首版代理，需要根据实际角色半径、墙体遮挡和 AI 寻路继续微调。
- HUD 图片是视觉参考，正式血量/弹药条建议用 Phaser Graphics 动态绘制。
