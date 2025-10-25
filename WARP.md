# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**FixMyPrompts.com** is a mobile-first React SPA that improves AI prompts using the Gemini Flash API. The project has two main components:
1. **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn-ui
2. **Backend**: Cloudflare Workers with Durable Objects for feedback storage and analytics
3. **Chrome Extension**: Browser extension that integrates with ChatGPT, Claude, and Gemini

The system uses category-specific prompt engineering rules to transform rough prompts into clear, effective ones.

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm i

# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

### Backend (Cloudflare Worker) Deployment
```bash
# Deploy worker to Cloudflare
wrangler deploy

# Set required secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put EXTENSION_TOKEN  # Optional, for Chrome extension auth

# Test worker locally (if supported)
wrangler dev
```

## Architecture & Key Concepts

### Frontend Architecture

**Entry Point**: `src/main.tsx` → `src/App.tsx`

**Routing Structure**:
- Uses `react-router-dom` with client-side routing
- Routes defined in `App.tsx`: `/`, `/privacy-policy`, `/contact`, `/blog`, and catch-all `*` (404)
- **IMPORTANT**: Add all new routes ABOVE the catch-all `*` route

**Page Components** (`src/pages/`):
- `Index.tsx` - Main prompt improvement interface
- `PrivacyPolicy.tsx`, `Contact.tsx`, `Blog.tsx` - Static pages
- `NotFound.tsx` - 404 page

**Component Organization**:
- `src/components/ui/` - shadcn-ui components (accordion, button, card, dialog, etc.)
- `src/components/TrustIndicator.tsx` - Trust badge component
- `src/components/CloudflareWorker.ts` - Mock worker code and category instructions (for reference)

**State Management**:
- React Query (`@tanstack/react-query`) for async state
- Local React state with hooks
- Toast notifications via `sonner` and custom toast hook

**Styling**:
- Tailwind CSS with custom theme
- Path alias: `@/` maps to `./src/`
- Mobile-first responsive design

### Backend Architecture (Cloudflare Worker)

**Entry Point**: `public/api/improve-prompt.js` (configured in `wrangler.toml`)

**Endpoints**:
1. **`POST /improve`** - Website endpoint for prompt improvement
2. **`POST /api/rewrite`** - Chrome extension endpoint with rate limiting (5 req/min)
3. **`POST /feedback`** - Submit feedback (like/dislike)
4. **`GET /feedback`** - Retrieve feedback statistics

**Core Logic Flow**:
1. Request validation (max 8000 chars for extension, category validation)
2. Optional authentication via `EXTENSION_TOKEN` Bearer token
3. Rate limiting (in-memory map, resets on worker cold start)
4. Prompt rules loaded from `public/api/promptRules.js`
5. Gemini API call with JSON response format (`response_mime_type: "application/json"`)
6. JSON extraction from Gemini response (handles code blocks)
7. Validation and response

**Prompt Engineering System** (`public/api/promptRules.js`):
- `baseInstructions` - Core prompt engineering guidelines
- `categoryInstructions` - Category-specific rules for 5 categories:
  - General, Creative Writing, Research, Problem Solving, Image Generation
- **Output format**: Gemini must return `{"improvedPrompt": "..."}`
- **Character limit**: 500 chars max for improved prompts

**Durable Objects**:
- `PromptsFeedback` - Stores likes/dislikes in SQLite
- Uses global ID: `env.PROMPTS_FEEDBACK.idFromName('global')`
- Storage schema: `{likes: number, dislikes: number}`

**KV Storage**:
- `PROMPT_STATS_KV` - Daily stats tracking for extension usage
- Key format: `statsExtension:YYYY-MM-DD`

### Chrome Extension Architecture

**Location**: `Browser Extension/` directory

**Structure**:
- `manifest.json` - Extension manifest v3
- `content.js` - Injected into ChatGPT, Claude, Gemini pages
- `sidebar.js` - Sidebar UI logic
- `background.js` - Service worker for background tasks
- `popup.html/js` - Extension popup UI
- `sidebar.html/css`, `styles.css` - UI styling

**Integration Points**:
- Matches URLs: `chatgpt.com/*`, `claude.ai/*`, `gemini.google.com/*`
- Calls `/api/rewrite` endpoint on `fixmyprompts.com`
- Permissions: storage, activeTab, scripting

## Important Implementation Details

### API Response Handling
- Gemini API returns JSON with `response_mime_type: "application/json"`
- Response may be wrapped in markdown code blocks (```json...```)
- `extractFirstJsonObject()` utility handles extraction
- Always validate `improvedPrompt` field exists and is non-empty

### Error Handling Patterns
- Check for `MAX_TOKENS` finish reason from Gemini
- Handle missing API keys gracefully
- CORS headers applied via `addCors()` helper
- Rate limiting returns 429 status

### Environment Variables / Secrets
- `GEMINI_API_KEY` - Required for API calls
- `EXTENSION_TOKEN` - Optional, for Chrome extension authentication
- Set via `wrangler secret put <NAME>`

### TypeScript Configuration
- Path aliasing: `@/*` → `./src/*`
- Relaxed type checking: `noImplicitAny: false`, `strictNullChecks: false`
- Two configs: `tsconfig.app.json` (app code), `tsconfig.node.json` (Vite config)

### Vite Configuration
- Dev server runs on port 8080, IPv6 host `::`
- Uses `lovable-tagger` plugin in development mode
- SWC for React fast refresh

## Common Workflows

### Adding a New Route
1. Create page component in `src/pages/`
2. Import in `App.tsx`
3. Add `<Route>` BEFORE the catch-all `*` route

### Modifying Prompt Rules
1. Edit `public/api/promptRules.js`
2. Update `baseInstructions` or `categoryInstructions`
3. Deploy worker: `wrangler deploy`

### Adding a New Category
1. Update `categoryInstructions` in `promptRules.js`
2. Update `categories` array in `src/pages/Index.tsx`
3. Update validation in `improve-prompt.js` (`validateExtensionRequest`)
4. Update Chrome extension if needed

### Testing Changes
- Frontend: `npm run dev` and test in browser
- Worker: Deploy to Cloudflare, test via curl or frontend
- Extension: Load unpacked in Chrome from `Browser Extension/` directory

## Key Dependencies

**Frontend**:
- React 18.3 + React Router 6
- shadcn-ui (Radix UI components)
- Tailwind CSS 3.4
- Zod for validation
- React Hook Form

**Backend**:
- Cloudflare Workers runtime
- Wrangler 4.22+ for deployment
- No Node.js runtime in production

**Chrome Extension**:
- Manifest v3
- Vanilla JavaScript (no build step)

## Deployment

**Frontend**: 
- Deployed via Lovable platform
- URL: https://lovable.dev/projects/90e29bb4-a7b0-4c65-b593-115a51c2e3ff
- Push to git triggers auto-deployment

**Backend**:
- Deploy: `wrangler deploy`
- Worker URL: `https://fixmyprompts.<subdomain>.workers.dev`
- Requires `GEMINI_API_KEY` secret

**Chrome Extension**:
- Package `Browser Extension/` directory
- Submit to Chrome Web Store
- Update `host_permissions` if worker URL changes
