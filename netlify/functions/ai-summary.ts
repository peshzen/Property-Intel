import type { Handler } from '@netlify/functions';
import { json, parseJsonBody, requireApprovedUser } from './_auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    await requireApprovedUser(event.headers.authorization || event.headers.Authorization);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return json(message === 'User is not approved.' ? 403 : 401, { error: message });
  }

  let payload: Record<string, unknown>;
  try {
    payload = parseJsonBody(event.body ?? null);
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : 'Invalid JSON body.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(200, { summary: 'AI summary unavailable: OPENAI_API_KEY not configured. Report generated with factual provider data only.' });

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: `You are an investor analyst. Never fabricate data. If missing, say uncertain. Analyze this JSON: ${JSON.stringify(payload).slice(0, 12000)}`,
    }),
  });
  const data = await response.json();
  return json(200, { summary: data.output_text ?? 'AI analysis completed with limited formatting.' });
};
