import { fetchStreetViewUrl } from './streetViewProvider';

export async function fetchPropertyImages(lat: number, lng: number): Promise<string[]> {
  const primary = await fetchStreetViewUrl(lat, lng);
  return primary ? [primary] : [];
}
