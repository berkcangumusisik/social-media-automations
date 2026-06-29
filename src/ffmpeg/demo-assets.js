// Build synthetic demo assets with FFmpeg's lavfi sources so the examples run out
// of the box without shipping any binary media. Produces a short background clip,
// a tone track and a sample SRT under examples/assets.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFfmpeg, ensureFfmpeg } from './runner.js';

export async function buildDemoAssets(dir) {
  ensureFfmpeg();
  mkdirSync(dir, { recursive: true });

  const clip = join(dir, 'demo-clip.mp4');
  const music = join(dir, 'demo-music.m4a');
  const srt = join(dir, 'demo.srt');

  // A 6 second 1080x1920 animated gradient with a moving box, so the cover and
  // overlay logic has something visible to work with.
  await runFfmpeg([
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'gradients=s=1080x1920:d=6:speed=0.05',
    '-vf',
    'format=yuv420p',
    '-t',
    '6',
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    clip,
  ]);

  // A soft sine tone as placeholder music.
  await runFfmpeg([
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=220:duration=6',
    '-af',
    'volume=0.3',
    '-c:a',
    'aac',
    music,
  ]);

  writeFileSync(
    srt,
    [
      '1',
      '00:00:00,000 --> 00:00:02,000',
      'Bu bir demo altyazıdır',
      '',
      '2',
      '00:00:02,000 --> 00:00:04,000',
      'Kendi metninizi config ile verin',
      '',
      '3',
      '00:00:04,000 --> 00:00:06,000',
      'Ya da Claude Code üretsin',
      '',
    ].join('\n'),
    'utf8'
  );

  return { clip, music, srt, dir };
}
