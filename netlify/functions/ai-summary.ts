import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const payload = JSON.parse(event.body ?? '{}');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { statusCode: 200, body: JSON.stringify({ summary: 'AI summary unavailable: OPENAI_API_KEY not configured. Report generated with factual provider data only.' }) };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: `You are an investor analyst. Never fabricate data. If missing, say uncertain. Analyze this JSON: ${JSON.stringify(payload).slice(0, 12000)}`,
    }),
  });
  const data = await response.json();
  const summary = data.output_text ?? 'AI analysis completed with limited formatting.';
  return { statusCode: 200, body: JSON.stringify({ summary }) };
};
