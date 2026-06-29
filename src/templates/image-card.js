// image-card: a single still card for post platforms (LinkedIn, X, Facebook,
// Instagram feed). Centered title with an optional caption line below, kept
// inside the safe area.

import { centerBand, bottomBand, fontPx, staticOverlay } from './_helpers.js';

export default {
  name: 'image-card',
  description: 'Single still card with a centered title for post platforms.',
  kind: 'image',
  supports: ['instagram-post', 'linkedin-post', 'x-post', 'facebook-post'],

  buildPlan(ctx) {
    const { preset, content } = ctx;
    const overlays = [];

    const title = content.title || content.hook || content.onScreenText || '';
    if (title) {
      overlays.push(
        staticOverlay(
          { ...centerBand(preset), text: title, fontPx: fontPx(preset, 0.06), align: 'center', valign: 'middle' },
          1
        )
      );
    }

    const sub = content.caption || content.cta || '';
    if (sub) {
      overlays.push(
        staticOverlay(
          {
            ...bottomBand(preset),
            text: String(sub).split('\n')[0],
            fontPx: fontPx(preset, 0.032),
            align: 'center',
            valign: 'bottom',
            outline: true,
          },
          1
        )
      );
    }

    return { kind: 'image', overlays };
  },
};
