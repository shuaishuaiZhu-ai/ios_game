# 配置流程

## 1. 本地安装

```bash
cd neon-arena-web
npm install
```

## 2. 验证代码

```bash
npm run test
npm run lint
npm run build
npm run qa:mobile
```

`qa:mobile` 依赖本机 Chromium。默认路径是 `/usr/bin/chromium`，如果路径不同，使用：

```bash
CHROMIUM_PATH=/path/to/chromium npm run qa:mobile
```

## 3. 本地运行

```bash
npm run dev
```

浏览器访问 Vite 输出的地址。推荐使用手机横屏或浏览器设备模拟 `844x390`。

## 4. Worker 本地联调

```bash
npx wrangler dev
```

然后通过 WebSocket 路由联调在线房间：

```text
/api/rooms/TEST01?map=map01_skyline_garden_ruins&players=2&ruleset=standard
```

## 5. Cloudflare 部署

```bash
npm run build
npx wrangler login
npx wrangler deploy
```

或者使用 API Token：

```bash
export CLOUDFLARE_API_TOKEN=your_token
npm run build
npx wrangler deploy
```

## 6. 资产替换规则

资产统一放在：

```text
public/assets/neon-arena/
```

核心 manifest 位于：

```text
src/game/assets/assetManifest.ts
```

新增或替换图片时，只改 manifest，不要在 Scene 中硬编码路径。
