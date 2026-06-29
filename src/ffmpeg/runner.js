// Thin wrapper around spawning ffmpeg. We build argument arrays elsewhere and
// run them here, capturing stderr so failures produce a useful message.

import { spawn, spawnSync } from 'node:child_process';
import { FFmpegError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function ffmpegAvailable() {
  const res = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return res.status === 0;
}

export function ensureFfmpeg() {
  if (!ffmpegAvailable()) {
    throw new FFmpegError(
      'FFmpeg was not found on PATH. Install FFmpeg to render output. See https://ffmpeg.org/download.html'
    );
  }
}

export function quoteCommand(args) {
  return ['ffmpeg', ...args]
    .map((a) => (/[\s'"|;&]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a))
    .join(' ');
}

export function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    logger.debug('ffmpeg', quoteCommand(args));
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      reject(new FFmpegError(`Failed to start ffmpeg: ${err.message}`, { cause: err }));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const tail = stderr.split('\n').filter(Boolean).slice(-8).join('\n');
        reject(
          new FFmpegError(`ffmpeg exited with code ${code}.\n${tail}`, {
            code: 'FFMPEG_NONZERO',
          })
        );
      }
    });
  });
}
