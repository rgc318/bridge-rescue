# 拆桥救山雀 · Finch Rescue

一款单手可玩的竖屏物理解谜小游戏。点金色拉环拔掉木销，利用桥板、浮台和配重帮助山雀过河。三章共 15 关，包含分支路线、可选金羽毛挑战和原创音乐与音效。

## 本地试玩

游戏不需要构建，也不需要后端。用任意静态文件服务提供 `dist/`，例如：

```sh
python3 -m http.server 8000 --directory dist
```

打开 `http://localhost:8000`。声音默认关闭，可以在游戏内单独开启音乐或音效。成绩与设置保存在当前浏览器，不会跨域或跨设备自动同步。

## 运行测试

```sh
node --test tests/engine.test.cjs
```

## 部署到 Cloudflare Workers

用 **Workers & Pages → Create application → GitHub** 导入本仓库。若连接现有 Worker，请使其名字与 `wrangler.jsonc` 的 `name` 一致。将生产分支设为 `main`，构建命令留空，部署命令设为 `npx wrangler deploy`。资源目录为 `dist/`；无需 Pages 项目，也不需要在仓库中保存 Cloudflare 凭据。
