import type { GeocodeResult, PublicRecordSummary } from '../types';

export async function fetchPublicRecords(geocode: GeocodeResult): Promise<PublicRecordSummary> {
  const response = await fetch('/.netlify/functions/fetch-public-records', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ geocode }),
  });
  if (!response.ok) throw new Error('Failed to fetch public records');
  return response.json();
}

export async function getPublicRecordsChecks() {
  return fetchPublicRecords({ normalizedAddress: '', city: '', county: '', state: '', zip: '', latitude: 0, longitude: 0 });
}
