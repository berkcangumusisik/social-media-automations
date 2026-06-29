# Contributing

Thanks for helping out. This project is built to be extended. Adding a platform or a template should be a small, self contained change.

[Türkçe](CONTRIBUTING.tr.md)

## Ground rules

- **No em-dash.** Never use an em-dash (—) or en-dash (–) in code, comments, docs, prompts or example captions. Use commas, periods, parentheses or a normal hyphen. Write in a plain, human voice and avoid AI cliches. This applies to the content prompts in `src/claude/prompts.js` too.
- Keep dependencies minimal. The runtime deps are `commander`, `yaml` and `pureimage`. Discuss before adding more.
- Match the surrounding style. Two space indent, ESM modules, small focused files.
- Add or update tests for any behavior change. Tests must not call `ffmpeg` or `claude`.

## Setup

```bash
npm install
npm test
node bin/social-auto.js init-demo
node bin/social-auto.js generate -p youtube-shorts -t clean-caption -c examples/shorts.json --no-ai
```

## Project layout

```
src/
  platforms/   platform presets and registry
  templates/   templates plus shared helpers
  claude/      Claude Code integration (prompts, runner, schema)
  render/      text rasterization (pureimage) and FFmpeg compose
  ffmpeg/      ffmpeg/ffprobe runner, demo assets
  core/        generate and batch orchestration
  config/      load and validate config
  utils/       logger, errors, i18n
```

## Add a platform

1. Open `src/platforms/presets.js` and append an object to `PRESETS`:

```js
{
  id: 'my-platform',          // unique, kebab-case
  label: 'My Platform',
  kind: 'video',              // 'video' or 'image'
  width: 1080, height: 1920,
  fps: 30,
  maxDuration: 60,            // seconds, 0 for images
  container: 'mp4',           // output extension
  vcodec: 'libx264', acodec: 'aac', vbitrate: '8M',
  safeArea: { top: 0.06, bottom: 0.2, left: 0.05, right: 0.12 }
}
```

`safeArea` values are fractions of the frame to keep clear of platform UI. That is it. The registry and CLI pick it up automatically.

2. Add an assertion in `test/platforms.test.js` if it is a notable platform.

## Add a template

A template is a file in `src/templates/` that default exports an object:

```js
export default {
  name: 'my-template',
  description: 'One line describing the look.',
  kind: 'video',                                  // 'video' or 'image'
  supports: ['tiktok', 'instagram-reels'],        // platform ids
  buildPlan(ctx) {
    // ctx: { preset, content, config, duration, outputPath, workdir }
    // Return overlays. Each overlay is shown between start and end seconds and
    // holds one or more text blocks placed in pixel regions.
    return {
      kind: 'video',
      overlays: [
        {
          start: 0,
          end: ctx.duration,
          blocks: [
            {
              text: ctx.content.title,
              x: 50, y: 80, w: 980, h: 400,        // pixel region inside the frame
              fontPx: 90,
              color: '#FFFFFF',                     // optional
              align: 'center',                      // 'center' or 'left'
              valign: 'top',                        // 'top' | 'middle' | 'bottom'
              outline: true                         // optional
            }
          ]
        }
      ]
    };
  }
};
```

Use the helpers in `src/templates/_helpers.js` (`topBand`, `bottomBand`, `centerBand`, `fontPx`, `staticOverlay`, `cueOverlays`, `toCues`) so your text lands inside the safe area.

Then register it in `src/templates/index.js`:

```js
import myTemplate from './my-template.js';
const TEMPLATES = [/* ... */, myTemplate];
```

The render layer turns your overlays into PNGs and composites them with FFmpeg. You do not write FFmpeg arguments by hand.

Add a case to `test/templates.test.js` so it is covered.

## The content package

When AI is on, Claude returns a content package that templates read through `ctx.content`:

```
{ idea, hook, title, onScreenText, subtitles: [{ text, start, end }], caption, hashtags, musicMood, cta }
```

It is normalized in `src/claude/schema.js` (which also strips any stray dashes). If you change the shape, update the schema, the prompt in `src/claude/prompts.js`, and the tests together.

## Pull requests

- Run `npm test` and confirm it is green.
- Keep the change focused. One platform or one template per PR is ideal.
- Describe what you changed and why. Screenshots of rendered output are welcome.

By contributing you agree your work is released under the [MIT License](LICENSE).
