
// Cloudflare Worker API Handler
// This file shows the structure for the Cloudflare Worker that will handle Gemini API calls

// Base system prompt that applies to all categories
const BASE_SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to take rough, unclear prompts and transform them into clear, specific, and effective prompts that will get better results from AI systems.

Guidelines:
- Be specific and detailed
- Add context and constraints where helpful
- Structure the prompt logically
- Include desired format/style when relevant
- Make it actionable and clear
- Preserve the original intent while enhancing clarity

Transform the user's input into a much better prompt:`;

// Category-specific system instructions
const CATEGORY_INSTRUCTIONS = {
  'General': 'Focus on clarity, specificity, and actionable instructions. Add context that would help any AI understand exactly what is needed.',
  
  'Creative Writing': 'Enhance with specific genre, tone, length, audience, and style requirements. Include character details, setting, and narrative structure guidance.',
  
  'Research': 'Structure for comprehensive analysis including scope, methodology, sources, depth of analysis, and specific deliverables expected.',
  
  'Problem Solving': 'Frame with clear problem definition, constraints, desired outcome, step-by-step approach, and success criteria.',
  
  'Image Gen': 'Add detailed visual descriptions including composition, lighting, style, mood, technical specifications, and artistic references.'
};

// Cloudflare Worker endpoint structure
export const cloudflareWorkerCode = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { prompt, category } = await request.json()
    
    // Get category-specific instruction
    const categoryInstruction = CATEGORY_INSTRUCTIONS[category] || CATEGORY_INSTRUCTIONS['General']
    
    // Combine base prompt with category instruction
    const systemPrompt = BASE_SYSTEM_PROMPT + '\\n\\n' + categoryInstruction
    
    // TODO: Replace GEMINI_API_KEY with actual secret from Cloudflare Worker environment
    const GEMINI_API_KEY = 'your-gemini-api-key-here' // This should be set as a Cloudflare Worker secret
    
    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt + '\\n\\nOriginal prompt: "' + prompt + '"'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error('Gemini API error: ' + JSON.stringify(data))
    }

    const improvedPrompt = data.candidates[0].content.parts[0].text

    return new Response(JSON.stringify({ 
      improvedPrompt: improvedPrompt 
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to improve prompt' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}

// Category instructions object (same as above)
const CATEGORY_INSTRUCTIONS = {
  'General': 'Focus on clarity, specificity, and actionable instructions. Add context that would help any AI understand exactly what is needed.',
  'Creative Writing': 'Enhance with specific genre, tone, length, audience, and style requirements. Include character details, setting, and narrative structure guidance.',
  'Research': 'Structure for comprehensive analysis including scope, methodology, sources, depth of analysis, and specific deliverables expected.',
  'Problem Solving': 'Frame with clear problem definition, constraints, desired outcome, step-by-step approach, and success criteria.',
  'Image Gen': 'Add detailed visual descriptions including composition, lighting, style, mood, technical specifications, and artistic references.'
}

const BASE_SYSTEM_PROMPT = \`You are an expert prompt engineer. Your job is to take rough, unclear prompts and transform them into clear, specific, and effective prompts that will get better results from AI systems.

Guidelines:
- Be specific and detailed
- Add context and constraints where helpful
- Structure the prompt logically
- Include desired format/style when relevant
- Make it actionable and clear
- Preserve the original intent while enhancing clarity

Transform the user's input into a much better prompt:\`
`;

// For development, we'll create a mock API endpoint
export const mockApiResponse = (prompt: string, category: string) => {
  // This is just for development - replace with actual Cloudflare Worker
  const mockResponses = {
    'General': `Please provide a comprehensive and detailed response about ${prompt}. Include specific examples, actionable insights, and structure your answer with clear headings. Aim for thoroughness while maintaining clarity and readability.`,
    'Creative Writing': `Write a compelling ${prompt} with rich character development, vivid descriptions, and engaging dialogue. Set the scene clearly, establish the mood and tone, and ensure the narrative flows naturally with proper pacing and structure.`,
    'Research': `Conduct thorough research on ${prompt} and provide a comprehensive analysis. Include multiple perspectives, cite relevant sources, examine current trends and data, and conclude with actionable insights and recommendations.`,
    'Problem Solving': `Analyze the problem: ${prompt}. Break down the issue into components, identify root causes, explore multiple solution approaches, evaluate pros and cons of each option, and provide a clear implementation strategy with measurable outcomes.`,
    'Image Gen': `Create a highly detailed, photorealistic image of ${prompt}. Include specific details about composition, lighting (golden hour/dramatic/soft), color palette, artistic style, camera angle, and visual elements. Specify image quality as 4K, professional photography style.`
  };

  return mockResponses[category as keyof typeof mockResponses] || mockResponses['General'];
};
