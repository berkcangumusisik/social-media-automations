# social-media-automations

Open source CLI that writes social media content with your local **Claude Code** and renders platform ready video and images with **FFmpeg**.

You give it a niche, a brief, or just a topic to research. Claude Code writes the hook, the on screen text, the timed subtitles, the caption and the hashtags. Then a template renders a vertical video (or a still card) sized for the platform you picked, with the text kept inside the safe area so it never lands under the platform UI.

[Türkçe README](README.tr.md)

## Why this exists

Most "AI content" tools want an API key and a paid plan. This one does not. It calls the `claude` command you already have, so it reuses your existing Claude Code session. No API key, no SDK, no extra account.

- Content generation through local Claude Code, three modes: viral discovery, a given brief, or research a topic on the web.
- FFmpeg rendering: 9:16 video for TikTok, Reels and Shorts, plus still cards for LinkedIn, X, Instagram and Facebook posts.
- Multiple selectable templates, all safe area aware.
- Text is drawn in Node and composited with FFmpeg's `overlay` filter, so it works even on minimal FFmpeg builds without libfreetype or libass. A free font (DejaVu Sans) is bundled.
- JSON or YAML config, batch generation, Turkish and English support.
- Writing rule baked in: no em-dash, plain human tone.

## Requirements

- Node.js 20.6 or newer.
- FFmpeg and FFprobe on your PATH ([download](https://ffmpeg.org/download.html)). A minimal build is fine, text rendering does not need libfreetype or libass.
- For the AI part: the [Claude Code](https://docs.claude.com/en/docs/claude-code) CLI (`claude`) installed and logged in. Everything also works without it using `--no-ai`.

## Install

```bash
git clone https://github.com/your-org/social-media-automations.git
cd social-media-automations
npm install
npm link        # optional, gives you the global "social-auto" command
```

Without `npm link` you can run it as `node bin/social-auto.js <command>`.

## Quick start

```bash
# 1. Build demo assets so the examples run without shipping any media.
social-auto init-demo

# 2. Render without AI (works with no claude CLI).
social-auto generate --platform youtube-shorts --template clean-caption --config examples/shorts.json --no-ai

# 3. Let Claude Code write a viral idea, then render it.
social-auto generate --platform tiktok --template bold-center --config examples/tiktok.json

# 4. Give a topic and let Claude research it.
social-auto generate --platform instagram-reels --template hook-subtitle --config examples/research.json

# 5. Just brainstorm ideas, no rendering.
social-auto ideate --platform tiktok --niche "fitness" --count 5 --lang en
```

## Content modes

The mode is picked from the `ai` block in your config.

| Mode | When | What Claude does |
| --- | --- | --- |
| viral | no `brief`, no `topic` | Picks a trending, high engagement idea for your niche and writes it. |
| brief | `brief` is set | Writes exactly to your brief. |
| research | `topic` plus `research: true` | Researches the topic on the web (WebSearch, WebFetch), then writes current, trend aware content. |

If there is no `ai` block, or you pass `--no-ai`, the tool uses the `title` and `subtitles` from the config directly. No `claude` needed.

## Config

A config is a JSON or YAML file. Asset paths are resolved relative to the config file.

```json
{
  "ai": {
    "niche": "software and developer humor",
    "brief": "the fear of deploying on a Friday",
    "topic": "2026 AI coding trends",
    "research": false,
    "language": "en",
    "tone": "playful, energetic",
    "model": "claude-opus-4-8"
  },
  "duration": 10,
  "input": { "video": "assets/clip.mp4", "background": "#101418" },
  "logo": { "path": "assets/logo.png", "position": "top-right", "scale": 0.15 },
  "music": { "path": "assets/music.mp3", "volume": 0.6 },
  "font": "assets/fonts/Inter-Bold.ttf",
  "output": "out/tiktok.mp4"
}
```

Notes:

- `input.video` is the background. If you omit it, `input.background` color is used through FFmpeg's lavfi source.
- With AI on, Claude fills the text. The caption and hashtags are written next to the video as `*.caption.txt`.
- Without AI, set `title` and `subtitles` (an array of `{ text, start, end }` or plain strings) yourself.
- A custom `font` (path to a `.ttf` or `.otf`) is optional. Without it, the bundled DejaVu Sans font is used.

## Templates

Run `social-auto list-templates` for the live list.

| Template | Kind | What it looks like |
| --- | --- | --- |
| hook-subtitle | video | Big hook line at the top, timed subtitles in the lower middle. |
| clean-caption | video | Minimal single caption at the bottom. |
| bold-center | video | One large centered statement, cover card style. |
| word-pop | video | Punchy centered captions with a karaoke feel. |
| image-card | image | Still card with a centered title for post platforms. |

## Platforms

Run `social-auto list-platforms` for the live list. Video: `tiktok`, `instagram-reels`, `youtube-shorts`. Image: `instagram-post`, `linkedin-post`, `x-post`, `facebook-post`. Each preset carries the recommended size, frame rate and a safe area so text stays clear of the platform UI.

## Commands

```bash
social-auto generate --platform <id> --template <name> --config <file> [-o out] [--lang tr|en] [--dry-run] [--no-ai] [--verbose]
social-auto generate --batch examples/batch.json
social-auto ideate --platform <id> [--niche "..."] [--topic "..." --research] [--count 5] [--lang tr|en]
social-auto list-templates
social-auto list-platforms
social-auto init-demo
```

`--dry-run` prints the FFmpeg command instead of running it. `--no-ai` skips Claude and uses the config text.

## How it works

```
config  ->  Claude Code (claude -p, JSON out)  ->  content package
                                                      |
                              caption sidecar  <------+
                                                      |
   platform preset + template.buildPlan  ->  text overlays (PNG, pureimage)
                                                      |
                       FFmpeg overlay + scale + crop  ->  spawn ffmpeg  ->  output
```

Each text block is wrapped, aligned inside the platform safe area and rasterized to a transparent PNG with [pureimage](https://github.com/PrincetonComputerImagingLab/pureimage) (pure JavaScript, no native build). FFmpeg then composites the PNGs over the scaled background with the `overlay` filter, which exists in every FFmpeg build. Timed captions use `overlay=...:enable='between(t,a,b)'`.

## Contributing

New platforms and templates are meant to be easy to add: one file plus one line in a registry. See [CONTRIBUTING.md](CONTRIBUTING.md) ([Türkçe](CONTRIBUTING.tr.md)).

## License

[MIT](LICENSE)
