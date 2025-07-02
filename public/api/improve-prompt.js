
// Mock API endpoint for development
// In production, this should be replaced with the actual Cloudflare Worker endpoint

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt, category } = req.body;

    // Mock improved prompts for development
    const mockResponses = {
      'General': `Please provide a comprehensive and detailed analysis of "${prompt}". Structure your response with clear sections, include specific examples and actionable insights, and ensure the information is accurate and up-to-date. Present the information in a format that is easy to understand and implement.`,
      
      'Creative Writing': `Write an engaging and original piece about "${prompt}". Develop compelling characters with clear motivations, create vivid settings that immerse the reader, use descriptive language that appeals to the senses, maintain consistent tone and pacing throughout, and ensure the narrative has a clear beginning, middle, and satisfying conclusion. Target length: 800-1200 words.`,
      
      'Research': `Conduct comprehensive research on "${prompt}" and provide a detailed analysis. Include: 1) Current state and trends, 2) Historical context and evolution, 3) Key stakeholders and their perspectives, 4) Supporting data and statistics from reliable sources, 5) Potential implications and future outlook, 6) Actionable recommendations based on findings. Present in academic format with proper citations.`,
      
      'Problem Solving': `Analyze and solve the following challenge: "${prompt}". Break down your approach as follows: 1) Problem definition and scope, 2) Root cause analysis, 3) Generate multiple solution alternatives, 4) Evaluate each option with pros/cons, 5) Recommend the best solution with implementation steps, 6) Define success metrics and timeline. Provide practical, actionable guidance.`,
      
      'Image Gen': `Create a stunning, photorealistic image of "${prompt}". Technical specifications: 4K resolution, professional photography quality, shot with a full-frame camera. Visual details: dramatic lighting with golden hour warmth, rich color saturation, sharp focus on subject with subtle depth of field, balanced composition using rule of thirds, include environmental context that enhances the subject. Style: cinematic, award-winning photography aesthetic.`
    };

    const improvedPrompt = mockResponses[category] || mockResponses['General'];

    // Simulate API delay
    setTimeout(() => {
      res.status(200).json({ improvedPrompt });
    }, 1500);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to improve prompt' });
  }
}
