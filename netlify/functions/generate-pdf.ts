import type { Handler } from '@netlify/functions';
export const handler: Handler = async () => ({ statusCode: 501, body: JSON.stringify({ error: 'Server-side PDF generation not implemented yet. Use client PDF fallback.' }) });
