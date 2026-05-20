# AGENTS.md

## Project Overview

Immersive Translate is a Firefox extension for in-page translation. It's built with Vite, React, and TypeScript. When
text is selected on a page, a translation bubble appears, calling a configured translation service via a background
script.

## Common Commands

- **Run development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Run tests**: `npm test`
- **Type-check**: `npm run typecheck`
- **Format code**: `npm run format`

## Architecture

The project is structured as a standard web extension:

- `src/background/`: Background scripts and translation service implementations. This is where the logic for calling
  services like Google Translate, Youdao, and OpenAI-compatible models resides.
- `src/content/`: Content scripts that are injected into web pages. This handles detecting text selection and displaying
  the translation bubble.
- `src/options/`: The extension's options page, built with React. This is where users configure API keys, languages, and
  service preferences.
- `src/shared/`: Shared code, including TypeScript types, messaging protocols between scripts, and storage management.
- `src/manifest.json`: The WebExtension manifest file, defining permissions, scripts, and other extension properties.

`vite-plugin-web-extension` is used to bundle the extension for development and production.
