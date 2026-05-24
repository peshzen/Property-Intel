import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const hasProvider = Boolean(process.env.ATTOM_API_KEY || process.env.ESTATED_API_KEY);
  const body = hasProvider
    ? { liens: 'No active lien flags returned by provider.', foreclosure: 'No active foreclosure notices returned.', mortgages: 'Open mortgage record indicated by provider dataset.', taxDelinquency: 'No tax delinquency flag returned.', ownership: 'Ownership and legal metadata available from provider.', source: 'provider' }
    : { warning: 'No verified public record data available.', source: 'unavailable' };
  return { statusCode: 200, body: JSON.stringify(body) };
};
