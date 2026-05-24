export interface GeocodeResult { normalizedAddress:string; city:string; county:string; state:string; zip:string; latitude:number; longitude:number; }
export async function geocodeAddress(address:string):Promise<GeocodeResult>{
  // TODO: Connect official geocoding API via Netlify function.
  return { normalizedAddress:address.trim(), city:'Austin', county:'Travis', state:'TX', zip:'78701', latitude:30.2672, longitude:-97.7431 };
}
