import React from 'react';
import { MapPin, Search, Clock, Utensils, DollarSign, Navigation, Globe, Phone, ExternalLink, ChevronDown } from 'lucide-react';
import { UserLocation, CUISINE_OPTIONS, Restaurant, REGION_OPTIONS } from '../types';

interface SidebarProps {
  step: string;
  locationA: UserLocation;
  locationB: UserLocation;
  setLocationA: (loc: UserLocation) => void;
  setLocationB: (loc: UserLocation) => void;
  region: string;
  setRegion: (r: string) => void;
  selectedCuisines: string[];
  setSelectedCuisines: (c: string[]) => void;
  priceRange: number[];
  setPriceRange: (p: number[]) => void;
  onSearch: () => void;
  results: Restaurant[];
  isSearching: boolean;
  onSelectRestaurant: (id: string) => void;
  selectedRestaurantId: string | null;
  onStartOver: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  step,
  locationA,
  locationB,
  setLocationA,
  setLocationB,
  region,
  setRegion,
  selectedCuisines,
  setSelectedCuisines,
  priceRange,
  setPriceRange,
  onSearch,
  results,
  isSearching,
  onSelectRestaurant,
  selectedRestaurantId,
  onStartOver
}) => {
  
  const toggleCuisine = (c: string) => {
    if (selectedCuisines.includes(c)) {
      setSelectedCuisines(selectedCuisines.filter(item => item !== c));
    } else {
      setSelectedCuisines([...selectedCuisines, c]);
    }
  };

  const togglePrice = (p: number) => {
    if (priceRange.includes(p)) {
      setPriceRange(priceRange.filter(item => item !== p));
    } else {
      setPriceRange([...priceRange, p]);
    }
  };

  const openXiaohongshu = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedName = encodeURIComponent(`${name} NYC`);
    window.open(`https://www.xiaohongshu.com/search_result?keyword=${encodedName}`, '_blank');
  };

  const getHoursStatus = (r: Restaurant) => {
    if (!r.opening_hours || !r.opening_hours.periods) {
      return { 
        status: "Hours unavailable", 
        color: "text-gray-400", 
        fullString: null 
      };
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Get today's periods (Google Maps uses 0 for Sunday)
    const todayPeriods = r.opening_hours.periods.filter((p: any) => p.open.day === dayOfWeek);

    let isOpen = false;
    let nextTime = "";
    
    // Check if open now
    for (const period of todayPeriods) {
      const openTime = parseInt(period.open.time);
      const closeTime = period.close ? parseInt(period.close.time) : 2359;
      // Handle closing past midnight (e.g. close 0200 next day) - Google API handles this by next day usually,
      // but simplistic check here:
      if (currentTime >= openTime && currentTime <= closeTime) {
        isOpen = true;
        break;
      }
    }

    // Get display string for today
    // weekday_text is usually ordered Mon-Sun. We need to map dayOfWeek (0=Sun) to index.
    // 0(Sun) -> 6, 1(Mon) -> 0...
    const mapIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const todayString = r.opening_hours.weekday_text ? r.opening_hours.weekday_text[mapIndex] : "";
    const timeOnly = todayString.split(': ').slice(1).join(': ');

    return {
      status: isOpen ? "Open" : "Closed",
      color: isOpen ? "text-[#2ECC71]" : "text-[#E74C3C]",
      fullString: timeOnly
    };
  };

  return (
    <div className="w-full md:w-[450px] bg-white h-full shadow-[2px_0_24px_rgba(0,0,0,0.06)] z-20 flex flex-col overflow-hidden border-r border-[#ECF0F1]">
      
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0 border-b border-[#ECF0F1]">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-[#2C3E50]">
          Halfway
        </h1>
        <p className="text-[#7F8C8D] text-sm mt-1">Find the fair middle ground.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-hide">
        {step === 'INPUT' || step === 'SEARCHING' ? (
          <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Locations */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-[#95A5A6] font-bold flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Starting Locations
              </h2>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E67E22]"></div>
                  <input
                    type="text"
                    placeholder="Enter Location A (e.g. 350 5th Ave)"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#ECF0F1] shadow-sm rounded-xl focus:ring-2 focus:ring-[#E67E22] focus:border-[#E67E22] focus:outline-none transition text-sm text-[#2C3E50] placeholder:text-[#BDC3C7]"
                    value={locationA.address}
                    onChange={(e) => setLocationA({ ...locationA, address: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#2980B9]"></div>
                  <input
                    type="text"
                    placeholder="Enter Location B (e.g. Brooklyn Museum)"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#ECF0F1] shadow-sm rounded-xl focus:ring-2 focus:ring-[#2980B9] focus:border-[#2980B9] focus:outline-none transition text-sm text-[#2C3E50] placeholder:text-[#BDC3C7]"
                    value={locationB.address}
                    onChange={(e) => setLocationB({ ...locationB, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Region Filter */}
            <div className="space-y-4">
               <h2 className="text-xs uppercase tracking-widest text-[#95A5A6] font-bold flex items-center gap-2">
                <Navigation className="w-3 h-3" /> Preferred Region
              </h2>
              <div className="relative">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full pl-5 pr-10 py-3 bg-white border border-[#ECF0F1] shadow-sm rounded-xl focus:ring-2 focus:ring-[#E67E22] focus:border-[#E67E22] appearance-none text-sm text-[#2C3E50] outline-none cursor-pointer"
                >
                  {REGION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDC3C7] pointer-events-none" />
              </div>
            </div>

            {/* Cuisines */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-[#95A5A6] font-bold flex items-center gap-2">
                <Utensils className="w-3 h-3" /> Cuisine
              </h2>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleCuisine(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                      selectedCuisines.includes(c)
                        ? 'bg-[#E67E22] text-white border-[#E67E22] shadow-md'
                        : 'bg-white text-[#7F8C8D] border-[#ECF0F1] hover:border-[#BDC3C7] hover:text-[#2C3E50]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest text-[#95A5A6] font-bold flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Price Range
              </h2>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    onClick={() => togglePrice(p)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      priceRange.includes(p)
                        ? 'bg-[#2C3E50] text-white border-[#2C3E50] shadow-md'
                        : 'bg-white text-[#7F8C8D] border-[#ECF0F1] hover:border-[#BDC3C7]'
                    }`}
                  >
                    {Array(p).fill('$').join('')}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={onSearch}
              disabled={isSearching || !locationA.address || !locationB.address}
              className="w-full bg-[#E67E22] hover:bg-[#D35400] disabled:bg-[#BDC3C7] disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-[#E67E22]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4"
            >
              {isSearching ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Finding Midpoint...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" /> Find Meeting Spot
                </>
              )}
            </button>
          </div>
        ) : (
          /* Results List */
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300 pb-10">
             <button 
                onClick={onStartOver}
                className="text-xs text-[#E67E22] font-bold hover:underline mb-2 flex items-center gap-1 uppercase tracking-wide"
             >
               ← Start Over
             </button>

             <h2 className="text-xl font-bold text-[#2C3E50]">Top Suggestions</h2>
             
             {results.map((r, idx) => {
               const hours = getHoursStatus(r);
               return (
               <div 
                 key={r.place_id}
                 className={`group rounded-2xl transition-all duration-200 border ${
                   selectedRestaurantId === r.place_id 
                    ? 'bg-white border-[#E67E22] shadow-md scale-[1.01]' 
                    : 'bg-white border-[#ECF0F1] hover:border-[#BDC3C7] hover:shadow-sm'
                 }`}
               >
                 {/* Card Header (Always Visible) */}
                 <div 
                   onClick={() => onSelectRestaurant(r.place_id)}
                   className="p-5 cursor-pointer"
                 >
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex-1 min-w-0 pr-4">
                       <div className="flex items-center gap-2 mb-1 flex-wrap">
                         <h3 className="font-bold text-[#2C3E50] text-lg leading-tight truncate">{r.name}</h3>
                         {r.cuisineType && (
                           <span className="text-[12px] font-medium text-[#E67E22] bg-[#E67E22]/10 px-2.5 py-1 rounded-xl whitespace-nowrap">
                             {r.cuisineType}
                           </span>
                         )}
                       </div>
                       <p className="text-sm text-[#7F8C8D] truncate">{r.vicinity}</p>
                     </div>
                     <div className="text-right flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F8F9FA] text-[#2C3E50] text-sm font-bold border border-[#ECF0F1]">
                         {idx + 1}
                       </span>
                     </div>
                   </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex text-[#F1C40F] text-xs gap-0.5">
                         {'★'.repeat(Math.round(r.rating))}
                         <span className="text-[#BDC3C7]">{'★'.repeat(5 - Math.round(r.rating))}</span>
                       </div>
                       <span className="text-xs font-medium text-[#BDC3C7] tabular-nums">{Array(r.price_level).fill('$').join('')}</span>
                    </div>

                   {/* Travel Times Breakdown */}
                   <div className="mt-4 bg-[#F8F9FA] rounded-xl p-3 border border-[#ECF0F1] space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#E67E22]"></div>
                            <span className="text-xs font-medium text-[#7F8C8D]">Person A</span>
                         </div>
                         <span className="text-sm font-bold text-[#2C3E50] tabular-nums">{r.travelTimeA || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#2980B9]"></div>
                            <span className="text-xs font-medium text-[#7F8C8D]">Person B</span>
                         </div>
                         <span className="text-sm font-bold text-[#2C3E50] tabular-nums">{r.travelTimeB || 'N/A'}</span>
                      </div>
                   </div>
                  
                   {/* Fairness Indicator */}
                   <div className="mt-4 flex items-center justify-between">
                      <span className={`text-xs font-bold ${r.fairnessColor}`}>
                         {r.fairnessScore} Commute
                      </span>
                      
                      {selectedRestaurantId !== r.place_id && (
                         <span className="text-xs text-[#7F8C8D] font-medium flex items-center group-hover:text-[#2C3E50] transition-colors">
                           Details <ChevronDown className="w-3 h-3 ml-1" />
                         </span>
                      )}
                   </div>
                 </div>

                 {/* Expanded Details Panel */}
                 {selectedRestaurantId === r.place_id && (
                   <div className="border-t border-[#ECF0F1] bg-[#F8F9FA] p-5 animate-in slide-in-from-top-2">
                      
                      {/* Photos */}
                      {r.photos && r.photos.length > 0 && (
                        <div className="mb-5 flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                          {r.photos.slice(0, 3).map((photo: any, i) => (
                             <img 
                               key={i} 
                               src={photo.getUrl ? photo.getUrl({maxWidth: 400, maxHeight: 300}) : ''} 
                               alt="Restaurant" 
                               className="h-32 w-48 object-cover rounded-xl flex-shrink-0 shadow-sm border border-[#ECF0F1] snap-center"
                             />
                          ))}
                        </div>
                      )}

                      {/* Contact & Hours */}
                      <div className="space-y-3 text-sm text-[#7F8C8D] mb-6 bg-white p-4 rounded-xl border border-[#ECF0F1]">
                         <div className="flex items-start gap-3">
                             <Clock className="w-4 h-4 text-[#BDC3C7] mt-0.5" />
                             <div className="flex flex-col">
                               <span className={`font-medium ${hours.color}`}>
                                 {hours.status}
                               </span>
                               {hours.fullString && <span className="text-xs text-[#95A5A6] mt-0.5 tabular-nums">{hours.fullString}</span>}
                             </div>
                          </div>
                        {r.formatted_phone_number && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-[#BDC3C7]" />
                            <a href={`tel:${r.formatted_phone_number}`} className="hover:text-[#E67E22] transition tabular-nums">{r.formatted_phone_number}</a>
                          </div>
                        )}
                        {r.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-[#BDC3C7]" />
                            <a href={r.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#E67E22] transition truncate max-w-[250px] underline decoration-dotted underline-offset-4">
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-3">
                         {r.url && (
                           <a 
                             href={r.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center justify-center gap-2 bg-white border border-[#ECF0F1] hover:border-[#BDC3C7] text-[#2C3E50] py-3 rounded-xl text-xs font-bold transition shadow-sm"
                           >
                             <ExternalLink className="w-3 h-3" /> Google Maps
                           </a>
                         )}
                         <button 
                           onClick={(e) => openXiaohongshu(r.name, e)}
                           className="flex items-center justify-center gap-2 bg-[#FF2442] hover:bg-[#D91A35] text-white py-3 rounded-xl text-xs font-bold transition shadow-sm"
                           title="Search reviews on Little Red Book"
                         >
                           Search on 小红书
                         </button>
                      </div>
                   </div>
                 )}
               </div>
               );
             })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-[#ECF0F1] text-[10px] uppercase tracking-widest text-[#BDC3C7] text-center flex-shrink-0 bg-white">
        Designed for NYC · Powered by Google
      </div>
    </div>
  );
};

export default Sidebar;