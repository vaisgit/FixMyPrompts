// Cloudflare Worker for FixMyPrompts - handles both website and Chrome extension
// Supports: /improve (website), /api/rewrite (Chrome extension), /feedback (feedback system)

// Mock API endpoint for development
// In production, this should be replaced with the actual Cloudflare Worker endpoint

// Rate limiting: simple in-memory map (resets on worker cold start)
const rateLimitMap = new Map();

// CORS helper function
function addCors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Rate limiting helper
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const record = rateLimitMap.get(ip);
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Validation helper for Chrome extension
function validateExtensionRequest(body) {
  const { originalPrompt, category } = body;
  
  // Check required fields
  if (!originalPrompt || typeof originalPrompt !== 'string') {
    return { valid: false, error: 'originalPrompt is required and must be a string' };
  }
  
  if (!category || typeof category !== 'string') {
    return { valid: false, error: 'category is required and must be a string' };
  }
  
  // Check character limit
  if (originalPrompt.length > 2000) {
    return { valid: false, error: 'originalPrompt must be 2000 characters or less' };
  }
  
  // Check category enum
  const validCategories = ['General', 'Creative Writing', 'Research', 'Problem Solving', 'Image Generation'];
  if (!validCategories.includes(category)) {
    return { valid: false, error: `category must be one of: ${validCategories.join(', ')}` };
  }
  
  return { valid: true };
}

// Optional auth check for Chrome extension
function checkAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return true; // No auth required if no header
  
  const token = env.EXTENSION_TOKEN;
  if (!token) return true; // No token configured, skip auth
  
  return authHeader === `Bearer ${token}`;
}

