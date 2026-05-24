import { createReport, insertComps } from '../lib/db';
import type { Comp, GeocodeResult, InvestorMetrics, PropertyFacts, PublicRecordSummary } from '../types';

export async function persistReport(payload: { geocode: GeocodeResult; property: PropertyFacts; comps: Comp[]; records: PublicRecordSummary; metrics: InvestorMetrics; mainImage: string | null; aiSummary: string; }) {
  const report = await createReport({
    address: payload.geocode.normalizedAddress,
    city: payload.geocode.city,
    county: payload.geocode.county,
    state: payload.geocode.state,
    zip: payload.geocode.zip,
    latitude: payload.geocode.latitude,
    longitude: payload.geocode.longitude,
    main_image_url: payload.mainImage,
    property_images: payload.mainImage ? [payload.mainImage] : [],
    estimated_arv: payload.metrics.estimatedArv,
    upset_price: payload.metrics.suggestedMaxOffer,
    report_data: { property: payload.property, comps: payload.comps, publicRecords: payload.records, metrics: payload.metrics, aiSummary: payload.aiSummary },
    custom_fields: [],
  });
  await insertComps(report.id, payload.comps);
  return report;
}
