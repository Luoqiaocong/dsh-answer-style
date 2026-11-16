# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses
[Semantic Versioning](https://semver.org/).

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
