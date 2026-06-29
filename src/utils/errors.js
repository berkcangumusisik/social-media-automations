// Typed errors so the CLI can report clean messages and exit codes.

export class AppError extends Error {
  constructor(message, { code = 'APP_ERROR', exitCode = 1, cause } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.exitCode = exitCode;
    if (cause) this.cause = cause;
  }
}

export class ConfigError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'CONFIG_ERROR', exitCode: 2, ...opts });
    this.name = 'ConfigError';
  }
}

export class TemplateError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'TEMPLATE_ERROR', exitCode: 3, ...opts });
    this.name = 'TemplateError';
  }
}

export class PlatformError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'PLATFORM_ERROR', exitCode: 4, ...opts });
    this.name = 'PlatformError';
  }
}

export class FFmpegError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'FFMPEG_ERROR', exitCode: 5, ...opts });
    this.name = 'FFmpegError';
  }
}

export class ClaudeError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'CLAUDE_ERROR', exitCode: 6, ...opts });
    this.name = 'ClaudeError';
  }
}
