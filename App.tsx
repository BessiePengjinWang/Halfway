import React, { useState, useEffect, useRef } from 'react';
import { AppState, UserLocation, Restaurant, REGION_OPTIONS } from './types';
import Sidebar from './components/Sidebar';
import ApiKeyModal from './components/ApiKeyModal';
import { 
  loadGoogleMapsScript, 
  initServices, 
  geocodeAddress, 
  getGeographicMidpoint,
  searchNearbySubways,
  searchRestaurantsNear,
  calculateTravelTimes,
  getPlaceDetails
} from './services/googleMaps';

declare var google: any;

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  const [state, setState] = useState<AppState>({
    step: 'API_KEY',
    mapsApiKey: '',
    locationA: { address: '', coords: null, label: 'Person A' },
    locationB: { address: '', coords: null, label: 'Person B' },
    region: 'ANYWHERE',
    selectedCuisines: [],
    priceRange: [2, 3],
    timing: 'now',
    results: [],
    midpoint: null,
    error: null,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Initialize Maps when API Key provided
  const handleApiKeySubmit = async (key: string) => {
    try {
      await loadGoogleMapsScript(key);
      setState(prev => ({ ...prev, mapsApiKey: key, step: 'INPUT' }));
    } catch (e) {
      alert("Invalid API Key or Script Load Error");
    }
  };

  // Initialize Map View when element is ready and key is present
  useEffect(() => {
    if (state.step === 'INPUT' && mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = initServices(mapRef.current);
    }
  }, [state.step]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const handleStartOver = () => {
    clearMarkers();
    setSelectedRestaurantId(null);
    setState(prev => ({
      ...prev,
      step: 'INPUT',
      locationA: { ...prev.locationA, address: '', coords: null },
      locationB: { ...prev.locationB, address: '', coords: null },
      region: 'ANYWHERE',
      selectedCuisines: [],
      priceRange: [2, 3],
      results: [],
      midpoint: null,
      error: null
    }));
    // Reset map view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(12);
      mapInstanceRef.current.setCenter({ lat: 40.7128, lng: -74.0060 });
    }
  };

  const handleSearch = async () => {
    if (!state.locationA.address || !state.locationB.address) return;
    setIsSearching(true);
    clearMarkers();
    setState(prev => ({ ...prev, error: null }));

    try {
      // 1. Geocode Users
      const coordsA = await geocodeAddress(state.locationA.address);
      const coordsB = await geocodeAddress(state.locationB.address);

      // Update state with confirmed coords
      setState(prev => ({
        ...prev,
        locationA: { ...prev.locationA, coords: coordsA },
        locationB: { ...prev.locationB, coords: coordsB }
      }));

      // 2. Determine Search Center
      let searchCenter: any;
      let midpoint: any;

      if (state.region !== 'ANYWHERE') {
        // Geocode the region/neighborhood
        midpoint = await geocodeAddress(state.region);
        searchCenter = midpoint;
      } else {
        // Calculate Midpoint
        midpoint = getGeographicMidpoint(coordsA, coordsB);
        // Find Subways near midpoint for "Anywhere" logic to ensure accessibility
        const subways = await searchNearbySubways(midpoint);
        searchCenter = subways.length > 0 ? { lat: subways[0].geometry!.location!.lat(), lng: subways[0].geometry!.location!.lng() } : midpoint;
      }

      // 3. Find Restaurants
      const minPrice = state.priceRange.length > 0 ? Math.min(...state.priceRange) : 1;
      const maxPrice = state.priceRange.length > 0 ? Math.max(...state.priceRange) : 4;
      
      const restaurants = await searchRestaurantsNear(
        searchCenter, 
        state.selectedCuisines, 
        minPrice, 
        maxPrice
      );

      // 4. Filter top 10 (Increased from 7)
      const topRestaurants = restaurants.slice(0, 10);

      // 5. Calculate Times
      const enrichedResults = await calculateTravelTimes(coordsA, coordsB, topRestaurants);

      setState(prev => ({
        ...prev,
        step: 'RESULTS',
        results: enrichedResults,
        midpoint: midpoint
      }));

      // 6. Render Markers
      renderMapMarkers(coordsA, coordsB, enrichedResults);

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, error: err.message || "Search failed" }));
    } finally {
      setIsSearching(false);
    }
  };

  const renderMapMarkers = (
    startA: any, 
    startB: any, 
    restaurants: Restaurant[]
  ) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Start A
    const markerA = new google.maps.Marker({
      position: startA,
      map: map,
      label: { text: "A", color: "white", fontWeight: "bold" },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#E67E22", // Orange
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      title: "Person A"
    });
    bounds.extend(startA);
    markersRef.current.push(markerA);

    // Start B
    const markerB = new google.maps.Marker({
      position: startB,
      map: map,
      label: { text: "B", color: "white", fontWeight: "bold" },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#2980B9", // Blue
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      title: "Person B"
    });
    bounds.extend(startB);
    markersRef.current.push(markerB);

    // Restaurants
    restaurants.forEach((r, idx) => {
      const pos = r.geometry.location;
      // Using simple pin
      const marker = new google.maps.Marker({
        position: pos,
        map: map,
        label: { text: (idx + 1).toString(), color: "#FFFFFF", fontSize: "12px", fontWeight: "bold" },
        // Default Google Marker is fine, or simple colored one.
        // Let's use standard default marker to keep it clean on white map, 
        // or a simple custom one to match the "Clean White" aesthetic.
        // Default red pin is readable.
        title: r.name,
        animation: google.maps.Animation.DROP
      });
      
      marker.addListener('click', () => {
        handleSelectRestaurant(r.place_id);
      });

      bounds.extend(pos);
      markersRef.current.push(marker);
    });

    map.fitBounds(bounds);
  };

  const handleSelectRestaurant = async (id: string) => {
    setSelectedRestaurantId(id);
    const index = state.results.findIndex(res => res.place_id === id);
    if (index === -1) return;
    
    const r = state.results[index];

    // Pan map
    if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(r.geometry.location);
        mapInstanceRef.current.setZoom(16);
    }

    // Fetch details if not loaded
    if (!r.detailsLoaded) {
      try {
        const details = await getPlaceDetails(r.place_id);
        const updatedResults = [...state.results];
        updatedResults[index] = { ...r, ...details, detailsLoaded: true };
        setState(prev => ({ ...prev, results: updatedResults }));
      } catch (e) {
        console.error("Failed to fetch details", e);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col md:flex-row relative">
      {state.step === 'API_KEY' && <ApiKeyModal onSubmit={handleApiKeySubmit} />}
      
      {/* Sidebar / Controls */}
      <Sidebar 
        step={state.step}
        locationA={state.locationA}
        locationB={state.locationB}
        setLocationA={(l) => setState(prev => ({ ...prev, locationA: l }))}
        setLocationB={(l) => setState(prev => ({ ...prev, locationB: l }))}
        region={state.region}
        setRegion={(r) => setState(prev => ({ ...prev, region: r }))}
        selectedCuisines={state.selectedCuisines}
        setSelectedCuisines={(c) => setState(prev => ({ ...prev, selectedCuisines: c }))}
        priceRange={state.priceRange}
        setPriceRange={(p) => setState(prev => ({ ...prev, priceRange: p }))}
        onSearch={handleSearch}
        results={state.results}
        isSearching={isSearching}
        onSelectRestaurant={handleSelectRestaurant}
        selectedRestaurantId={selectedRestaurantId}
        onStartOver={handleStartOver}
      />

      {/* Map Area */}
      <div className="flex-1 relative bg-white">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Mobile Toggle or Overlays could go here */}
        {state.error && (
            <div className="absolute top-4 left-4 right-4 bg-[#E74C3C] text-white px-4 py-3 rounded-xl z-10 shadow-lg">
                {state.error}
            </div>
        )}
      </div>
    </div>
  );
};

export default App;