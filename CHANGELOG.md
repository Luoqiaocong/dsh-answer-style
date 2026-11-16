# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-11-16

### Changed

- **Bold text color instead of body color**: the color setting now paints only
  `**bold**` runs (`strong, b`) inside assistant answers. Body text keeps the
  theme color, so a blue bold run no longer turns an entire answer blue.
- The settings row is renamed from “字体颜色” to “加粗文字颜色”, and the preview
  line shows one bold sample in the chosen color.

## [0.1.0] - 2026-11-16

### Added

- First release: a `settings.section` page (“回答字体”) that styles the assistant
  rows only — font family (presets, installed-font enumeration, custom list),
  overall weight, body color, and a reset-to-default action.
- Persistence in `localStorage` (`dsh-answer-style/v1`) with cross-tab sync.
- Input sanitation for font lists and colors; the injected rules are removed
  when the preference is reset or the plugin unloads.
