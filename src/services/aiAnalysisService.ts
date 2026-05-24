import { authHeaders } from './_netlifyAuth';
export async function generateAiSummary(input: unknown): Promise<string> {
  const response = await fetch('/.netlify/functions/ai-summary', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to generate AI summary');
  const data = await response.json();
  return data.summary;
}
