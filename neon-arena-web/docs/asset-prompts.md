# Neon Arena Web ImageGen Asset Prompts

ImageGen 当前可能限流。本文件保存可复用的 Pro 模式提示词和资产拆分清单；生成出 PNG 后，把文件放入 `public/assets/` 并更新 `src/game/assets.ts` 对应 key 即可。

## 选定视觉基准

- 主视觉：Ion Rooftop Circuit，使用用户提供的第 1 张图作为 HUD、角色比例、霓虹屋顶和整体战斗读性的主参考。
- 地图参考：Foundry 使用第 2 张熔炉图；Skyline 使用第 3 张空中花园图。
- 首轮额外地图：Orbital Dockyard Sprawl、Night Market Crossfire，保持同一赛博卡通资产语言。

## 完整资产包清单

- 地图背景：5 张，横屏俯视/3-4 视角，建议至少 `1600x1100`。
- 角色：4 个卡通人物，透明背景，idle/run/dash/melee/shoot/hit 各 4-6 帧。
- 武器：energy blade、shock hammer、pulse rifle、laser carbine，透明背景。
- 特效：projectile、melee arc、dash trail、hit spark、safe-zone ring/storm edge。
- UI：移动端 joystick、shoot、dash、roll、punch、kick、throw 图标；HUD 血条/冷却条。

## 概念图提示词

### Ion Rooftop Circuit

```text
Create a high-quality cyberpunk cartoon 2D mobile browser game concept image. Target: 844x390 landscape gameplay screenshot, no phone frame, no browser chrome. Scene: Ion Rooftop Circuit, a large futuristic rooftop arena at night with neon circuit floor lines, wide playable lanes, rooftop bridges, vents, AC units, glowing wall cover, energy barriers, and distant cyber city lights. Camera: top-down / 3-4 view, clear mobile game readability. Characters: exactly 4 cute but sharp cartoon fighters, readable at mobile scale, each with distinct silhouette and color: cyan local hero, magenta enemy, yellow enemy, violet enemy. Gameplay elements: visible shrinking safe-zone circle, wall cover, melee weapon pickup, ranged weapon pickup, projectile trails, dodge trails, and melee impact arcs. HUD: mobile-first overlay mockup with translucent left joystick, right circular action buttons with icons only, compact health/ammo bars as abstract blocks, small safe-zone indicator. Keep center playfield clear. Style: polished production-quality 2D game art, hand-painted cartoon, clean outlines, premium mobile arena game, cyberpunk neon palette, dark navy, cyan, magenta, violet. Avoid readable Chinese, readable letters, readable numbers, gibberish text, logos, watermark, photorealism, placeholder shapes, blurry UI.
```

### Foundry Overpass Chase

```text
Create a high-quality cyberpunk cartoon 2D mobile browser game concept image. Target: 844x390 landscape gameplay screenshot, no phone frame, no browser chrome. Scene: Foundry Overpass Chase, a large industrial neon foundry arena with elevated overpasses, conveyor belts, molten metal channels, steel bridges, gantry cranes, steam vents, glowing hazard rails, ramps, chokepoints, and heavy wall cover. Camera: top-down / 3-4 view, optimized for mobile browser gameplay. Characters: exactly 4 cute stylized cartoon fighters in motion, distinct silhouettes and colors, readable at small scale. Gameplay elements: shrinking orange/red battle ring, heat haze outside the ring, ranged projectiles, melee hit arcs, dodge/roll trails, pickups for shock hammer, laser carbine, plasma discs, and stun spear. HUD: mobile game overlay with translucent left joystick, right icon-only action buttons, abstract health/ammo bars, small minimap/ring indicator. HUD must not cover the center battlefield. Style: polished production-quality 2D cartoon game art, cyberpunk industrial lighting, orange molten glow, red neon, dark steel, high contrast, clean outlines. Avoid readable Chinese, readable letters, readable numbers, gibberish text, logos, watermark, photorealism, placeholder geometry, excessive blur.
```

### Skyline Garden Ruins

```text
Create a high-quality cyberpunk cartoon 2D mobile browser game concept image. Target: 844x390 landscape gameplay screenshot, no phone frame, no browser chrome. Scene: Skyline Garden Ruins, a large ruined rooftop botanical garden above a futuristic skyline, broken glasshouse frames, neon plants, shallow reflective pools, cracked stone paths, collapsed wall cover, hedge-like cover, floating platforms, and sky bridges. Camera: top-down / 3-4 view, clear mobile game readability. Characters: exactly 4 cute cyberpunk cartoon fighters, distinct colors and silhouettes, readable at mobile scale. Gameplay elements: teal/pink shrinking safe-zone circle, soft storm particles outside the ring, cover walls and ruins, melee pickup, ranged pickup, neon katana, pulse bow, ray pistol, energy shield baton, projectile trails and melee impact effects. HUD: mobile-first overlay with translucent left joystick, right circular icon-only action buttons, compact abstract health/ammo bars, no readable UI text. Keep the center playfield clear. Style: polished premium 2D game art, cyberpunk cartoon, teal, pink, green neon plants, soft sci-fi glow, clean outlines, high-quality production assets. Avoid readable Chinese, readable letters, readable numbers, gibberish, watermark, logos, phone frame, browser frame, photorealism, placeholder shapes.
```
