# Neon Arena Web 赛博卡通图片包使用说明

本包是 `neon-arena-web/` 重构用的首版美术资产包，面向 Phaser + TypeScript + 移动端横屏玩法。素材尽量遵循：**无可读文字、无数字、无 logo、无手机框、无浏览器框**。

## 1. 包内容

```text
neon_arena_art_pack/
  asset-manifest.json              # 资产索引：路径、类型、建议用途、帧信息
  maps/                            # 5 张 1600x1100 地图背景 + 地图配置 JSON
  visual_direction/                # 844x390 玩法目标图、视觉方向图、预览拼图
  characters/                      # 4 名角色透明 PNG、头像、4 帧横向 sprite sheet
  weapons/                         # 近战/远程/功能武器与拾取物 PNG
  vfx/                             # 投射物轨迹、近战挥砍、命中特效、缩圈、风暴粒子
  hud/                             # 移动端摇杆、按钮、抽象血量/弹药条
  props/                           # 墙体、树篱、玻璃温室、水池、桥、霓虹植物等可复用装饰
  thumbnails/                      # 快速查看缩略图
  docs/                            # 资产落地说明补充
```

## 2. 推荐接入目录

把整个目录复制到：

```text
neon-arena-web/public/assets/neon-arena/
```

Phaser 中使用相对路径：

```ts
this.load.image('map01', 'assets/neon-arena/maps/map01_skyline_garden_ruins.png');
this.load.image('fighter_cyan_cat', 'assets/neon-arena/characters/fighter_cyan_cat.png');
this.load.spritesheet('fighter_cyan_cat_sheet', 'assets/neon-arena/characters/sheets/fighter_cyan_cat_sheet_4x1.png', {
  frameWidth: 256,
  frameHeight: 256,
});
```

## 3. 资产使用原则

### 地图

- `maps/*.png` 是纯背景图，不包含 HUD，不包含角色。
- `maps/*.json` 包含：
  - `image`: 地图图片路径
  - `size`: `[1600, 1100]`
  - `spawns`: 4 人出生点
  - `weaponSpawns`: 武器刷新点，类型为 `melee`、`ranged`、`utility`
  - `collisionRects`: Phaser/规则层可用的矩形碰撞代理
  - `safeZone`: 初始安全区配置
- 首轮可以继续用矩形碰撞代理，视觉墙体和规则碰撞不需要一比一像素级一致，但必须保证玩家不会穿过明显实体墙。

### 角色

每个角色有三类图片：

```text
characters/fighter_*.png                 # 大图，适合详情、宣传、调试
characters/portraits/*_portrait.png      # HUD 头像
characters/sheets/*_sheet_4x1.png        # 4 帧横向 sprite sheet，单帧 256x256
```

建议动画映射：

| 帧序号 | 建议状态 |
|---:|---|
| 0 | idle |
| 1 | run / move |
| 2 | attack |
| 3 | hit / stagger |

角色首轮只作为外观皮肤，不建议马上加入职业数值差异，避免平衡复杂度过早膨胀。

### 武器与拾取物

- `weapons/neon_katana.png`：近战武器图标/手持表现。
- `weapons/pulse_bow.png`：远程蓄力/弹道武器。
- `weapons/ray_pistol.png`：高频直线弹道武器。
- `weapons/energy_shield_baton.png`：防御/击退型近战武器。
- `weapons/*_pickup.png`：可直接放到地图上的拾取物表现。
- `weapons/weapon_atlas_2x3.png`：临时图集，方便快速加载。

### VFX

- `vfx/projectile_trail_*.png`：子弹尾迹，建议跟随 projectile rotation。
- `vfx/melee_slash_*.png`：近战挥砍扇形特效，建议播放 80–140 ms。
- `vfx/hit_spark.png`：命中瞬间，建议播放 60–90 ms，并配合 45–70 ms hit-stop。
- `vfx/safe_zone_ring_1600x1100.png`：缩圈环和圈外风暴视觉，可作为全屏 overlay。
- `vfx/storm_particles_tile_512.png`：圈外粒子平铺层。

### HUD

- `hud/joystick_left.png` 放在左下，建议实际触控区域大于图片视觉边界。
- `hud/action_button_*.png` 放在右下，图标只有抽象符号，无文字。
- `hud/health_ammo_bars.png` 是方向参考；正式实现中建议用代码画 segment bar，以便响应真实血量/弹药。

## 4. Phaser 接入建议

### Boot / Preload

1. 在 `BootScene` 加载 `asset-manifest.json`。
2. 在 `PreloadScene` 遍历 manifest，按类型调用：
   - `image` → `this.load.image(key, path)`
   - `spritesheet` → `this.load.spritesheet(key, path, frameConfig)`
3. 地图 JSON 可以通过 `this.load.json(mapId, jsonPath)` 读取。

### ArenaScene 渲染层级

建议层级从低到高：

```text
background_city / map_png
shadow_layer
props_static
weapons_pickups
players
projectiles
vfx
safe_zone_overlay
hud_overlay
```

中心战场不要放大型 UI；移动端 HUD 固定在屏幕边缘，并使用 `setScrollFactor(0)`。

### 规则层与视觉层分离

继续保留 `core` 作为权威规则源。视觉层只消费 `MatchSnapshot`：

```ts
sprite.setPosition(snapshotPlayer.x, snapshotPlayer.y);
sprite.setRotation(snapshotPlayer.aimAngle);
```

碰撞、伤害、缩圈、武器刷新仍以地图 JSON 和规则层数据为准，不依赖 PNG 像素。

## 5. 首轮验收清单

- 地图图片能在 844x390 手机横屏视口下保持可读。
- 4 名角色在 64–96 px 显示尺寸下仍能区分颜色和轮廓。
- 右侧按钮不遮挡主要交战区域。
- 缩圈 teal/pink 边界足够清晰，圈外风暴不会压过角色。
- 墙体、树篱、玻璃温室、水池的碰撞代理与视觉位置大体一致。
- 无可读中文、英文字母、数字、logo、水印。

## 6. 后续建议

这版包适合作为重构启动包和前端验证包。真正上线前建议再做两轮：

1. **精修轮**：把角色从 4 帧扩到 8–12 帧；武器加入独立手持角度；命中特效做序列帧。
2. **地图轮**：根据 AI 寻路、玩家动线和缩圈测试，调整 `collisionRects`、出生点和武器刷新点。

生成时间：2026-06-05。包内图片均为本次重构用途生成。
