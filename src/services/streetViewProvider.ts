export function getStreetViewUrl(lat:number,lng:number,userKey?:string){
  const key=userKey || import.meta.env.GOOGLE_MAPS_API_KEY;
  if(!key) return null;
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x675&location=${lat},${lng}&key=${key}`;
}
