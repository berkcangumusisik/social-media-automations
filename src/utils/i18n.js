// Minimal i18n for CLI messages. Two languages: English (default) and Turkish.
// Resolution order: explicit argument, SOCIAL_AUTO_LANG env, then 'en'.

const MESSAGES = {
  en: {
    'platforms.title': 'Available platforms',
    'templates.title': 'Available templates',
    'generate.start': 'Generating content for {platform} with template {template}',
    'generate.aiSkip': 'AI step skipped (--no-ai). Using text from config.',
    'generate.aiMode': 'Content mode: {mode}',
    'generate.claudeStart': 'Asking Claude Code to write the content...',
    'generate.rendering': 'Rendering with FFmpeg...',
    'generate.done': 'Done. Output: {path}',
    'generate.caption': 'Caption saved: {path}',
    'generate.dryRun': 'Dry run, FFmpeg command not executed:',
    'ideate.start': 'Generating {count} ideas for {platform}...',
    'ideate.done': 'Done.',
    'initDemo.start': 'Building demo assets with FFmpeg (lavfi)...',
    'initDemo.done': 'Demo assets ready in {dir}',
    'error.noClaude':
      'Claude Code CLI ("claude") was not found on PATH. Install it, or run with --no-ai to use text from the config.',
    'error.configMissing': 'Config file is required. Use --config <file> or --batch <file>.',
    'error.unknownPlatform': 'Unknown platform: {id}. Run "list-platforms" to see options.',
    'error.unknownTemplate': 'Unknown template: {id}. Run "list-templates" to see options.',
    'error.templatePlatform': 'Template "{template}" does not support platform "{platform}".',
    'error.noText':
      'No content to render. Add an "ai" block to the config, or provide "title"/"subtitles", or drop --no-ai.',
  },
  tr: {
    'platforms.title': 'Mevcut platformlar',
    'templates.title': 'Mevcut şablonlar',
    'generate.start': '{platform} için {template} şablonuyla içerik üretiliyor',
    'generate.aiSkip': 'AI adımı atlandı (--no-ai). Config içindeki metin kullanılıyor.',
    'generate.aiMode': 'İçerik modu: {mode}',
    'generate.claudeStart': 'İçeriği yazması için Claude Code çağrılıyor...',
    'generate.rendering': 'FFmpeg ile render ediliyor...',
    'generate.done': 'Tamam. Çıktı: {path}',
    'generate.caption': 'Açıklama kaydedildi: {path}',
    'generate.dryRun': 'Deneme çalıştırma, FFmpeg komutu çalıştırılmadı:',
    'ideate.start': '{platform} için {count} fikir üretiliyor...',
    'ideate.done': 'Tamam.',
    'initDemo.start': 'FFmpeg (lavfi) ile demo dosyaları oluşturuluyor...',
    'initDemo.done': 'Demo dosyaları hazır: {dir}',
    'error.noClaude':
      'Claude Code CLI ("claude") PATH üzerinde bulunamadı. Kurun ya da config metnini kullanmak için --no-ai ile çalıştırın.',
    'error.configMissing': 'Config dosyası gerekli. --config <dosya> ya da --batch <dosya> kullanın.',
    'error.unknownPlatform': 'Bilinmeyen platform: {id}. Seçenekler için "list-platforms" çalıştırın.',
    'error.unknownTemplate': 'Bilinmeyen şablon: {id}. Seçenekler için "list-templates" çalıştırın.',
    'error.templatePlatform': '"{template}" şablonu "{platform}" platformunu desteklemiyor.',
    'error.noText':
      'Render edilecek içerik yok. Config\'e "ai" bloğu ekleyin, ya da "title"/"subtitles" verin, ya da --no-ai kaldırın.',
  },
};

export function resolveLang(explicit) {
  const lang = (explicit || process.env.SOCIAL_AUTO_LANG || 'en').toLowerCase();
  return MESSAGES[lang] ? lang : 'en';
}

export function createTranslator(lang) {
  const resolved = resolveLang(lang);
  const table = MESSAGES[resolved];
  return function t(key, vars = {}) {
    let text = table[key] ?? MESSAGES.en[key] ?? key;
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  };
}

export const SUPPORTED_LANGS = Object.keys(MESSAGES);
