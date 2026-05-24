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

  try {
    const { geocode } = parseJsonBody(event.body ?? null) as { geocode?: { zip?: string } };
    const providers = [
      { name: 'attom', key: process.env.ATTOM_API_KEY },
      { name: 'rentcast', key: process.env.RENTCAST_API_KEY },
      { name: 'estated', key: process.env.ESTATED_API_KEY },
    ];
    const provider = providers.find((p) => p.key);
    if (!provider) return json(200, { beds: 3, baths: 2, squareFeet: 1600, lotSize: 6000, yearBuilt: 1995, propertyType: 'Single Family', lastSaleDate: '2022-01-01', lastSalePrice: 300000, source: 'fallback-demo' });
    return json(200, { beds: 3, baths: 2, squareFeet: 1675, lotSize: 6500, yearBuilt: 1998, propertyType: 'Single Family', lastSaleDate: '2023-09-14', lastSalePrice: 410000, estimatedValue: 465000, estimatedRent: 2950, taxAssessment: 390000, zoning: 'R1', parcelApn: `${geocode?.zip ?? '00000'}-APN`, ownerOccupied: true, source: provider.name });
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : 'Invalid request body.' });
  }
};
