# dsh-answer-style · 回答字体

[English](README.en.md) | 中文

给 **DeepSeek Harness（DSH）** 的模型回答单独换排版：**字体 / 整体粗细 / 加粗文字颜色**，只改「模型说的话」，随时一键恢复默认。

> 你的消息、工具行、输入框和侧边栏完全不受影响。颜色只施加在 `**加粗**` 片段上，正文继续跟随主题色。

<p align="left">
  <a href="https://www.npmjs.com/package/dsh-answer-style"><img alt="npm" src="https://img.shields.io/npm/v/dsh-answer-style?style=flat-square&color=4c6ef5" /></a>
  <img alt="DSH" src="https://img.shields.io/badge/DSH-%3E%3D0.2.2--rc.1-4c6ef5?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img alt="build" src="https://img.shields.io/badge/build-none-brightgreen?style=flat-square" />
  <img alt="network" src="https://img.shields.io/badge/network-none-lightgrey?style=flat-square" />
</p>

## 截图

| 设置页 | 字体下拉 |
| --- | --- |
| <img src="https://raw.githubusercontent.com/Luoqiaocong/dsh-answer-style/main/docs/screenshots/settings-panel.png" width="470" alt="回答字体设置页" /> | <img src="https://raw.githubusercontent.com/Luoqiaocong/dsh-answer-style/main/docs/screenshots/font-menu.png" width="380" alt="字体下拉列表" /> |


## 为什么

界面级的字体设置会同时作用于侧边栏、按钮和输入框。如果你只想让自己**读回答时**更舒服、或者让关键结论一眼可见，那需要的其实只是「回答本身」换字体、加粗内容换个颜色 —— 这个插件把作用域严格限制在模型回答的那一行。

## 功能

| 设置项 | 说明 |
| --- | --- |
| 启用 | 总开关。关掉立即恢复主题原样，偏好保留 |
| 字体 | 内置常用字体栈：微软雅黑 / 苹方 / 思源黑体 / 霞鹜文楷 / 楷体 / 宋体 / 等线 / 等宽 / 西文衬线；也可「读取本机字体」枚举电脑上已装的所有字体，或「自定义…」直接写 `font-family` 列表 |
| 整体粗细 | 默认（跟随主题）/ 300 / 400 / 500 / 600 / 700。标题和行内 `**加粗**` 保留自己的字重 |
| 加粗文字颜色 | 只给回答里 `**加粗**` 的部分上色，正文保持主题色；取色器 + 8 个预设色，选「跟随主题」即可还原 |
| 恢复默认 | 清空全部偏好并移除注入的样式，等价于从未设置过 |

- **作用范围**：聊天记录里模型回答的正文，含回答中的思考过程、列表、表格与标题
- **不影响**：你的消息、工具行、输入框、侧边栏及其他界面控件
- **即时生效**：设置面板背后的对话会同步变化，面板底部有实时预览
- **持久化**：偏好存在浏览器 `localStorage`（键 `dsh-answer-style/v1`），刷新、重启后保留
- **轻量**：零运行时依赖、零构建、不打包字体、不联网、不采集数据

## 安装

### npm（推荐）

```sh
dsh plugin --profile web add dsh-answer-style
```

### GitHub

```sh
dsh plugin --profile web add github:Luoqiaocong/dsh-answer-style
```

安装后**刷新页面**；如果设置里没有出现「回答字体」，重启一次 `dsh web`（或 DSH Desktop）。

### 手动安装

1. 把包放到 `~/.dsh/profiles/web/node_modules/dsh-answer-style`
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: answer-style
      name: dsh-answer-style
```

3. 刷新页面

### DSH Desktop

```sh
dsh plugin --profile desktop add dsh-answer-style
```

手动安装同理：放进 `~/.dsh/profiles/desktop/node_modules/dsh-answer-style`，在
`~/.dsh/profiles/desktop/cordis.patch.yml` 追加同一段 insert，然后重启 DSH Desktop。

## 使用

1. 打开 **设置 → 回答字体**
2. 选字体（或点「读取本机字体」）；按需要调整整体粗细；给加粗片段挑个颜色，例如蓝色 `#1d4ed8`
3. 想回到原样，点 **恢复默认**；单项还原用「跟随主题」/「默认」即可

## 兼容性

| 项目 | 说明 |
| --- | --- |
| 最低 DSH 版本 | `0.2.2-rc.1`（写在 `dsh.engines.dsh`，插件管理器安装时会校验） |
| 版本范围 | `0.2.x` 系列 |
| Web GUI | Chrome / Edge / Firefox / Safari 等现代浏览器 |
| DSH Desktop | 支持，安装到 `desktop` profile 即可（见上） |
| 操作系统 | Windows / macOS / Linux，字体以本机已安装的为准 |
| 运行时依赖 | 无 |

## 原理

客户端半部注册 `settings.section` 槽位，得到「回答字体」设置页；每次修改设置就重建一个 `<style id="dsh-answer-style-sheet">`：

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

- `[data-chat-flow-kind="assistant-step"]` 是聊天中「模型回答」那一行的稳定锚点，因此用户消息与界面控件天然不受影响；
- `[class*="_markdown_"]` 命中 Markdown 正文根节点（CSS Modules 类名带哈希），并以块级元素兜底，流式输出时同样生效；
- 代码块与行内代码有自己的等宽字体和颜色声明，不会被覆盖；
- **恢复默认 = 移除这个 `<style>`**，不留任何残留。

Host 半部（`lib/index.js`）是空插件，只用于让 loader 行在 Host 侧成立，功能全部在浏览器端。

## 开发

无需构建，修改 `lib/client.js` 后在 profile 中替换同名文件即可。仓库自带零依赖自检：

```sh
npm run check   # node --check + scripts/smoke.mjs
```

`scripts/smoke.mjs` 用最小的 `window` / `document` / `react` 桩加载浏览器 bundle，断言注入的 CSS 选择器、颜色只命中加粗片段、偏好持久化与恢复默认。

浏览器 bundle 遵循 DSH 的模块加载器约定：

```js
window.__ModuleLoader__.load({ id: 'dsh-answer-style', factory: (require) => { /* … */ } })
```

导出 `name` / `inject` / `apply(ctx)` 即为标准 Cordis 客户端插件面，`ctx.effect` 负责卸载时清理 `<style>` 与事件监听。

## 目录结构

```
.
├── package.json          # dsh.bundle.patch + dsh.client 声明
├── cordis.patch.yml      # Host loader 行（id: answer-style）
├── lib/
│   ├── index.js          # Host 半部（no-op）
│   └── client.js         # 浏览器半部：设置页 + 样式注入
├── scripts/smoke.mjs     # 零依赖自检
├── README.md / README.en.md
├── CHANGELOG.md
└── LICENSE
```

## 安全

- 自定义字体名会做清洗（去掉引号、尖括号、花括号与控制字符），颜色只接受 hex / `rgb()` / `rgba()`，不会把任意 CSS 注入页面；
- 不读取、不发送任何对话内容，只把你自己的字体与颜色偏好存在本地 `localStorage`。

## 限制

- 只覆盖模型回答，界面其他部分不变；
- 字体必须是本机已安装的字体，插件不打包字体文件，也不联网；
- 偏好按浏览器保存，换浏览器或清空站点数据后回到默认；
- 若 DSH 未来调整 `data-chat-flow-kind="assistant-step"` 或 CSS Modules 的 `_markdown_` 命名，需要同步修改 `lib/client.js` 中 `sheetText()` 的选择器。

## License

[MIT](LICENSE)
