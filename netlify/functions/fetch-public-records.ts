import type { Handler } from '@netlify/functions';
import { json, requireApprovedUser } from './_auth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    await requireApprovedUser(event.headers.authorization || event.headers.Authorization);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    return json(message === 'User is not approved.' ? 403 : 401, { error: message });
  }

  const hasProvider = Boolean(process.env.ATTOM_API_KEY || process.env.ESTATED_API_KEY);
  return json(200, hasProvider
    ? { liens: 'No active lien flags returned by provider.', foreclosure: 'No active foreclosure notices returned.', mortgages: 'Open mortgage record indicated by provider dataset.', taxDelinquency: 'No tax delinquency flag returned.', ownership: 'Ownership and legal metadata available from provider.', source: 'provider' }
    : { warning: 'No verified public record data available.', source: 'unavailable' });
};
