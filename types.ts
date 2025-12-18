export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocation {
  address: string;
  coords: Coordinates | null;
  label: string; // "Person A" or "Person B"
}

export interface Restaurant {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  price_level: number;
  vicinity: string;
  geometry: {
    location: any;
  };
  types: string[];
  photos?: any[];
  // Enriched data
  travelTimeA?: string;
  travelTimeB?: string;
  secondsA?: number;
  secondsB?: number;
  fairnessScore?: string;
  fairnessColor?: string;
  nearestSubway?: string;
  subwayDist?: string;
  aiVerdict?: string;
  cuisineType?: string; // New field
  // Detail fields
  detailsLoaded?: boolean;
  website?: string;
  formatted_phone_number?: string;
  url?: string; // Google Maps link
  opening_hours?: {
    weekday_text: string[];
    isOpen: () => boolean;
    periods?: any[]; // For precise open/close logic
  };
}

export enum PriceLevel {
  Inexpensive = 1,
  Moderate = 2,
  Expensive = 3,
  VeryExpensive = 4,
}

export interface AppState {
  step: 'API_KEY' | 'INPUT' | 'SEARCHING' | 'RESULTS';
  mapsApiKey: string;
  locationA: UserLocation;
  locationB: UserLocation;
  region: string; // New filter
  selectedCuisines: string[];
  priceRange: number[]; // 1-4
  timing: 'now' | 'later';
  results: Restaurant[];
  midpoint: Coordinates | null;
  error: string | null;
}

export const CUISINE_OPTIONS = [
  "Italian", "Chinese", "Japanese", "Korean", "Mexican", "Thai", 
  "Indian", "American", "Mediterranean", "French", "Vietnamese", "Pizza", "Burgers"
];

export const REGION_OPTIONS = [
  { label: "Anywhere (Calculated Midpoint)", value: "ANYWHERE" },
  { label: "Manhattan", value: "Manhattan, NY" },
  { label: "Brooklyn", value: "Brooklyn, NY" },
  { label: "Queens", value: "Queens, NY" },
  { label: "The Bronx", value: "The Bronx, NY" },
  { label: "Staten Island", value: "Staten Island, NY" },
  { label: "SoHo", value: "SoHo, Manhattan, NY" },
  { label: "East Village", value: "East Village, Manhattan, NY" },
  { label: "Williamsburg", value: "Williamsburg, Brooklyn, NY" },
  { label: "Astoria", value: "Astoria, Queens, NY" },
  { label: "Upper West Side", value: "Upper West Side, Manhattan, NY" },
  { label: "Midtown", value: "Midtown Manhattan, NY" },
  { label: "Lower East Side", value: "Lower East Side, Manhattan, NY" },
  { label: "Chelsea", value: "Chelsea, Manhattan, NY" },
  { label: "Financial District", value: "Financial District, Manhattan, NY" },
  { label: "Greenpoint", value: "Greenpoint, Brooklyn, NY" },
  { label: "DUMBO", value: "DUMBO, Brooklyn, NY" },
  { label: "Long Island City", value: "Long Island City, Queens, NY" },
  { label: "Harlem", value: "Harlem, Manhattan, NY" },
];