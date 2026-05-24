import { describe,it,expect } from 'vitest';
import { scoreReport } from '../src/services/reportScoringService';

describe('scoreReport',()=>{
  it('computes arv and max offer',()=>{
    const out=scoreReport({beds:3,baths:2,squareFeet:1500,lotSize:5000,yearBuilt:2000,propertyType:'SFH',lastSaleDate:'2020-01-01',lastSalePrice:200000},[{id:'1',address:'a',distanceMiles:0.2,beds:3,baths:2,squareFeet:1500,soldPrice:300000,soldDate:'2025-01-01',yearBuilt:1999,source:'mock'}]);
    expect(out.estimatedArv).toBeGreaterThan(0); expect(out.suggestedMaxOffer).toBeLessThan(out.estimatedArv);
  });
});
