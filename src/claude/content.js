// Orchestrates content generation through Claude Code: detect mode, build the
// prompt, call the CLI (allowing web tools in research mode), parse and normalize.

import { contentMode } from '../config/validate.js';
import { buildContentPrompt, buildIdeatePrompt } from './prompts.js';
import { callClaudeJson, ensureClaude } from './runner.js';
import { normalizeContentPackage, stripDashes } from './schema.js';
import { ClaudeError } from '../utils/errors.js';

const RESEARCH_TOOLS = ['WebSearch', 'WebFetch'];

export async function generateContent({ platform, config, t }) {
  ensureClaude(t);
  const ai = config.ai || {};
  const mode = contentMode(config);
  const prompt = buildContentPrompt({
    platform,
    mode,
    ai,
    duration: config.duration,
  });
  const opts = { model: ai.model };
  if (mode === 'research') opts.allowTools = RESEARCH_TOOLS;

  const value = await callClaudeJson(prompt, opts);
  const pkg = Array.isArray(value) ? value[0] : value;
  return { mode, content: normalizeContentPackage(pkg) };
}

export async function generateIdeas({ platform, ai = {}, count = 5, research = false, t }) {
  ensureClaude(t);
  const mode = research ? 'research' : ai.brief ? 'brief' : 'viral';
  const prompt = buildIdeatePrompt({ platform, count, ai, mode });
  const opts = { model: ai.model };
  if (mode === 'research') opts.allowTools = RESEARCH_TOOLS;

  const value = await callClaudeJson(prompt, opts);
  const arr = Array.isArray(value) ? value : value.ideas || [value];
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new ClaudeError('Claude did not return any ideas.');
  }
  return arr.map((idea) => ({
    idea: stripDashes(idea.idea || ''),
    hook: stripDashes(idea.hook || ''),
    caption: stripDashes(idea.caption || ''),
    hashtags: Array.isArray(idea.hashtags) ? idea.hashtags.map((h) => stripDashes(String(h))) : [],
  }));
}
