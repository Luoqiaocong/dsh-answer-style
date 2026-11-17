# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses
[Semantic Versioning](https://semver.org/).

## [0.4.0-beta.1] - 2026-11-17

### Added

- **行高 / 段间距**：回答正文的行高与段落间距可单独设置，选「默认」即跟随主题。
- **表格美化**：隔行底色、紧凑内边距、数字等宽（`tabular-nums`）三个独立开关。

> 实验版本：以上特性可能调整或移除，只发布在 `beta` 标签；稳定线仍是 `0.2.7`（`latest`）。

## [0.2.7] - 2026-11-17

### Changed

- Reverted the experimental dark-theme color adaptation that `0.2.6` shipped to
  `latest` by mistake. The stable line is feature-for-feature identical to
  `0.2.5`; the experiment continues on `0.3.0-beta.1` (`@beta`).

## [0.2.5] - 2026-11-16

### Changed

- README rewritten around what a user needs: install, use, compatibility and a
  four-bullet “how it works”. Selector/CSS/config details moved to
  `docs/design.md`, the build and release workflow to `docs/development.md`.

## [0.2.4] - 2026-11-16

First release published from CI with npm Trusted Publishing (GitHub OIDC);
no functional change over 0.2.3.

## [0.2.3] - 2026-11-16

### Added

- **Heading weight** (`headingWeight`): h1–h6 can follow the theme or take
  400/500/600/700 independently from the body weight.
- **Color scope** (`colorScope`): the text color applies only to the runs you
  tick — `**bold**`, headings, table headers. All three are on by default, so
  existing preferences keep their look.

### Changed

- The settings panel is regrouped into 字体 / 粗细 / 颜色 / 预览 blocks separated
  by hairlines; the body and heading weights sit side by side and “恢复默认”
  lives in the header next to the on/off switch.
- Preset fonts are grouped by availability: system Chinese and Latin fonts
  first, then monospace, then an explicitly labelled group of open-source fonts
  that need to be installed.
- Any color can be set: preset swatches, the native color picker, or a typed
  hex / `rgb()` value.
- The preview is one block — heading first, then body — so both samples read
  like a real answer.
- The persistence status only appears while saving or after a failure.

## [0.2.2] - 2026-11-16

### Changed

- The preference now lives in the Host file `~/.dsh/answer-style.json`
  (`$DSH_HOME` wins when set), shared by every browser and by DSH Desktop,
  instead of per-browser `localStorage`. The browser half reads it at boot and
  writes it on every change; `localStorage` remains only as a first-paint and
  offline cache.
- The bold color now also covers headings and table headers, so no bold-looking
  run stays in the theme color.

## [0.2.1] - 2026-11-16

First public release on npm.

### Added

- Settings page **回答字体** (`settings.section`) that styles assistant answers only:
  - font family — curated stacks, installed-font enumeration via the Local Font Access API, or a custom `font-family` list;
  - overall weight — default, 300, 400, 500, 600, 700;
  - **bold text color** — colors only `**bold**` runs (`strong, b`), body text keeps the theme color;
  - reset to default, which removes the injected stylesheet.
- Live preview row, immediate application and cross-tab sync.
- Preferences persisted in `localStorage` (`dsh-answer-style/v1`).
- Input sanitation for font lists and colors; the injected rules are removed when
  the preference is reset or the plugin unloads.
