// ffprobe helpers, used by tests and verification to confirm output dimensions
// and duration.

import { spawnSync } from 'node:child_process';

export function ffprobeAvailable() {
  const res = spawnSync('ffprobe', ['-version'], { encoding: 'utf8' });
  return res.status === 0;
}

export function probe(path) {
  const res = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height:format=duration',
      '-of',
      'json',
      path,
    ],
    { encoding: 'utf8' }
  );
  if (res.status !== 0) return null;
  try {
    const data = JSON.parse(res.stdout);
    const stream = data.streams?.[0] || {};
    return {
      width: stream.width,
      height: stream.height,
      duration: data.format?.duration ? Number(data.format.duration) : null,
    };
  } catch {
    return null;
  }
}
