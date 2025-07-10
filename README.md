# FixMyPrompts.com

A mobile-first React + Tailwind SPA that helps users improve their AI prompts using Gemini Flash API, with Cloudflare Workers and Durable Objects for feedback storage and analytics.

## Project info

**URL**: https://lovable.dev/projects/90e29bb4-a7b0-4c65-b593-115a51c2e3ff

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/90e29bb4-a7b0-4c65-b593-115a51c2e3ff) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Cloudflare Workers
- Cloudflare KV
- Cloudflare Durable Objects
- Gemini Flash API

## API Documentation

### Chrome Extension API

The `/api/rewrite` endpoint is designed for Chrome extension integration.

#### Endpoint
- **URL**: `POST /api/rewrite`
- **CORS**: Enabled for all origins (`*`)
- **Rate Limit**: 5 requests per IP per minute

#### Request Body
```json
{
  "originalPrompt": "string (max 2000 chars)",
  "category": "General|Creative Writing|Research|Problem Solving|Image Generation"
}
```

#### Response
**Success (200)**:
```json
{
  "improvedPrompt": "string (max 500 chars)"
}
```

**Error (400/401/429/500)**:
```json
{
  "error": "error message",
  "details": "additional details (optional)"
}
```

#### Example cURL
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrompt": "help me write better",
    "category": "General"
  }'
```

#### Authentication (Optional)
If `EXTENSION_TOKEN` is set in environment variables, include:
```
Authorization: Bearer <EXTENSION_TOKEN>
```

## Using the Chrome Extension

1. **Installation**: The Chrome extension can be installed from the Chrome Web Store (link TBD)
2. **Usage**: Select text on any webpage, right-click, and choose "Improve Prompt with FixMyPrompts"
3. **Categories**: Choose from 5 categories to get specialized prompt improvements
4. **Rate Limits**: Maximum 5 requests per minute per IP address
5. **Privacy**: Original prompts are never logged or stored permanently

## How can I deploy this project?

### Frontend (Lovable)
Simply open [Lovable](https://lovable.dev/projects/90e29bb4-a7b0-4c65-b593-115a51c2e3ff) and click on Share -> Publish.

### Backend (Cloudflare Workers)

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Set up secrets**:
   ```bash
   wrangler secret put GEMINI_API_KEY
   # Optional: Set extension token for authentication
   wrangler secret put EXTENSION_TOKEN
   ```

3. **Deploy the worker**:
   ```bash
   wrangler deploy
   ```

The worker will be available at `https://fixmyprompts.your-subdomain.workers.dev/api/rewrite`

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
