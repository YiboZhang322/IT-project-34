'use client'

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { useToastContext } from '@/contexts/ToastContext';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useFavorites } from '@/hooks/useFavorites';
import FavoritesPanel from '@/components/FavoritesPanel';

type TabType = 'views' | 'restaurant' | 'hotel';

interface Attraction {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'Must go' | 'Popular';
  rating: number;
  lat: number;
  lng: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: -33.8688,
  lng: 151.2093
};

const supportedCities = [
  { name: 'Melbourne', path: 'melbourne', country: 'Australia' },
  { name: 'Sydney', path: 'sydney', country: 'Australia' },
  { name: 'Brisbane', path: 'brisbane', country: 'Australia' },
  { name: 'Perth', path: 'perth', country: 'Australia' },
];

export default function SydneyGuidebookPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { info } = useToastContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('views');
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('Sydney');
  const [searchError, setSearchError] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Use the favorites hook
  const { 
    favorites, 
    isLoading: favoritesLoading, 
    toggleFavorite, 
    isFavorited, 
    removeFromFavorites,
    processingItems
  } = useFavorites();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handleLogout = () => {
    logout();
    info('Logged out', 'You have been successfully logged out.');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchError(''); // Clear any previous error

    // Check if user is searching for current city
    const currentCityQuery = searchQuery.toLowerCase();
    if (currentCityQuery.includes('syd') || 'sydney'.includes(currentCityQuery)) {
      // Refresh the current page
      window.location.reload();
      return;
    }

    // Find matching city (excluding current city)
    const matchedCity = supportedCities.find(city => 
      city.path !== 'sydney' && (
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes(city.name.toLowerCase())
      )
    );

    if (matchedCity) {
      router.push(`/guidebook/${matchedCity.path}`);
    } else {
      // If no other city matches, show error message below search box
      setSearchError(`Sorry, we couldn't find "${searchQuery}"`);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (searchQuery === 'Sydney') {
      setSearchQuery('');
    }
    setSearchError(''); // Clear any error when focusing
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    if (!searchQuery.trim()) {
      setSearchQuery('Sydney');
    }
  };

  const handleAddToList = async (attraction: Attraction) => {
    const attractionData = {
      id: attraction.id,
      name: attraction.name,
      description: attraction.description,
      image: attraction.image,
      category: attraction.category,
      rating: attraction.rating,
      lat: attraction.lat,
      lng: attraction.lng,
      city: 'Sydney'
    };
    
    await toggleFavorite(attractionData);
  };

  const attractions: Attraction[] = [
    {
      id: 'sydney-1',
      name: 'Sydney Opera House',
      description: 'Iconic architectural masterpiece and UNESCO World Heritage site with distinctive shell design.',
      image: '/Sydney-Opera.jpg',
      category: 'Must go',
      rating: 5,
      lat: -33.8568,
      lng: 151.2153
    },
    {
      id: 'sydney-2',
      name: 'Sydney Harbour Bridge',
      description: 'Magnificent steel arch bridge offering spectacular harbor views and bridge climb experiences.',
      image: '/Sydney Harbour Bridge.jpg',
      category: 'Must go',
      rating: 5,
      lat: -33.8523,
      lng: 151.2108
    },
    {
      id: 'sydney-3',
      name: 'Bondi Beach',
      description: 'World-famous golden sand beach perfect for surfing, swimming, and beach culture.',
      image: '/Bondi Beach.jpg',
      category: 'Must go',
      rating: 5,
      lat: -33.8915,
      lng: 151.2767
    },
    {
      id: 'sydney-4',
      name: 'Royal Botanic Gardens',
      description: 'Stunning waterfront gardens with diverse plant collections and harbor views.',
      image: '/Royal Botanic Gardens.jpeg',
      category: 'Must go',
      rating: 5,
      lat: -33.8641,
      lng: 151.2165
    },
    {
      id: 'sydney-5',
      name: 'Darling Harbour',
      description: 'Vibrant entertainment precinct with restaurants, shops, and family attractions.',
      image: '/Darling Harbour.jpg',
      category: 'Popular',
      rating: 4,
      lat: -33.8737,
      lng: 151.2017
    },
    {
      id: 'sydney-6',
      name: 'The Rocks',
      description: 'Historic cobblestone area with weekend markets, galleries, and heritage buildings.',
      image: '/the rocks sydney.jpg',
      category: 'Popular',
      rating: 4,
      lat: -33.8587,
      lng: 151.2089
    },
    {
      id: 'sydney-7',
      name: 'Circular Quay',
      description: 'Bustling transport hub and waterfront promenade with ferry terminals and street performers.',
      image: '/Circular Quay.jpg',
      category: 'Popular',
      rating: 4,
      lat: -33.8614,
      lng: 151.2108
    },
    {
      id: 'sydney-8',
      name: 'Manly Beach',
      description: 'Beautiful northern beaches destination accessible by scenic ferry ride from Circular Quay.',
      image: '/Manly Beach.jpg',
      category: 'Popular',
      rating: 4,
      lat: -33.7969,
      lng: 151.2840
    },
    {
      id: 'sydney-9',
      name: 'Blue Mountains',
      description: 'Spectacular mountain region with dramatic cliffs, eucalyptus forests, and charming towns.',
      image: '/Blue Mountains.jpeg',
      category: 'Popular',
      rating: 4,
      lat: -33.7122,
      lng: 150.3111
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  const renderAttractionCard = (attraction: Attraction) => (
    <div key={attraction.id} className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100/50 hover:border-gray-200/50 group hover:-translate-y-1 flex flex-col h-full">
      <div className="relative">
        <div className="aspect-[4/3] relative overflow-hidden">
          <Image
            src={attraction.image}
            alt={attraction.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm ${
          attraction.category === 'Must go' ? 'bg-green-500/90' : 'bg-orange-500/90'
        }`}>
          {attraction.category}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight group-hover:text-blue-600 transition-colors">{attraction.name}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2 flex-grow">{attraction.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1">
            {renderStars(attraction.rating)}
          </div>
          <button 
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2 ${
              isFavorited(attraction.id)
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
            onClick={() => handleAddToList(attraction)}
          >
            {isFavorited(attraction.id) ? (
              'Move from List'
            ) : (
              'Add To MyList'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation Header */}
      <header className="w-full bg-black text-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/Logo.png"
                alt="GoPlanner Logo"
                width={180}
                height={60}
                className="object-contain brightness-125 contrast-125 drop-shadow-lg"
                style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
              />
            </Link>
            
            <nav className="hidden md:flex items-center gap-10">
              <Link href="/" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">
                HOME
              </Link>
              <Link href="/guidebook" className="text-orange-400 font-medium text-lg tracking-wide">
                ATTRACTIONS
              </Link>
              <Link href="/smart-planning" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">
                MY PLANS
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <UserAvatar 
                      src={user?.avatar}
                      name={user?.name || 'User'}
                      size="md"
                      showOnlineStatus={true}
                      isOnline={true}
                    />
                    <span className="text-white font-medium text-sm">Welcome, {user?.name}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white px-6 py-3 rounded-full transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <Link
                  href={`/login?returnUrl=${encodeURIComponent('/guidebook/sydney')}`}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:from-purple-800 active:to-purple-900 text-white px-8 py-3 rounded-full transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  LOGIN
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 max-w-2xl">
            <Link 
              href="/guidebook"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-200 font-medium whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Search
            </Link>
            <div className="relative flex-1">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchError(''); // Clear error when typing
                  }}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholder="Search destinations..."
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
              
              {/* Error Message */}
              {searchError && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-red-700 text-sm font-medium">{searchError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('views')}
              className={`px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 ${
                activeTab === 'views'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              Views
            </button>
            
            <button
              onClick={() => setActiveTab('restaurant')}
              className={`px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'restaurant'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Restaurant
            </button>
            
            <button
              onClick={() => setActiveTab('hotel')}
              className={`px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'hotel'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Hotel
            </button>
          </div>

          {/* Map, Favorites, and Smart Planning Buttons */}
          <div className="flex items-center gap-3">
            {/* Map Toggle Button */}
            <button
              onClick={() => setShowMap(!showMap)}
              className={`p-4 rounded-xl transition-all duration-300 ${
                showMap
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
            
            {/* Favorites Toggle Button */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`p-4 rounded-xl transition-all duration-300 relative ${
                showFavorites
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {/* Favorites count badge */}
              {favorites.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-red-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Smart Planning Button */}
            <Link href="/smart-planning">
              <button
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                  favorites.length > 0
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={favorites.length === 0}
                title={favorites.length === 0 ? 'Please select some attractions first' : 'Create your personalized trip plan'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {favorites.length > 0 ? 'Create My Trip Plan' : 'Start Planning'}
              </button>
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          {/* Map Section - Only show when map is active */}
          {showMap && (
            <div className="w-full">
              <div className={`grid gap-6 h-[600px] ${showFavorites ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                <div className={`flex flex-col ${showFavorites ? 'lg:col-span-2' : 'col-span-1'}`}>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex-1">
                    <div className="h-full w-full">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={center}
                      zoom={13}
                      onLoad={onLoad}
                      onUnmount={onUnmount}
                      options={{
                        styles: [
                          {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                          },
                          {
                            featureType: 'transit',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                          }
                        ],
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                        gestureHandling: 'cooperative'
                      }}
                    >
                      {attractions.map((attraction) => (
                        <Marker
                          key={attraction.id}
                          position={{ lat: attraction.lat, lng: attraction.lng }}
                          title={attraction.name}
                          icon={{
                            url: attraction.category === 'Must go' 
                              ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="18" cy="18" r="14" fill="#10b981" stroke="#ffffff" stroke-width="4"/>
                                  <circle cx="18" cy="18" r="7" fill="#ffffff"/>
                                </svg>
                              `)
                              : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="18" cy="18" r="14" fill="#f97316" stroke="#ffffff" stroke-width="4"/>
                                  <circle cx="18" cy="18" r="7" fill="#ffffff"/>
                                </svg>
                              `),
                            scaledSize: new window.google.maps.Size(36, 36),
                            anchor: new window.google.maps.Point(18, 18)
                          }}
                          onClick={() => {
                            console.log('Clicked attraction:', attraction.name);
                            setSelectedAttraction(attraction);
                          }}
                        />
                      ))}
                    </GoogleMap>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading interactive map...</p>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                  
                </div>
                
                {showFavorites && (
                  <div className="lg:col-span-1 flex flex-col">
                    <FavoritesPanel 
                      favorites={favorites}
                      isLoading={favoritesLoading}
                      onRemoveFavorite={removeFromFavorites}
                      processingItems={processingItems}
                    />
                  </div>
                )}
              </div>
              
              {/* Selected Attraction Info Panel - Below the map and favorites */}
              {selectedAttraction && (
                <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden">
                        <Image
                          src={selectedAttraction.image}
                          alt={selectedAttraction.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{selectedAttraction.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                          selectedAttraction.category === 'Must go' ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {selectedAttraction.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{selectedAttraction.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={`text-sm ${i < selectedAttraction.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <button 
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            isFavorited(selectedAttraction.id)
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          onClick={() => handleAddToList(selectedAttraction)}
                        >
                          {isFavorited(selectedAttraction.id) ? 'Move from List' : 'Add to MyList'}
                        </button>
                        <button 
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all duration-200"
                          onClick={() => setSelectedAttraction(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Favorites Panel - Show independently when not in map view */}
          {!showMap && showFavorites && (
            <div className="w-full">
              <div className="grid gap-6 h-[600px] grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 flex flex-col">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center flex-1 flex flex-col justify-center">
                    <div className="text-gray-400 mb-6">
                      <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Your Favorites</h3>
                    <p className="text-gray-600 leading-relaxed">View and manage your favorite attractions. Click the map button to see them on the interactive map.</p>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <FavoritesPanel 
                    favorites={favorites}
                    isLoading={favoritesLoading}
                    onRemoveFavorite={removeFromFavorites}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Attractions Grid Section */}
          <div className="w-full">
            {activeTab === 'views' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {attractions.map(renderAttractionCard)}
              </div>
            )}
            
            {activeTab === 'restaurant' && (
              <div className="text-center py-24">
                <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 max-w-md mx-auto">
                  <div className="text-gray-400 mb-6">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Restaurant Guide</h3>
                  <p className="text-gray-600 leading-relaxed">Coming soon! We're curating the best dining experiences in Sydney.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'hotel' && (
              <div className="text-center py-24">
                <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100 max-w-md mx-auto">
                  <div className="text-gray-400 mb-6">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Hotel Guide</h3>
                  <p className="text-gray-600 leading-relaxed">Coming soon! We're selecting the finest accommodations for your stay.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-black text-white">
        <div className="max-w-7xl mx-auto px-8 py-8 border-t border-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/Logo.png"
                alt="GoPlanner Logo"
                width={150}
                height={50}
                className="object-contain brightness-125 contrast-125 drop-shadow-lg"
                style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
              />
            </div>
            
            <div className="flex items-center gap-8">
              <span className="text-gray-400 font-medium">Share Trip Plan with Others</span>
              <div className="flex gap-3">
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <span className="text-lg font-semibold">f</span>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <span className="text-lg font-semibold">t</span>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6 text-gray-500 text-sm font-medium">
            © 2025 GoPlanner - by Group 34
          </div>
        </div>
      </footer>
    </div>
  );
}
