import type { Handler } from '@netlify/functions';
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  // TODO: connect OPENAI_API_KEY-based summarization. Keep keys in Netlify env only.
  return { statusCode: 200, body: JSON.stringify({ summary: 'Mock AI summary: verify values with licensed professionals before buying.' }) };
};
