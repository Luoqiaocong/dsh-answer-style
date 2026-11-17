# 设计说明

实现细节，对应 [README](../README.md) 里那四行「原理」。

## 作用域

聊天里的每条模型回答都渲染在

```html
<div data-chat-flow-kind="assistant-step"> … </div>
```

这个属性由 DSH 的聊天视图按节点类型写入，是「一条回答」的稳定锚点。插件只在这棵子树里动手，因此用户消息（`user` / `steering`）、工具行（`tool`）、输入框与侧边栏天然不受影响。

Markdown 正文根节点的类名由 CSS Modules 生成、带哈希（形如 `_markdown_rve47_5`），所以选择器用 `[class*="_markdown_"]` 命中，并以块级元素（`p`、`li`、`th`…）兜底，流式输出时同样生效。

## 注入的样式

每次修改设置就重建一个 `<style id="dsh-answer-style-sheet">`：

```css
/* 字体 */
[data-chat-flow-kind="assistant-step"] [class*="_markdown_"],
[data-chat-flow-kind="assistant-step"] :is(p, li, blockquote, dd, dt, figcaption, th, td) {
  font-family: "LXGW WenKai", serif !important;
}

/* 正文粗细 */
[data-chat-flow-kind="assistant-step"] [class*="_markdown_"],
[data-chat-flow-kind="assistant-step"] :is(p, li, blockquote, dd, dt, figcaption, th, td) {
  font-weight: 700 !important;
}

/* 标题字重，独立一档 */
[data-chat-flow-kind="assistant-step"] :is(h1, h2, h3, h4, h5, h6) {
  font-weight: 500 !important;
}

/* 只给勾选的范围上色（示例：加粗片段 + 表头，标题不参与） */
[data-chat-flow-kind="assistant-step"] :is(strong, b, th) {
  color: #1d4ed8 !important;
}
```

代码块与行内代码有自己的等宽字体与颜色声明，不会被这几条覆盖。

**恢复默认 = 移除这个 `<style>`**，页面上不留任何残留；插件被卸载时同样由 `ctx.effect` 清理。

## 暗色适配

选了颜色后注入两条规则：亮色主题一条，暗色主题一条：

```css
/* 亮色 */
[data-chat-flow-kind="assistant-step"] :is(strong, b) {
  color: #1d4ed8 !important;
}

/* 暗色：默认自动提亮（62% 原色 + 38% 白） */
body[data-ds-dark-theme] [data-chat-flow-kind="assistant-step"] :is(strong, b) {
  color: color-mix(in oklab, #1d4ed8 62%, white) !important;
}

/* 暗色：设置了单独颜色时直接用它 */
body[data-ds-dark-theme] [data-chat-flow-kind="assistant-step"] :is(strong, b) {
  color: #93c5fd !important;
}
```

优先级：`darkColor`（单独颜色）> `colorAutoAdapt`（自动提亮）> 与亮色相同。

设置面板用 `getComputedStyle(body).backgroundColor` 取当前背景，算 WCAG 对比度，低于 4.5:1 会提示「偏低」。`data-ds-dark-theme` 由 `ui-layout` 的 ThemePresenter 写在 `body` 上，组件用 `MutationObserver` 监听它变化。

## 配置：Host 文件，不是浏览器缓存

偏好由 Host 半部写进

```
~/.dsh/answer-style.json     # 设置了 $DSH_HOME 就用它
```

```json
{
  "enabled": true,
  "family": "\"LXGW WenKai\", serif",
  "weight": "default",
  "headingWeight": "500",
  "color": "#1d4ed8",
  "colorAutoAdapt": true,
  "darkColor": "",
  "colorScope": { "strong": true, "headings": false, "headers": true }
}
```

浏览器半部启动时拉一次、每次修改后再写回（250ms 防抖），所以换浏览器、换设备登录同一个 Host 都还在；文件被手动改过，下次打开设置也会同步。

读取走 `GET /answer-style/config`，写入走 `PUT`。**没有用 `/plugins/...` 前缀**——那是 DSH 客户端 bundle 的专用路由，会冲突。

`localStorage`（键 `dsh-answer-style/v1`）只作首屏缓存与离线兜底：Host 路由不可用时（例如只更新了浏览器半部、还没重启 `dsh web`）设置依然生效，只是不跨浏览器。

## 输入的清洗

- 字体名：按逗号拆分，去掉引号、反斜杠、尖括号、花括号与控制字符，非通用族名一律加双引号，保证只会拼成合法的 `font-family`；
- 颜色：只接受 `#rgb` / `#rrggbb` / `rgb()` / `rgba()`，其余一律视为「跟随主题」；
- Host 侧再校验一次schema（枚举、长度、嵌套的 `colorScope` 缺省补 `true`），请求体上限 8 KB。

## 已知脆弱点

`data-chat-flow-kind="assistant-step"` 与 `_markdown_` 前缀是 DSH 的内部约定，不是公开 API。DSH 改版时若调整二者，样式会静默失效——修改点集中在 `lib/client.js` 的 `sheetText()`，仓库的冒烟测试也会直接报错。
