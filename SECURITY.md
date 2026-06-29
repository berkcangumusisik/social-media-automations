# Security Policy

## Supported versions

This project is pre 1.0. Security fixes land on the latest `main` and the most recent release.

| Version | Supported |
| --- | --- |
| 0.1.x | yes |

## Reporting a vulnerability

Please do not open a public issue for a security problem. Instead:

1. Use GitHub's private vulnerability reporting (Security tab, "Report a vulnerability") on this repository, or
2. Contact the maintainers through the repository's listed contact channel.

Include what you found, how to reproduce it, and the impact you expect. We will acknowledge the report, work on a fix, and credit you if you would like.

## Scope and good practices

This tool runs two external programs on your machine: `ffmpeg` and the `claude` CLI. A few things to keep in mind:

- **Configs are local files.** Do not put API keys, tokens, or passwords inside a config. They are not needed. The tool uses your logged-in Claude Code session, not an API key.
- **Untrusted configs.** Treat config and batch files from other people the same way you would treat a script. They point at file paths and pass text to FFmpeg and to Claude. Review them before running.
- **Research mode** lets Claude use web tools (WebSearch, WebFetch) through your Claude Code session. It reads the open web. Use it on topics you are comfortable querying.
- **Output files** (videos, caption sidecars) are written to the path in your config. Make sure that path is somewhere you intend to write.

If you find a way to make the tool write outside the intended output path, run an unintended command, or leak a credential, that is in scope and we want to hear about it.
