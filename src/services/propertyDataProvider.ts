import { PropertyFacts } from '../types';
export async function getPropertyFacts(_address:string):Promise<PropertyFacts>{
  // TODO: Replace with official provider adapter (ATTOM/RENTCAST/etc.) through serverless function.
  return { beds:3,baths:2,squareFeet:1650,lotSize:7200,yearBuilt:1994,propertyType:'Single Family',lastSaleDate:'2021-06-01',lastSalePrice:315000 };
}
