# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository is a React/TypeScript wrapper around [@snf/qa-bot-core](https://github.com/necyberteam/qa-bot-core) that adds ACCESS-specific functionality. The project provides:
1. A React component library (ESM/UMD formats)
2. A standalone JavaScript bundle (IIFE with Preact)
3. TypeScript definitions

## Related Repositories

| Alias | Description |
|-------|-------------|
| **access-ci-ui** | UI component library for ACCESS websites - consumes qa-bot, will eventually consume this repo |
| **qa-bot** (old) | Legacy qa-bot being replaced by this repo + qa-bot-core |
| **qa-bot-core** (core) | Generic chatbot component library that this repo wraps |

**Local paths (may vary by developer):**
On this machine, all repos are peers in `access-ci/`:
- `../access-ci-ui`
- `../qa-bot`
- `../qa-bot-core`

**Relationship:** `access-ci-ui` → `access-qa-bot` (this repo) → `qa-bot-core`

## Build System

**Technology Stack:**
- Vite (build tool)
- React 18 + TypeScript
- Preact (for standalone bundle size optimization)

**Build Commands:**
```bash
npm run build          # Build all outputs (lib + standalone)
npm run build:lib      # ESM + UMD only
npm run build:standalone # Standalone bundle only
npm run dev            # Development server
npm run type-check     # TypeScript validation
```

**Build Outputs:**
- `dist/access-qa-bot.js` - ESM (738KB, externalizes React)
- `dist/access-qa-bot.umd.cjs` - CommonJS/UMD (567KB, externalizes React)
- `dist/access-qa-bot.standalone.js` - IIFE (349KB, bundles Preact)
- `dist/index.d.ts` - TypeScript definitions

## Architecture

### Component Hierarchy
```
AccessQABot (wrapper)
  └── QABot (from @snf/qa-bot-core)
      └── react-chatbotify integration
```

### Key Files
- `src/components/AccessQABot.tsx` - Main wrapper component
- `src/components/ThumbsUpThumbsDown.tsx` - Feedback component
- `src/lib.tsx` - React component exports
- `src/standalone.tsx` - Standalone JavaScript API
- `src/config/constants.ts` - Environment variables and defaults
- `src/utils/api.ts` - Q&A and rating API calls
- `src/utils/session.ts` - Session ID management (localStorage)

### API Compatibility Layer

**Public API (access-ci-ui compatible):**
- Accepts `isLoggedIn` prop
- Accepts `userEmail`, `userName`, `accessId` (not yet used, for future flows)
- Provides `addMessage()` via ref
- Supports both `open`/`onOpenChange` controlled mode and `defaultOpen` uncontrolled mode

**Internal Translation:**
- Currently maps `isLoggedIn` → `enabled` when calling qa-bot-core
- TODO: Once qa-bot-core adds `isLoggedIn` prop, use it directly

## Environment Configuration

Environment variables use `VITE_` prefix (not `REACT_APP_`):

```env
VITE_API_ENDPOINT=https://access-ai-grace1-external.ccs.uky.edu/access/chat/api/
VITE_RATING_ENDPOINT=https://access-ai-grace1-external.ccs.uky.edu/access/chat/rating/
VITE_NETLIFY_BASE_URL=https://access-jsm-api.netlify.app
VITE_API_KEY=demo-key
```

Copy `.env.example` to `.env.local` for local development.

## Current Implementation Status

**Implemented:**
- ✅ Basic wrapper with API compatibility
- ✅ Q&A flow with ACCESS APIs
- ✅ ThumbsUpThumbsDown feedback component
- ✅ Session ID persistence
- ✅ Three build outputs (ESM, UMD, Standalone)
- ✅ TypeScript definitions
- ✅ Standalone qaBot() function

**Not Yet Implemented (Future):**
- ❌ Ticket creation flows (General, ACCESS Login, Resource Login)
- ❌ Security incident reporting
- ❌ Metrics/XDMoD integration
- ❌ File attachment support
- ❌ User context integration (userEmail, userName, accessId props accepted but not used)

## Development Notes

- **Vite Configuration:** Two configs exist - `vite.config.ts` (lib) and `vite.config.standalone.ts` (standalone)
- **emptyOutDir:** Set to `false` in standalone config to preserve lib outputs
- **Type Definitions:** Manual declarations in `src/types/qa-bot-core.d.ts` until upstream provides them
- **Preact Aliasing:** Standalone build replaces React with Preact via Vite resolve aliases
- **Session Management:** Uses localStorage with key `access-qa-bot-session-id`

## Known Issues

- qa-bot-core currently only has `enabled` prop, not `isLoggedIn` (proposal submitted to add it)
- userEmail, userName, accessId props are accepted but not yet integrated into flows
- TypeScript version mismatch warning (project uses 5.9.3, API Extractor uses 5.4.2)
