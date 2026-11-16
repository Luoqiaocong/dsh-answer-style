# dsh-answer-style · Answer Typography

[中文](README.md) | English

Change **only the model's answers** in the DeepSeek Harness (DSH) Web GUI: **font family / overall weight / bold-text color**, with a one-click **reset to default**.

> Your own messages, tool rows and the rest of the UI keep the theme. The color is applied to `**bold**` runs only — body text keeps the theme color.

<p align="left">
  <img alt="dsh" src="https://img.shields.io/badge/DSH-%3E%3D0.2.2--rc.1-4c6ef5?style=flat-square" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img alt="zero build" src="https://img.shields.io/badge/build-none-brightgreen?style=flat-square" />
  <img alt="no network" src="https://img.shields.io/badge/network-none-lightgrey?style=flat-square" />
</p>

## Features

| Setting | What it does |
| --- | --- |
| Enable | Master switch. Turn it off to restore the theme instantly; preferences are kept |
| Font | Curated stacks (Microsoft YaHei, PingFang, Source Han Sans, LXGW WenKai, KaiTi, SimSun, DengXian, monospace, serif) · **Load installed fonts** enumerates local fonts via the Local Font Access API · or type a custom `font-family` list |
| Overall weight | Default (theme) / 300 / 400 / 500 / 600 / 700. Headings and `**bold**` keep their own weight |
| Bold text color | Colors **only** `**bold**` runs (body text keeps the theme color); color picker + 8 presets; “Follow theme” resets |
| Reset | Clears every preference and removes the injected stylesheet |

- Scope: the assistant body of chat rows, including reasoning text, lists, tables and headings
- Live: changes apply immediately, with a preview row at the bottom of the panel
- Persisted per browser in `localStorage` (`dsh-answer-style/v1`); nothing is sent to the Host, no network
- Zero dependencies, zero build: the browser bundle is hand-written

## Compatibility

| Item | Detail |
| --- | --- |
| Minimum DSH | **`0.2.2-rc.1`** (`dsh.engines.dsh`; the plugin manager refuses older releases) |
| Verified on | DSH Web `0.2.2-rc.1` (Windows 11 / Chrome) |
| Expected to work | the whole `0.2.x` line — the `settings.section` slot and the `data-chat-flow-kind` anchor exist since `0.1.x`, but only `0.2.2` was tested |
| Web GUI | yes — modern Chrome / Edge / Firefox / Safari |
| **DSH Desktop** | **yes** — same web frontend and the same client-plugin mechanism; install into the `desktop` profile |
| OS | cross-platform; fonts follow what the machine has installed |
| Dependencies | none at runtime; ships no font files, no network, no telemetry |

### Desktop install

```sh
dsh plugin --profile desktop add github:luoqiaocong/dsh-answer-style
```

Electron has no `window.queryLocalFonts`, so “Load installed fonts” reports it as unavailable —
just type the family name instead; the built-in stacks keep working. Preferences live in the
Electron profile's own `localStorage`, independent from the browser.

## Install

```sh
# from GitHub
dsh plugin --profile web add github:luoqiaocong/dsh-answer-style

# from npm
dsh plugin --profile web add dsh-answer-style
```

Reload the page afterwards. If the **Settings → 回答字体** section is missing, restart `dsh web` (or DSH Desktop) once.

Manual install: copy the package into `~/.dsh/profiles/web/node_modules/dsh-answer-style` and append to `~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- insert:
    - id: answer-style
      name: dsh-answer-style
```

## Usage

Open **Settings → 回答字体**, pick a font (or load local fonts), adjust the overall weight, and choose a color for bold runs — blue `#1d4ed8`, for example. **Reset** restores the original look.

## How it works

The client half registers the `settings.section` slot and rebuilds one stylesheet:

```css
[data-chat-flow-kind="assistant-step"] [class*="_markdown_"],
[data-chat-flow-kind="assistant-step"] :is(p, li, blockquote, dd, dt, figcaption, th, td) {
  font-family: "LXGW WenKai", serif !important;
}

/* bold runs only — body text untouched */
[data-chat-flow-kind="assistant-step"] :is(strong, b) {
  color: #1d4ed8 !important;
}
```

`[data-chat-flow-kind="assistant-step"]` is the stable anchor of one assistant answer row, so user messages and UI chrome are untouched. Code blocks keep their own monospace font and color. Reset simply removes the `<style>` element.

## Limits

- Requires DSH `>= 0.2.2-rc.1` (`settings.section` slot and the `data-chat-flow-kind` anchor);
- Assistant answers only — use `dsh-font` / `dsh-system-fonts` (or the built-in Appearance page) to restyle the whole UI;
- Fonts must already be installed locally; the plugin ships no font files and makes no network calls;
- Preferences are per browser.

## License

[MIT](LICENSE)
