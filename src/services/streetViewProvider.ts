export async function fetchStreetViewUrl(lat: number, lng: number): Promise<string | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x675&location=${lat},${lng}&key=${key}`;
}
