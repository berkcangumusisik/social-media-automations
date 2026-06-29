// Template registry. To add a template: create a file in this folder that
// default-exports an object matching the template contract, then register it
// here. The core does not need any other change. See CONTRIBUTING.md.

import hookSubtitle from './hook-subtitle.js';
import cleanCaption from './clean-caption.js';
import boldCenter from './bold-center.js';
import wordPop from './word-pop.js';
import imageCard from './image-card.js';
import { TemplateError } from '../utils/errors.js';

const TEMPLATES = [hookSubtitle, cleanCaption, boldCenter, wordPop, imageCard];

const registry = new Map();
for (const tpl of TEMPLATES) {
  registry.set(tpl.name, tpl);
}

export function listTemplates() {
  return [...registry.values()];
}

export function getTemplate(name) {
  const tpl = registry.get(name);
  if (!tpl) {
    throw new TemplateError(`Unknown template: ${name}`, { code: 'UNKNOWN_TEMPLATE' });
  }
  return tpl;
}

export function hasTemplate(name) {
  return registry.has(name);
}

export function assertSupports(tpl, platformId) {
  if (Array.isArray(tpl.supports) && !tpl.supports.includes(platformId)) {
    throw new TemplateError(
      `Template "${tpl.name}" does not support platform "${platformId}"`,
      { code: 'TEMPLATE_PLATFORM_MISMATCH' }
    );
  }
}
