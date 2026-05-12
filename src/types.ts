export type Vehicle = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  exterior_color: string;
  interior_color: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  odometer_km: number;
  fuel_type: string;
  condition_grade: number;
  condition_report: string;
  damage_notes: string[];
  title_status: 'clean' | 'rebuilt' | 'salvage';
  province: string;
  city: string;
  auction_start: string;
  starting_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  images: string[];
  selling_dealership: string;
  lot: string;
  current_bid: number | null;
  bid_count: number;
};

export type Bid = {
  vehicleId: string;
  bidderId: string;
  amount: number;
  placedAt: string;
};

export type AuctionStatus = 'upcoming' | 'live' | 'ended';

export type BidError =
  | { type: 'amount_too_low'; min: number }
  | { type: 'amount_too_high'; max: number }
  | { type: 'auction_not_live'; status: 'upcoming' | 'ended' };

export type BidResult = { ok: true; bid: Bid } | { ok: false; error: BidError };

export type SortKey = 'ending-soon' | 'price-low-high' | 'price-high-low' | 'condition-best-worst';

export type FilterState = {
  search: string;
  makes: string[];
  bodyStyles: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: SortKey;
};
