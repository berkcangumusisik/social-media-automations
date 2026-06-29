// Prompt builders for the local Claude Code CLI. These are plain strings passed
// to `claude -p`. The writing rules (no em-dash, human tone) and the strict
// JSON-only output contract live here.

const WRITING_RULES = [
  'Writing rules (strict):',
  '- Never use an em-dash (—) or en-dash (–). Use commas, periods, parentheses or a normal hyphen (-).',
  '- Write like a real person. Plain, direct, specific. No corporate filler.',
  '- Avoid AI cliches such as "in today\'s fast-paced world", "unlock", "elevate", "dive in", "game-changer", "boost your".',
  '- Do not start every sentence the same way. Vary rhythm. Short sentences are good.',
];

const LANG_NAME = { tr: 'Turkish', en: 'English' };

function langLine(language) {
  const lang = LANG_NAME[language] || 'English';
  return `Write all text fields in ${lang}.`;
}

const PACKAGE_SHAPE = `Return ONLY one JSON object (no markdown, no code fences, no commentary) with this shape:
{
  "idea": "one line summary of the concept",
  "hook": "the first on-screen line, short and scroll-stopping",
  "title": "headline shown on screen",
  "onScreenText": "optional short extra on-screen text",
  "subtitles": [ { "text": "a short caption line, max ~8 words", "start": 0, "end": 2.5 } ],
  "caption": "the platform caption or description",
  "hashtags": ["#tag1", "#tag2"],
  "musicMood": "suggested music feel, for example upbeat lo-fi",
  "cta": "a short call to action"
}`;

function subtitlesNote(duration) {
  if (!duration || duration <= 0) return 'Provide 3 to 6 subtitle lines.';
  return `Provide 3 to 6 subtitle lines whose start and end times (in seconds) fit inside a ${duration} second video and cover it from 0 to about ${duration}.`;
}

function modeInstruction(mode, ai) {
  if (mode === 'research') {
    const subject = ai.topic || ai.brief || ai.niche;
    return [
      `Research this topic before writing: "${subject}".`,
      'Use your web tools (web search and web fetch) to find what is current and trending right now, real numbers, fresh angles and recent examples.',
      'Then turn the most engaging finding into the content. Ground the hook and caption in something specific you found.',
    ].join('\n');
  }
  if (mode === 'brief') {
    return `Create the content for this brief: "${ai.brief}".`;
  }
  return [
    'No specific brief was given.',
    `Pick a single high-engagement, on-trend idea for this niche${ai.niche ? `: "${ai.niche}"` : ''} and create the content for it.`,
    'Choose an idea that would realistically perform well today.',
  ].join('\n');
}

export function buildContentPrompt({ platform, mode, ai = {}, duration }) {
  const language = (ai.language || 'en').toLowerCase();
  const tone = ai.tone ? `Tone: ${ai.tone}.` : '';
  return [
    `You are a short-form social media content creator producing a piece for ${platform.label}.`,
    modeInstruction(mode, ai),
    langLine(language),
    tone,
    subtitlesNote(duration),
    ...WRITING_RULES,
    PACKAGE_SHAPE,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildIdeatePrompt({ platform, count = 5, ai = {}, mode }) {
  const language = (ai.language || 'en').toLowerCase();
  const tone = ai.tone ? `Tone: ${ai.tone}.` : '';
  return [
    `You are a short-form social media strategist. Propose ${count} distinct content ideas for ${platform.label}.`,
    modeInstruction(mode, ai),
    langLine(language),
    tone,
    ...WRITING_RULES,
    `Return ONLY a JSON array of ${count} objects (no markdown, no code fences). Each object:
{ "idea": "one line concept", "hook": "the opening on-screen line", "caption": "platform caption", "hashtags": ["#tag1"] }`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export const _internal = { WRITING_RULES, PACKAGE_SHAPE };
