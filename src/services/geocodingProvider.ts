import type { GeocodeResult } from '../types';
import { callNetlifyFunction } from './netlifyClient';

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const data = await callNetlifyFunction<{ formatted_address: string; lat: number; lng: number; city: string; county: string; state: string; zip: string }>('geocode-address', { address });
  return {
    normalizedAddress: data.formatted_address,
    city: data.city,
    county: data.county,
    state: data.state,
    zip: data.zip,
    latitude: data.lat,
    longitude: data.lng,
  };
}
