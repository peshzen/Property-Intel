import { Comp } from '../types';
import { v4 as uuid } from 'uuid';
export async function getComps(radiusMiles:number):Promise<Comp[]>{
  // TODO: Replace with MLS/compliant data provider adapter.
  return Array.from({length:5}).map((_,i)=>({id:uuid(),address:`${100+i} Demo St`,distanceMiles:Number((0.2+i*0.15).toFixed(2)),beds:3,baths:2,squareFeet:1600+i*50,soldPrice:320000+i*10000,soldDate:'2025-12-15',yearBuilt:1990+i,source:'mock'})).filter(c=>c.distanceMiles<=radiusMiles+1);
}
