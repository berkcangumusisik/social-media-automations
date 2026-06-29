# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0]

First release.

### Added

- CLI with `generate`, `ideate`, `list-templates`, `list-platforms`, and `init-demo`.
- Content generation through the local Claude Code CLI (`claude -p`), no API key. Three modes: viral discovery, brief, and research the topic on the web.
- FFmpeg rendering with a plugin template and platform registry.
- Seven platform presets: TikTok, Instagram Reels, YouTube Shorts, Instagram Post, LinkedIn Post, X Post, Facebook Post. Each carries a safe area and a theme (accent colour and card background).
- Five templates: hook-subtitle, clean-caption, bold-center, word-pop (9:16 video) and image-card (still). Modern styling with rounded caption pills and accent bars.
- Text rendering in Node with pureimage so it works on any FFmpeg build, including ones without libfreetype or libass. DejaVu Sans bundled as the default font.
- Turkish and English support for content and CLI messages. Text is normalized to NFC so Turkish renders correctly from any source.
- JSON and YAML config, batch generation, caption sidecar files.
- Tests with `node:test`. CI on Node 20, 22, 24.
- Docs: README (EN and TR), CONTRIBUTING (EN and TR), CODE_OF_CONDUCT, SECURITY, ROADMAP.

[Unreleased]: https://github.com/berkcangumusisik/social-media-automations/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/berkcangumusisik/social-media-automations/releases/tag/v0.1.0
