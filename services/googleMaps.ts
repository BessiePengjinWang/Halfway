import { Coordinates, Restaurant } from '../types';

declare var google: any;

let mapInstance: any | null = null;
let placesService: any | null = null;
let directionsService: any | null = null;
let geocoder: any | null = null;
let distanceMatrixService: any | null = null;

// Dynamically load the Google Maps script
export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

export const initServices = (mapDiv: HTMLDivElement | null) => {
  if (!(window as any).google) throw new Error("Google Maps API not loaded");
  
  // We need a map instance for PlacesService, even if not displayed yet
  // If mapDiv is provided, we attach to it. If not, create a headless one? 
  // PlacesService requires a map or node.
  const dummyDiv = document.createElement('div');
  mapInstance = new google.maps.Map(mapDiv || dummyDiv, {
    center: { lat: 40.7128, lng: -74.0060 }, // NYC Default
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    // Default Google Maps styles as requested
  });

  placesService = new google.maps.places.PlacesService(mapInstance);
  directionsService = new google.maps.DirectionsService();
  geocoder = new google.maps.Geocoder();
  distanceMatrixService = new google.maps.DistanceMatrixService();

  return mapInstance;
};

export const geocodeAddress = async (address: string): Promise<Coordinates> => {
  if (!geocoder) throw new Error("Maps services not initialized");
  
  return new Promise((resolve, reject) => {
    geocoder!.geocode({ address: address }, (results: any[], status: any) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        reject(new Error(`Geocode failed: ${status}`));
      }
    });
  });
};

export const getGeographicMidpoint = (a: Coordinates, b: Coordinates): Coordinates => {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2
  };
};

export const searchNearbySubways = async (location: Coordinates): Promise<any[]> => {
  if (!placesService) throw new Error("Places service not initialized");

  const request: any = {
    location: new google.maps.LatLng(location.lat, location.lng),
    rankBy: google.maps.places.RankBy.DISTANCE,
    type: 'subway_station'
  };

  return new Promise((resolve) => {
    placesService!.nearbySearch(request, (results: any[], status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Return top 3 closest subways
        resolve(results.slice(0, 3));
      } else {
        resolve([]); // Graceful fail
      }
    });
  });
};

const extractCuisine = (types: string[]): string | undefined => {
  // Only look for explicit restaurant types
  const restaurantType = types.find(t => t.endsWith('_restaurant') || t === 'pizza' || t === 'steakhouse');
  
  if (restaurantType) {
    return restaurantType
      .replace('_restaurant', '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  
  return undefined;
};

export const searchRestaurantsNear = async (
  location: Coordinates, 
  cuisines: string[],
  minPrice: number,
  maxPrice: number
): Promise<Restaurant[]> => {
  if (!placesService) throw new Error("Places service not initialized");

  const keyword = cuisines.length > 0 ? cuisines.join(' OR ') : 'restaurant';

  const request: any = {
    location: new google.maps.LatLng(location.lat, location.lng),
    radius: 800, // ~10 min walk
    type: 'restaurant',
    keyword: keyword,
    minPriceLevel: minPrice,
    maxPriceLevel: maxPrice,
  };

  return new Promise((resolve) => {
    placesService!.nearbySearch(request, (results: any[], status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Map to our Restaurant type
        const mapped = results.map((r: any) => ({
          place_id: r.place_id!,
          name: r.name!,
          rating: r.rating || 0,
          user_ratings_total: r.user_ratings_total || 0,
          price_level: r.price_level || 1,
          vicinity: r.vicinity || '',
          geometry: { location: r.geometry!.location! },
          types: r.types || [],
          cuisineType: extractCuisine(r.types || []),
          photos: r.photos,
          detailsLoaded: false
        }));
        resolve(mapped);
      } else {
        resolve([]);
      }
    });
  });
};

export const getPlaceDetails = async (placeId: string): Promise<Partial<Restaurant>> => {
  if (!placesService) throw new Error("Places service not initialized");

  const request: any = {
    placeId: placeId,
    fields: ['name', 'rating', 'formatted_phone_number', 'website', 'opening_hours', 'url', 'photos', 'reviews']
  };

  return new Promise((resolve) => {
    placesService!.getDetails(request, (place: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        resolve({
          website: place.website,
          formatted_phone_number: place.formatted_phone_number,
          url: place.url,
          opening_hours: place.opening_hours, // includes periods and weekday_text
          photos: place.photos // Update photos with higher res if available
        });
      } else {
        resolve({});
      }
    });
  });
};

export const calculateTravelTimes = async (
  originA: Coordinates, 
  originB: Coordinates, 
  destinations: Restaurant[]
): Promise<Restaurant[]> => {
  if (!distanceMatrixService) throw new Error("Distance Matrix service not initialized");
  if (destinations.length === 0) return [];

  const destLocations = destinations.map(d => d.geometry.location);

  return new Promise((resolve, reject) => {
    distanceMatrixService!.getDistanceMatrix({
      origins: [
        new google.maps.LatLng(originA.lat, originA.lng),
        new google.maps.LatLng(originB.lat, originB.lng)
      ],
      destinations: destLocations,
      travelMode: google.maps.TravelMode.TRANSIT,
    }, (response: any, status: any) => {
      if (status === 'OK' && response) {
        const newRestaurants = destinations.map((rest, index) => {
          const resultA = response.rows[0].elements[index];
          const resultB = response.rows[1].elements[index];
          
          const timeA = resultA.duration?.text || '?';
          const valA = resultA.duration?.value || 0;
          
          const timeB = resultB.duration?.text || '?';
          const valB = resultB.duration?.value || 0;

          // Calculate Fairness (difference in seconds)
          const diff = Math.abs(valA - valB);
          const diffMins = Math.round(diff / 60);

          let fairnessScore = "Fair";
          let fairnessColor = "text-[#2ECC71]"; // Green
          
          if (diffMins <= 5) {
             fairnessScore = "Very Fair";
             fairnessColor = "text-[#2ECC71]"; // Green
          } else if (diffMins <= 10) {
             fairnessScore = "Fair";
             fairnessColor = "text-[#2ECC71]"; // Light Green logic handled in component via opacity or same color
          } else if (diffMins <= 15) {
             fairnessScore = "Mostly Fair";
             fairnessColor = "text-[#E67E22]"; // Orange
          } else {
             fairnessScore = "Unfair";
             fairnessColor = "text-[#E74C3C]"; // Red
          }

          return {
            ...rest,
            travelTimeA: timeA,
            travelTimeB: timeB,
            secondsA: valA,
            secondsB: valB,
            fairnessScore,
            fairnessColor
          };
        });
        resolve(newRestaurants);
      } else {
        reject(new Error(`Distance Matrix failed: ${status}`));
      }
    });
  });
};

export const getMap = () => mapInstance;