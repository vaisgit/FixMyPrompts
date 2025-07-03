// Mock API endpoint for development
// In production, this should be replaced with the actual Cloudflare Worker endpoint

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
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
    // Enable CORS
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
      console.log('[Worker] Method not allowed:', request.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Worker] Invalid JSON:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    const { prompt, category } = body;
    if (!prompt || typeof prompt !== 'string') {
      console.error('[Worker] Prompt is missing or invalid:', prompt);
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // New base and category instructions
    const baseInstructions = "Always rewrite the user's prompt to be clear, concise, and complete. If the prompt is too long, tighten the wording and remove redundancy without losing important details. If the prompt is too short or vague, add necessary context or clarification (without changing the intent) to guide the assistant. Preserve the user's original intent exactly – do not introduce new meaning or factual content. Do not ask the user for additional information. Maintain a neutral, helpful tone by default (unless a specific style is requested). Ensure the final prompt is easy to understand and will lead to a useful, high-quality answer. Limit the improved prompt to 500 characters maximum; rewrite or compress as needed so the output fits within this limit and never relies on automatic truncation.";

    const categoryInstructions = {
      "General": "Ensure the assistant's response will be comprehensive and well-structured. The prompt should ask for a detailed answer with clear organization. Include any relevant context or examples needed to fully address the topic, and request that information be accurate and up-to-date. The goal is a thorough, easy-to-understand explanation or analysis for the user.",
      "Creative Writing": "Prompt for an original, engaging creative piece. Encourage rich detail: well-developed characters, vivid setting, and descriptive language. Make sure the story has a clear beginning, middle, and end, with a consistent tone and pacing. (If not specified by the user, assume a neutral or generally appealing tone.) Aim for a narrative length that allows depth (e.g. several paragraphs, around 800-1200 words).",
      "Research": "Prompt for an in-depth, factual analysis. Break the response into clear sections covering: current state/trends, historical context, key stakeholders or perspectives, supporting data or statistics, implications/future outlook, and recommendations. Instruct the assistant to use a formal academic style with proper citations for any important facts. Emphasize accurate, evidence-backed information from reliable sources.",
      "Problem Solving": "Prompt for a step-by-step solution. Instruct the assistant to address the problem methodically: define the problem and scope, analyze root causes, propose multiple solution options, evaluate pros and cons of each, then give a recommended solution with implementation steps (including success metrics or timeline). The tone should be practical and solution-oriented, providing clear and actionable guidance.",
      "Image Gen": "Prompt for a highly detailed image description. Specify the subject and environment clearly, including distinctive visual elements. Include technical details for image quality (e.g. 4K resolution, sharp focus, specific camera or lens settings). Describe the lighting, atmosphere, and colors to set the mood (for example, 'golden hour sunlight with long shadows'). Mention the artistic style or influence (e.g. cinematic, photorealistic) to guide the image model. The result should read like a professional photography or art brief, ensuring the image is vivid and exactly as envisioned."
    };

    const instruction = baseInstructions + "\n\n" + (categoryInstructions[category] || categoryInstructions["General"]);

    // Compose Gemini API request
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent';
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Worker] API key not set');
      return new Response(JSON.stringify({ error: 'API key not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const geminiPayload = {
      contents: [
        { role: 'user', parts: [{ text: instruction + "\n\n" + prompt }] }
      ]
    };

    let geminiResp, geminiData;
    try {
      geminiResp = await fetch(`${geminiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });
      geminiData = await geminiResp.json();
    } catch (err) {
      console.error('[Worker] Failed to contact Gemini API:', err);
      return new Response(JSON.stringify({ error: 'Failed to contact Gemini API' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!geminiResp.ok || !geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('[Worker] Gemini API error:', JSON.stringify(geminiData));
      return new Response(JSON.stringify({ error: 'Gemini API error', details: geminiData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Increment daily stats in PROMPT_STATS_KV
    if (env.PROMPT_STATS_KV) {
      const today = new Date().toISOString().slice(0, 10);
      ctx.waitUntil((async () => {
        const key = `stats:${today}`;
        const current = parseInt(await env.PROMPT_STATS_KV.get(key)) || 0;
        await env.PROMPT_STATS_KV.put(key, (current + 1).toString());
      })());
    }

    const improvedPrompt = geminiData.candidates[0].content.parts[0].text;
    return new Response(JSON.stringify({ improvedPrompt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
