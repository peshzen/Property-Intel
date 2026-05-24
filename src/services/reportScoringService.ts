import { Comp, PropertyFacts } from '../types';
export function scoreReport(facts:PropertyFacts,comps:Comp[]){
  const avgCompPrice=comps.reduce((a,c)=>a+c.soldPrice,0)/Math.max(comps.length,1);
  const ppsf=avgCompPrice/Math.max(facts.squareFeet,1);
  const estimatedArv=Math.round(avgCompPrice*1.02);
  const suggestedMaxOffer=Math.round(estimatedArv*0.7);
  const confidence=Math.max(40,Math.min(98,Math.round(60+comps.length*6)));
  return {avgCompPrice,ppsf,estimatedArv,suggestedMaxOffer,confidence,notes:'Assumes average rehab profile. Verify with local contractor bids and title professionals.'};
}
