// Compose layer: take a template's overlay description, rasterize each overlay to
// a PNG, and build the FFmpeg argument list that composites everything. Only the
// "overlay", "scale", "crop" and "color" filters are used, all of which exist in
// every FFmpeg build, so rendering does not depend on text filters.

import { renderOverlayPng, overlayPngPath } from './text.js';

function coverChain(preset) {
  const { width: w, height: h, fps } = preset;
  return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps},format=yuv420p`;
}

const LOGO_XY = {
  'top-left': (m) => `${m}:${m}`,
  'top-right': (m) => `main_w-overlay_w-${m}:${m}`,
  'bottom-left': (m) => `${m}:main_h-overlay_h-${m}`,
  'bottom-right': (m) => `main_w-overlay_w-${m}:main_h-overlay_h-${m}`,
};

function logoXY(position, margin) {
  return (LOGO_XY[position] || LOGO_XY['top-right'])(margin);
}

async function renderOverlays(ctx, overlays) {
  const { preset, config, workdir } = ctx;
  const fontPath = config.font || undefined;
  const paths = [];
  for (let i = 0; i < overlays.length; i++) {
    const outPath = overlayPngPath(workdir, `ov${i}`);
    await renderOverlayPng({
      width: preset.width,
      height: preset.height,
      blocks: overlays[i].blocks,
      fontPath,
      outPath,
    });
    paths.push(outPath);
  }
  return paths;
}

export async function composeVideo(ctx, overlays) {
  const { preset, config, duration, outputPath } = ctx;
  const w = preset.width;
  const pngs = await renderOverlays(ctx, overlays);

  const args = ['-y', '-hide_banner', '-loglevel', 'error'];

  // Input 0: background.
  if (config.input?.video) {
    args.push('-i', config.input.video);
  } else {
    const bg = config.input?.background || preset.theme?.cardBg || '#101418';
    args.push('-f', 'lavfi', '-i', `color=c=${bg}:s=${w}x${preset.height}:d=${duration}:r=${preset.fps}`);
  }

  // Overlay PNG inputs.
  pngs.forEach((p) => args.push('-i', p));

  let musicIndex = -1;
  let logoIndex = -1;
  let next = 1 + pngs.length;
  if (config.music?.path) {
    args.push('-i', config.music.path);
    musicIndex = next++;
  }
  if (config.logo?.path) {
    args.push('-i', config.logo.path);
    logoIndex = next++;
  }

  const chain = [`[0:v]${coverChain(preset)}[base]`];
  let prev = 'base';
  overlays.forEach((ov, i) => {
    const out = `vo${i}`;
    const enable = `:enable='between(t,${ov.start},${ov.end})'`;
    chain.push(`[${prev}][${1 + i}:v]overlay=0:0${enable}[${out}]`);
    prev = out;
  });
  if (logoIndex !== -1) {
    const logoW = Math.round(w * (config.logo.scale || 0.15));
    const margin = Math.round(w * 0.04);
    chain.push(`[${logoIndex}:v]scale=${logoW}:-1[lg]`);
    chain.push(`[${prev}][lg]overlay=${logoXY(config.logo.position, margin)}[vl]`);
    prev = 'vl';
  }
  chain.push(`[${prev}]null[v]`);

  let audioLabel = null;
  if (musicIndex !== -1) {
    const vol = config.music.volume ?? 1;
    chain.push(`[${musicIndex}:a]volume=${vol}[a]`);
    audioLabel = '[a]';
  }

  args.push('-filter_complex', chain.join(';'));
  args.push('-map', '[v]');
  args.push('-map', audioLabel || '0:a?');
  args.push('-r', String(preset.fps), '-t', String(duration));
  args.push('-c:v', preset.vcodec, '-b:v', preset.vbitrate, '-pix_fmt', 'yuv420p');
  args.push('-c:a', 'aac', '-b:a', '192k');
  args.push('-movflags', '+faststart', '-shortest', outputPath);
  return args;
}

export async function composeImage(ctx, overlays) {
  const { preset, config, outputPath, workdir } = ctx;
  const w = preset.width;
  const h = preset.height;

  // Flatten all overlay blocks onto a single still PNG.
  const blocks = overlays.flatMap((o) => o.blocks);
  const png = overlayPngPath(workdir, 'card');
  await renderOverlayPng({ width: w, height: h, blocks, fontPath: config.font || undefined, outPath: png });

  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  if (config.input?.image) {
    args.push('-loop', '1', '-t', '1', '-i', config.input.image);
  } else {
    const bg = config.input?.background || preset.theme?.cardBg || '#101418';
    args.push('-f', 'lavfi', '-i', `color=c=${bg}:s=${w}x${h}:d=1:r=1`);
  }
  args.push('-i', png);

  let logoIndex = -1;
  if (config.logo?.path) {
    args.push('-i', config.logo.path);
    logoIndex = 2;
  }

  const chain = [`[0:v]${coverChain(preset)}[base]`, `[base][1:v]overlay=0:0[card]`];
  let prev = 'card';
  if (logoIndex !== -1) {
    const logoW = Math.round(w * (config.logo.scale || 0.15));
    const margin = Math.round(w * 0.05);
    chain.push(`[${logoIndex}:v]scale=${logoW}:-1[lg]`);
    chain.push(`[${prev}][lg]overlay=main_w-overlay_w-${margin}:${margin}[vl]`);
    prev = 'vl';
  }
  chain.push(`[${prev}]null[v]`);

  args.push('-filter_complex', chain.join(';'));
  args.push('-map', '[v]', '-frames:v', '1', '-q:v', '2', outputPath);
  return args;
}

export async function compose(ctx, plan) {
  if (plan.kind === 'image') return composeImage(ctx, plan.overlays);
  return composeVideo(ctx, plan.overlays);
}
