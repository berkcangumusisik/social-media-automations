# Roadmap

This is a living list of where the project could go. Nothing here is promised. If
something looks interesting, open an issue to claim it or just send a pull request.
See [CONTRIBUTING.md](CONTRIBUTING.md) for how platforms and templates are added.

## Good first issues

Small, self contained, friendly for a first contribution:

- Add a new platform preset (for example Pinterest, Snapchat, Threads). One object in `src/platforms/presets.js`.
- Add a new template (for example a top and bottom split caption, or a lower third bar). One file in `src/templates/`.
- Add a new content language to `src/utils/i18n.js` and the prompt language map.
- Add more example configs under `examples/` that show a specific look.
- Improve a template's safe area numbers for a platform after testing on a real device.
- Add a `--list-fonts` or font path validation helper.

## Bigger ideas

- Word level subtitle timing so word-pop highlights the active word.
- Multiple scenes per video (intro, body, outro) from a single config.
- A small built in library of royalty free background patterns generated with FFmpeg.
- Image and thumbnail generation for posts beyond the still card.
- Optional publishing step (an opt in `publish` module) for platforms that allow it.
- A theme override block in config so users can set their own accent colour and background.
- More fonts shipped or a font download helper, with clear licensing.
- A preview command that renders a single frame quickly for fast iteration.

## Non goals (for now)

- Hosting a server or web UI. This is a local CLI.
- Bundling a paid API path. The tool uses local Claude Code on purpose.
