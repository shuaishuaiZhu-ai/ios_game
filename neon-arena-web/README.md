# Neon Arena Web/PWA

手机端优先的赛博卡通 2D 多人竞技场游戏。前端使用 Vite + TypeScript + Phaser，在线房间使用 Cloudflare Worker + Durable Object + WebSocket。

## 当前能力

- 单人 AI：简单、中等、困难三档。
- 在线房间：游客昵称 + 房间码，支持 2/3/4 人。
- 5 张大地图：Ion Rooftop Circuit、Foundry Overpass Chase、Skyline Garden Ruins、Orbital Dockyard Sprawl、Night Market Crossfire。
- 大地图缩圈：3 阶段安全区，圈外持续掉血，避免逃跑拖局。
- 武器拾取：energy blade、shock hammer、pulse rifle、laser carbine。
- 肉搏模式：禁用武器拾取和射击，保留拳击、飞踢、摔人。
- 战斗手感：冲刺、翻滚、击退、无敌窗口、武器冷却反馈。
- 资产驱动渲染：地图、墙体、角色、武器和特效通过 manifest 加载，不再依赖纯几何占位。
- 手机控制：左摇杆，右侧射击、冲刺、翻滚、拳、踢、摔。

## 本地命令

```powershell
npm.cmd install
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

`npm.cmd run dev` 只启动前端 Vite。在线房间需要 Worker/Durable Object，可通过 `wrangler dev` 或 Cloudflare 部署验证。

## 资产工作流

- 资产 manifest：`src/game/assets.ts`
- 当前项目资产：`public/assets/`
- ImageGen/Pro 提示词：`docs/asset-prompts.md`

用户提供的 3 张概念图中，第 1 张作为主视觉目标；第 2 张用于 Foundry 地图方向；第 3 张用于 Skyline 地图方向。后续如果生成了更完整 PNG 或精灵表，只需要把文件放入 `public/assets/` 并更新 manifest key 对应路径。

## Cloudflare 部署

需要先完成以下任一认证方式：

- `npx wrangler login`
- 或设置具备 Worker、Pages、Durable Objects 权限的 `CLOUDFLARE_API_TOKEN`

部署：

```powershell
npm.cmd run build
npx wrangler deploy
```

默认可以先使用 Cloudflare 分配域名。自定义域名不影响首版可玩性，可以后续配置。

## 验证重点

- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run build`
- Vite 桌面和手机视口截图
- 单人 AI 完成一局
- 两个浏览器标签页加入同一在线房间
- HUD 不遮挡战场中心，角色、武器、墙体、缩圈都能读清
