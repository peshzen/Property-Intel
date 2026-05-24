export type Role = 'user' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  role: Role;
  approval_status: ApprovalStatus;
  default_comp_radius_miles: number;
  google_maps_api_key_encrypted: string | null;
  google_maps_api_key_status?: 'not_connected' | 'connected' | 'connection_failed' | null;
  google_maps_api_key_last_tested_at?: string | null;
}

export interface GeocodeResult {
  normalizedAddress: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
}

export interface PropertyFacts {
  beds: number;
  baths: number;
  squareFeet: number;
  lotSize: number;
  yearBuilt: number;
  propertyType: string;
  zoning?: string;
  parcelApn?: string;
  ownerOccupied?: boolean;
  estimatedValue?: number;
  estimatedRent?: number;
  taxAssessment?: number;
  lastSaleDate: string;
  lastSalePrice: number;
  source?: string;
}

export interface PublicRecordSummary {
  liens?: string;
  foreclosure?: string;
  mortgages?: string;
  taxDelinquency?: string;
  codeViolations?: string;
  ownership?: string;
  legalDescription?: string;
  source?: string;
  warning?: string;
}

export interface Comp {
  id: string;
  address: string;
  distanceMiles: number;
  beds: number;
  baths: number;
  squareFeet: number;
  soldPrice: number;
  soldDate: string;
  yearBuilt: number;
  lotSize?: number;
  imageUrl?: string;
  source: string;
  adjustments?: Record<string, number>;
}

export interface InvestorMetrics {
  averageCompValue: number;
  medianCompValue: number;
  pricePerSqft: number;
  estimatedArv: number;
  rehabAdjustedArv: number;
  suggestedMaxOffer: number;
  estimatedEquity: number;
  projectedProfit: number;
  rentalEstimate: number;
  capRate: number;
  cashOnCash: number;
  confidence: number;
}

export interface Report {
  id: string;
  user_id: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  main_image_url: string | null;
  property_images: string[];
  zillow_estimate: number | null;
  realtor_estimate: number | null;
  estimated_arv: number | null;
  upset_price: number | null;
  star_rating: number | null;
  report_data: any;
  custom_fields: any[];
  share_token: string | null;
  created_at: string;
}
