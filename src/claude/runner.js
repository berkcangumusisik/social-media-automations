// Calls the local Claude Code CLI (`claude`) in headless print mode. No API key
// and no SDK: this reuses whatever Claude Code session the user already has.
//
//   claude -p "<prompt>" --output-format json [--model <id>] [--allowedTools ...]
//
// The outer JSON envelope carries a `.result` string with the model's answer,
// from which we extract the JSON content package.

import { spawn, spawnSync } from 'node:child_process';
import { ClaudeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function claudeAvailable() {
  const res = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  return res.status === 0;
}

export function ensureClaude(t) {
  if (!claudeAvailable()) {
    throw new ClaudeError(
      t
        ? t('error.noClaude')
        : 'Claude Code CLI ("claude") was not found on PATH. Install it, or run with --no-ai.'
    );
  }
}

// Pull a JSON value out of a possibly-fenced, possibly-chatty string.
export function extractJson(text) {
  if (typeof text !== 'string') return null;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();

  // Try the whole thing first.
  try {
    return JSON.parse(s);
  } catch {
    // Fall through to substring search.
  }
  const starts = [s.indexOf('{'), s.indexOf('[')].filter((i) => i >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  const open = s[start];
  const close = open === '{' ? '}' : ']';
  const end = s.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

function runClaudeRaw(prompt, { model, allowTools = [], timeoutMs = 180000 } = {}) {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt, '--output-format', 'json'];
    if (model) args.push('--model', model);
    if (allowTools.length) args.push('--allowedTools', ...allowTools);

    // This tool is meant to use the logged-in Claude Code session, not an API
    // key. A stale or invalid ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN in the
    // environment would override that session and cause a 401. Remove them from
    // the child environment so `claude` falls back to its own credentials.
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.ANTHROPIC_AUTH_TOKEN;

    logger.debug('claude', args.filter((a) => a !== prompt).join(' '), '(+prompt)');
    const child = spawn('claude', args, { stdio: ['ignore', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new ClaudeError(`Claude Code timed out after ${Math.round(timeoutMs / 1000)}s.`));
    }, timeoutMs);

    child.stdout.on('data', (c) => (stdout += c.toString()));
    child.stderr.on('data', (c) => (stderr += c.toString()));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new ClaudeError(`Failed to start claude: ${err.message}`, { cause: err }));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

// Returns the parsed JSON value (object or array) produced by Claude.
export async function callClaudeJson(prompt, opts = {}) {
  const { code, stdout, stderr } = await runClaudeRaw(prompt, opts);

  // The envelope is JSON; the answer lives in `.result`.
  const envelope = extractJson(stdout);

  // Surface Claude Code's own errors (auth, refusal, tool denial) clearly.
  if (envelope && typeof envelope === 'object' && envelope.type === 'result') {
    if (envelope.is_error || (envelope.subtype && envelope.subtype !== 'success')) {
      const detail = envelope.result || envelope.subtype || `status ${envelope.api_error_status || code}`;
      let hint = '';
      if (/401|authenticat/i.test(String(detail)) || envelope.api_error_status === 401) {
        hint =
          '\nHint: this is a Claude Code login problem, not a bug in this tool. ' +
          'Make sure "claude" is logged in (run "claude" once interactively, or "claude login"). ' +
          'If you set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN in your shell, unset them. ' +
          'Also run from a normal terminal, not from inside another Claude Code session.';
      }
      throw new ClaudeError(`Claude Code reported an error: ${detail}${hint}`);
    }
  }

  if (code !== 0 && !envelope) {
    const tail = stderr.split('\n').filter(Boolean).slice(-6).join('\n');
    throw new ClaudeError(`Claude Code exited with code ${code}.\n${tail}`.trim());
  }

  const answerText =
    envelope && typeof envelope.result === 'string' ? envelope.result : stdout;

  const value = extractJson(answerText);
  if (value == null) {
    throw new ClaudeError('Could not parse JSON content from Claude Code output.');
  }
  return value;
}
