# dsh-answer-style · 回答字体

[English](README.en.md) | 中文

给 **DeepSeek Harness（DSH）Web GUI** 的模型回答换字体样式：**字体 / 整体粗细 / 加粗文字颜色**，只作用于模型回答，随时一键**恢复默认**。

> 只改「模型说的话」，不动你的消息、按钮和侧边栏。颜色只施加在 `**加粗**` 片段上，正文仍跟随主题色。

<p align="left">
  <img alt="dsh" src="https://img.shields.io/badge/DSH-%3E%3D0.2.2--rc.1-4c6ef5?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img alt="zero build" src="https://img.shields.io/badge/build-none-brightgreen?style=flat-square" />
  <img alt="no network" src="https://img.shields.io/badge/network-none-lightgrey?style=flat-square" />
</p>

## 功能

| 设置项 | 说明 |
| --- | --- |
| 启用 | 总开关。关掉立即恢复主题原样，偏好不丢 |
| 字体 | 内置常用字体栈：微软雅黑 / 苹方 / 思源黑体 / 霞鹜文楷 / 楷体 / 宋体 / 等线 / 等宽 / 西文衬线；「读取本机字体」枚举本机已安装字体（Chrome 会弹一次权限，拒绝也不影响手填）；也可「自定义…」直接写 `font-family` 列表 |
| 整体粗细 | 默认（跟随主题）/ 300 / 400 / 500 / 600 / 700。标题与行内 `**加粗**` 保留自己的字重 |
| 加粗文字颜色 | 只给回答里 `**加粗**` 的部分上色（正文保持主题色）；取色器 + 8 个预设色；「跟随主题」恢复默认 |
| 恢复默认 | 清空全部偏好并移除注入样式，等价于从未设置过 |

- 生效范围：聊天记录里**模型回答**的正文 —— 含回答中的思考过程、列表、表格、标题
- 不影响：你的消息、工具行、输入框、侧边栏及其他界面控件
- 即时生效：设置面板背后的对话同步变化，底部有实时预览条
- 刷新/重启后保留：偏好存在浏览器 `localStorage`（键 `dsh-answer-style/v1`），不发往 Host、不联网
- 零依赖、零构建：手写浏览器 bundle，装完即用

## 兼容性

| 项目 | 说明 |
| --- | --- |
| 最低 DSH 版本 | **`0.2.2-rc.1`** — 写在 `package.json` 的 `dsh.engines.dsh`，插件管理器安装时会校验，低于此版本会被拒绝 |
| 已验证 | DSH Web `0.2.2-rc.1`（Windows 11 / Chrome） |
| 理论可用 | `0.2.x` 全系（`settings.section` 槽位与 `data-chat-flow-kind` 锚点自 0.1.x 起就存在，但本插件只按 0.2.2 的契约实测过） |
| Web GUI | 支持（Chrome / Edge / Firefox / Safari 等现代浏览器） |
| **DSH Desktop** | **支持** —— 同一套 Web 前端与客户端插件机制，装到 `desktop` profile 即可（见下） |
| 系统 | 跨平台：Windows / macOS / Linux 浏览器都能用，字体以本机已安装的为准 |
| 依赖 | 无运行时依赖；不打包字体、不联网、不采集数据 |

### 桌面端安装

```sh
dsh plugin --profile desktop add github:luoqiaocong/dsh-answer-style
```

手动安装：把包放进 `~/.dsh/profiles/desktop/node_modules/dsh-answer-style`，在
`~/.dsh/profiles/desktop/cordis.patch.yml` 末尾追加与 Web 端相同的 insert 行，重启 DSH Desktop。

桌面端的两点差异：

- Electron 没有 `window.queryLocalFonts`，「读取本机字体」会提示不可用 —— 直接手填字体名即可，内置字体栈照常生效；
- 偏好存在 Electron 自己的 `localStorage` 里，与浏览器互不影响（想两端一致就各设一次）。

## 安装

### 1. 从 GitHub 安装（推荐）

```sh
dsh plugin --profile web add github:luoqiaocong/dsh-answer-style
```

装上后**刷新页面**；若设置里看不到「回答字体」，重启一次 `dsh web`（或 DSH Desktop）。

### 2. 从 npm 安装

```sh
dsh plugin --profile web add dsh-answer-style
```

### 3. 本地目录安装（开发用）

```sh
git clone https://github.com/luoqiaocong/dsh-answer-style.git
dsh plugin --profile web add link:$(pwd)/dsh-answer-style
```

不想用 CLI 时，手动两步也可以：

1. 把整个包放进 `~/.dsh/profiles/web/node_modules/dsh-answer-style`
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: answer-style
      name: dsh-answer-style
```

然后刷新页面。

## 使用

1. 打开 **设置 → 回答字体**
2. 选字体（或「读取本机字体」）；调「整体粗细」；给加粗片段挑个颜色，比如蓝色 `#1d4ed8`
3. 想回到原样就点 **恢复默认**（或单项选回「跟随主题 / 默认」）

## 卸载

```sh
dsh plugin --profile web remove dsh-answer-style
```

