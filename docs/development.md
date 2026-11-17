# 开发与发布

## 目录结构

```
.
├── package.json          # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # Host loader 行（id: answer-style）
├── lib/
│   ├── index.js          # Host 半部：读写 answer-style.json 的路由
│   └── client.js         # 浏览器半部：设置页 + 样式注入
├── scripts/smoke.mjs     # 零依赖自检
├── docs/                 # 本文件 + 设计说明
├── README.md / README.en.md
├── CHANGELOG.md
└── LICENSE
```

## 本地开发

无需构建：改完 `lib/client.js` 直接替换 profile 里的同名文件，然后刷新页面。Host 半部（`lib/index.js`）改动需要重启一次 `dsh web`，因为 Node 的模块缓存不会重载它。

```sh
npm run check   # node --check lib/*.js + scripts/smoke.mjs
```

`scripts/smoke.mjs` 用最小的 `window` / `document` / `react` 桩加载浏览器 bundle，断言：只注册一次 `settings.section`、默认不注入样式、注入的 CSS 只命中勾选的范围、标题字重独立成条、偏好持久化、恢复默认清空、CSS 注入被消毒。

浏览器 bundle 遵循 DSH 的模块加载器约定：

```js
window.__ModuleLoader__.load({ id: 'dsh-answer-style', factory: (require) => { /* … */ } })
```

导出 `name` / `inject` / `apply(ctx)` 即为标准 Cordis 客户端插件面；`ctx.effect` 负责卸载时清理 `<style>` 与事件监听。

## 手动安装

1. 把包放进 `~/.dsh/profiles/web/node_modules/dsh-answer-style`
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: answer-style
      name: dsh-answer-style
```

3. 刷新页面。桌面端同理，把 `web` 换成 `desktop` 并重启 DSH Desktop。

## 发布

发布由 GitHub Actions 完成，使用 **npm Trusted Publishing**（GitHub OIDC），仓库里没有任何 npm token：

1. 改 `package.json` 的 `version` 与 `CHANGELOG.md`，提交并推送 `main`；
2. 打标签并推送：

   ```sh
   git tag v0.2.5
   git push origin v0.2.5
   ```

3. `.github/workflows/publish.yml` 会跑 `npm run check`，然后 `npm publish --provenance --access public`；
4. 跑完核对：`npm view dsh-answer-style version dist-tags`。

npm 页面上的 Trusted Publisher 需要一次性配置：owner `Luoqiaocong`、repository `dsh-answer-style`、workflow `publish.yml`、权限 **`npm publish`**（不是 `npm stage publish`，后者只能进暂存区）。

> 标签触发只对**新标签**生效：删除后重新推同一个标签名不会再次触发工作流。

## 卸载

```sh
dsh plugin --profile web remove dsh-answer-style
```

手动安装的话：删掉 `cordis.patch.yml` 里那条 `answer-style` 插入行，再删掉 `node_modules/dsh-answer-style`，刷新页面。
