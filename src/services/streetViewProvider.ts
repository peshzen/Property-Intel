import { callAuthedFunction } from './netlifyClient';

export async function fetchStreetViewUrl(lat: number, lng: number): Promise<string | null> {
  const data = await callAuthedFunction<{ imageUrl?: string | null }>('google-street-view', { lat, lng });
  return data.imageUrl ?? null;
}