手动安装的话：删掉 `cordis.patch.yml` 里那条 `answer-style` 插入行，再删掉 `node_modules/dsh-answer-style`，最后刷新页面。

## 和已有字体插件的关系

| 插件 | 作用范围 | 能力 |
| --- | --- | --- |
| **本插件** `dsh-answer-style` | 仅模型回答 | 字体 + 整体粗细 + **加粗文字颜色** + 恢复默认 |
| [`dsh-font`](https://github.com/WangPaoPaoLab/dsh-font) | 整个界面 | 99 界面字体 + 31 代码字体 |
| [`dsh-system-fonts`](https://github.com/kira4094/dsh-system-fonts) | 整个界面 | 枚举本机全部字体 |
| DSH 自带 **设置 → 外观** | 整个界面 | 字号、字体栈 |

三者互补：想全局换字体用前两者或自带外观，想让「回答本身」有辨识度（字体/粗细/加粗配色）用本插件。

## 原理

Client 半部注册 `settings.section` 槽位得到「回答字体」页面；每次改设置就重建一个 `<style id="dsh-answer-style-sheet">`：

```css
/* 字体 */
[data-chat-flow-kind="assistant-step"] [class*="_markdown_"],
[data-chat-flow-kind="assistant-step"] :is(p, li, blockquote, dd, dt, figcaption, th, td) {
  font-family: "霞鹜文楷", "LXGW WenKai", serif !important;
}

/* 整体粗细 */
[data-chat-flow-kind="assistant-step"] [class*="_markdown_"],
[data-chat-flow-kind="assistant-step"] :is(p, li, blockquote, dd, dt, figcaption, th, td) {
  font-weight: 700 !important;
}

/* 只有加粗片段上色，正文不动 */
[data-chat-flow-kind="assistant-step"] :is(strong, b) {
  color: #1d4ed8 !important;
}
```

- `[data-chat-flow-kind="assistant-step"]` 是聊天里「模型回答」那一行的稳定锚点，所以你的消息与界面控件天然不受影响；
- `[class*="_markdown_"]` 命中 Markdown 正文根节点（CSS Modules 带哈希），配合块级元素兜底，流式输出时也同样生效；
- 代码块与行内代码有自己的等宽字体与颜色声明，不会被覆盖；
- **恢复默认 = 删掉这个 `<style>`**，没有任何残留。

Host 半部（`lib/index.js`）是空插件，只负责让 loader 行在 Host 侧成立；功能全在浏览器端。

## 目录结构

```
.
├── package.json          # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # Host loader 行（id: answer-style）
├── lib/
│   ├── index.js          # Host 半部（no-op）
│   └── client.js         # 浏览器半部：设置页 + 样式注入
├── README.md
├── README.en.md
├── CHANGELOG.md
└── LICENSE
```

## 开发

无需构建，改完 `lib/client.js` 直接在 profile 里替换即可。自带零依赖自检：

```sh
npm run check   # node --check + scripts/smoke.mjs（假 DOM / 假 React，断言注入的 CSS 与存储行为）
```

浏览器 bundle 的格式是 DSH 的模块加载器约定：

```js
window.__ModuleLoader__.load({ id: 'dsh-answer-style', factory: (require) => { /* … */ } })
```

导出的 `name` / `inject` / `apply(ctx)` 就是标准 Cordis 客户端插件面。样式与存储都在 `apply` 内完成，`ctx.effect` 负责卸载时清理 `<style>` 与监听。

## 限制

- 需要 DSH `>= 0.2.2-rc.1`（依赖 `settings.section` 槽位与 `data-chat-flow-kind` 锚点）；
- 只覆盖模型回答，不改变界面其他部分（想全局换字体请用上面的字体插件）；
- 字体必须是本机已安装的字体，插件不打包任何字体文件，也不联网；
- 偏好按浏览器保存，换浏览器或清空站点数据后回到默认；
- 如果 DSH 未来改了 `data-chat-flow-kind="assistant-step"` 或 CSS Modules 的 `_markdown_` 命名，需要同步小改选择器（集中在 `lib/client.js` 的 `sheetText()`）。

## 发布

1. 仓库里的 `luoqiaocong` 是按本机 git 配置预填的，若与你的 GitHub 账号不同，全局替换一次即可；
2. 建仓库并推送：

   ```sh
   git remote add origin https://github.com/luoqiaocong/dsh-answer-style.git
   git push -u origin main
   ```

3. 想让人用 `dsh plugin --profile web add dsh-answer-style` 安装，再发 npm：

   ```sh
   npm publish
   ```

   包是纯 JS、无构建、无依赖，`files` 只带运行必需的文件。

GitHub 上打 `dsh-plugin` topic，插件市场（dshmarket 等）按 topic / npm 关键字索引，通常无需额外提交。

## 安全

- 自定义字体名会做白名单清洗（去掉引号、尖括号、花括号、控制字符），颜色只接受 hex / `rgb()` / `rgba()`，不会把任意 CSS 注入页面；
- 不读取、不发送任何对话内容；只有你自己的字体/颜色偏好在本地 `localStorage`。

## License

[MIT](LICENSE)
