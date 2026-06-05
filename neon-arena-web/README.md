# Neon Arena Web/PWA

Neon Arena 的独立 Web/PWA 版本，使用 Vite + TypeScript + Phaser 实现浏览器端游戏，使用 Cloudflare Worker + Durable Object 实现在线房间 WebSocket 同步。

## 已实现范围

- 手机浏览器/PWA 壳：`manifest.webmanifest`、service worker、全屏横屏配置。
- 单人 AI：简单、中等、困难三档。
- 在线房间：游客昵称 + 房间码，目标人数 2/3/4，房间满员后开局。
- 三张地图：`Neon Grid`、`Foundry Lanes`、`Skyline Ruins`。
- 地图墙体：阻挡玩家移动和远程子弹。
- 武器拾取：普通模式刷新近战/远程武器，近战伤害高于远程。
- 肉搏模式：禁用武器和射击，支持拳击、飞踢、摔人。
- 缩圈机制：3 阶段圆形安全区，圈外持续掉血。
- 视觉主题：`Ion Circuit`、`Foundry Glow`、`Skyline Ruins`，菜单和游戏内均可切换。

## 本地命令

```powershell
npm.cmd install
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

`npm.cmd run dev` 只启动前端 Vite。在线房间需要 Worker/Durable Object，可在构建后用 Wrangler 或部署到 Cloudflare 验证。

## Cloudflare 部署

需要先完成以下任一认证方式：

- `npx wrangler login`
- 或配置有 Worker/Pages/Durable Objects 权限的 `CLOUDFLARE_API_TOKEN`

部署入口：

```powershell
npm.cmd run build
npx wrangler deploy
```

默认使用 Cloudflare 分配的域名即可。是否绑定自定义域名可以后续再决定，不影响首版可玩性。

## 测试覆盖

- `tests/core.test.ts`：地图合法性、墙体碰撞、子弹遮挡、武器伤害、肉搏模式、缩圈、胜负、AI 安全区决策。
- `tests/workerRoomState.test.ts`：房间创建、加入、满员、4 人 FFA、输入快照、断线重连。

## 仍需你提供或确认

- Cloudflare 账号。
- Wrangler 登录或 Cloudflare API Token。
- Cloudflare Pages/Worker 项目配置。
- 是否需要自定义域名。
- 上线前最好用一台低端手机浏览器实测性能和触控手感。