export class PromptsFeedback {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    if (request.method === 'POST') {
      let data;
      try {
        data = await request.json();
      } catch {
        return new Response('Bad Request', { status: 400 });
      }
      const { liked } = data;
      if (typeof liked !== 'boolean') {
        return new Response('Bad Request', { status: 400 });
      }
      let stored = await this.state.storage.get('feedback');
      if (!stored) stored = { likes: 0, dislikes: 0 };
      if (liked) stored.likes += 1;
      else stored.dislikes += 1;
      await this.state.storage.put('feedback', stored);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (request.method === 'GET') {
      // Optionally, restrict to owner IP or add a secret header for privacy
      const stored = await this.state.storage.get('feedback') || { likes: 0, dislikes: 0 };
      const total = stored.likes + stored.dislikes;
      const percent = total > 0 ? Math.round((stored.likes / total) * 100) : 0;
      return new Response(JSON.stringify({ percent, total }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Method Not Allowed', { status: 405 });
  }
}

export class FeedbackCounter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    return new Response('This class is deprecated and will be deleted.', { status: 410 });
  }
}

/**
 * Handles the core logic of improving a prompt by calling the Gemini API.
 * This function is shared by both the website and the extension endpoints.
 * @param {string} originalPrompt The user's original prompt.
 * @param {string} category The selected category.
 * @param {object} env The Cloudflare Worker environment variables.
 * @returns {Promise<Response>} A Response object with the improved prompt or an error.
 */
async function handlePromptImprovement(originalPrompt, category, env) {
  // Import prompt rules
  const { baseInstructions, categoryInstructions } = await import('./promptRules.js');
  
  // Build system prompt
  const categoryInstruction = categoryInstructions[category] || categoryInstructions['General'];
  const systemPrompt = baseInstructions + '\n\n' + categoryInstruction;
  
  // Check API key
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return addCors(new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  
  // Build Gemini API payload
  const geminiPayload = {
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + "\n\n" + originalPrompt }] }
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      // Ensure Gemini API is prompted to return JSON
      response_mime_type: "application/json", 
    }
  };
  
  // Call Gemini API
  let geminiResponse, geminiData;
  try {
    geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });
    
    geminiData = await geminiResponse.json();
  } catch (err) {
    console.error('[Worker] Gemini API request failed:', err);
    return addCors(new Response(JSON.stringify({ error: 'Failed to contact Gemini API' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  
  // Handle Gemini API errors
  if (!geminiResponse.ok || !geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('[Worker] Gemini API error:', JSON.stringify(geminiData));
    return addCors(new Response(JSON.stringify({ 
      error: 'Gemini API error',
      details: geminiData.error || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  
  // Extract and parse the JSON from Gemini's response
  const geminiOutputText = geminiData.candidates[0].content.parts[0].text;
  let improvedPrompt;
  try {
    const parsedJson = JSON.parse(geminiOutputText);
    improvedPrompt = parsedJson.improvedPrompt;

    if (!improvedPrompt) {
      throw new Error('Parsed JSON does not contain "improvedPrompt" key.');
    }

  } catch (err) {
    console.error('[Worker] Failed to parse JSON from Gemini:', err, 'Raw text:', geminiOutputText);
    return addCors(new Response(JSON.stringify({ 
      error: 'Failed to parse JSON response from AI model.',
      details: geminiOutputText
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }));
  }

  // Return success response
  return addCors(new Response(JSON.stringify({ improvedPrompt }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  }));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle feedback endpoints (existing functionality)
    if (url.pathname === '/feedback' && (request.method === 'POST' || request.method === 'GET')) {
      const id = env.PROMPTS_FEEDBACK.idFromName('global');
      const obj = env.PROMPTS_FEEDBACK.get(id);
      if (request.method === 'POST') {
        // Re-create the POST request with a fresh body for the Durable Object
        const data = await request.json();
        const body = JSON.stringify({ liked: data.liked });
        return obj.fetch(url.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
      } else {
        // GET
        return obj.fetch(url.toString(), { method: 'GET' });
      }
    }
    
    // Handle Chrome extension endpoint (/api/rewrite)
    if (url.pathname === '/api/rewrite') {
      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
      
      if (request.method !== 'POST') {
        return addCors(new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Get client IP for rate limiting
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      // Check rate limit
      if (!checkRateLimit(clientIP)) {
        return addCors(new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 5 requests per minute.' 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Optional auth check
      if (!checkAuth(request, env)) {
        return addCors(new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Parse request body
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return addCors(new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // Validate request
      const validation = validateExtensionRequest(body);
      if (!validation.valid) {
        return addCors(new Response(JSON.stringify({ error: validation.error }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const { originalPrompt, category } = body;
      
      // Call the unified handler
      const response = await handlePromptImprovement(originalPrompt, category, env);

      // Update stats in background if the call was successful
      if (response.ok) {
        ctx.waitUntil((async () => {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const key = `statsExtension:${today}`;
            const current = parseInt(await env.PROMPT_STATS_KV.get(key)) || 0;
            await env.PROMPT_STATS_KV.put(key, (current + 1).toString());
          } catch (e) {
            console.error('[Worker] Failed to update stats:', e);
          }
        })());
      }
      
      return response;
    }
    
    // Handle website endpoint (/improve)
    if (url.pathname === '/improve') {
      // Enable CORS for OPTIONS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
      
      if (request.method !== 'POST') {
        return addCors(new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return addCors(new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      const { prompt, category } = body;
      if (!prompt || typeof prompt !== 'string') {
        return addCors(new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // Call the unified handler
      const response = await handlePromptImprovement(prompt, category, env);

      // Update stats in background if the call was successful
      if (response.ok) {
        ctx.waitUntil((async () => {
          try {
            const today = new Date().toISOString().slice(0, 10);
            const key = `statsDirect:${today}`;
            const current = parseInt(await env.PROMPT_STATS_KV.get(key)) || 0;
            await env.PROMPT_STATS_KV.put(key, (current + 1).toString());
          } catch (e) {
            console.error('[Worker] Failed to update website stats:', e);
          }
        })());
      }
      
      return response;
    }
    
    // Default response for unknown endpoints
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
