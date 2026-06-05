# Neon Arena Web

高质量手机横屏 2D 赛博卡通竞技场游戏重构版。项目保留 TypeScript、Phaser、Vite、Cloudflare Worker、Durable Object 和 WebSocket 房间架构，并使用正式图片资产替换旧几何占位图。

## 已完成范围

- 5 张 1600x1100 赛博植物屋顶地图。
- 4 个可区分的卡通 cyberpunk fighter。
- 4 类武器：`neon-katana`、`pulse-bow`、`ray-pistol`、`energy-shield-baton`。
- `GameSession` 作为权威规则源。
- `CombatEvent` 事件流：投射物、近战、命中、护盾、dash、roll、pickup、安全区阶段。
- `ArenaScene` 拆分为渲染器、输入组合器和同步控制器。
- icon-only 移动端 HUD：左摇杆、右动作按钮，不在中心战场显示可读文字。
- Worker 房间状态支持 2/3/4 人，断线重连，snapshot + events 广播。
- Vitest 覆盖地图、武器、碰撞、事件、安全区、AI、Worker、资产 manifest 和文字策略。

## 安装

```bash
npm install
npm run test
npm run lint
npm run build
npm run qa:mobile
npm run dev
```

Windows 环境可以使用：

```cmd
npm.cmd install
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run qa:mobile
npm.cmd run dev
```

## Cloudflare 配置

1. 登录 Cloudflare：

```bash
npx wrangler login
```

或设置环境变量：

```bash
export CLOUDFLARE_API_TOKEN=your_token
```

2. 构建并部署：

```bash
npm run build
npx wrangler deploy
```

3. 在线房间通过以下路由连接：

```text
/api/rooms/:roomCode?map=map01_skyline_garden_ruins&players=2&ruleset=standard
```

## 视觉验收

`npm run qa:mobile` 会启动 Vite，使用 Chromium 以 844x390 手机横屏视口截图，并输出：

```text
docs/mobile-844x390-smoke.png
docs/mobile-visual-check.json
```

检查点：

- 中心战场无遮挡。
- HUD 节点不含可读文字。
- Canvas 正常渲染。
- 手机横屏视口尺寸为 844x390。

