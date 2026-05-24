import type { PropertyFacts } from '../types';
import { geocodeAddress } from './geocodingProvider';
import { fetchProperty } from './propertyProvider';

export async function getPropertyFacts(address: string): Promise<PropertyFacts> {
  const geo = await geocodeAddress(address);
  return fetchProperty(geo);
}
