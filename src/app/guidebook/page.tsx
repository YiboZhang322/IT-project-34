'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';

const supportedCities = [
  { name: 'Melbourne', path: 'melbourne', country: 'Australia' },
  { name: 'Sydney', path: 'sydney', country: 'Australia' },
  { name: 'Brisbane', path: 'brisbane', country: 'Australia' },
  { name: 'Perth', path: 'perth', country: 'Australia' },
];

export default function GuidebookSearchPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    
    // Find matching city
    const matchedCity = supportedCities.find(city => 
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchQuery.toLowerCase().includes(city.name.toLowerCase())
    );

    setTimeout(() => {
      if (matchedCity) {
        router.push(`/guidebook/${matchedCity.path}`);
      } else {
        // No matching city found, show error message
        setIsSearching(false);
        setSearchError(`Sorry, we couldn't find "${searchQuery}".`);
      }
    }, 800);
  };

  const handleCityClick = (cityPath: string) => {
    setIsSearching(true);
    setTimeout(() => {
      router.push(`/guidebook/${cityPath}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50/80">
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
                  href={`/login?returnUrl=${encodeURIComponent('/guidebook')}`}
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-40">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo and Title */}
          <div className="mb-16">
            <Image
              src="/Logo.png"
              alt="GoPlanner Logo"
              width={120}
              height={120}
              className="mx-auto mb-8 brightness-125 contrast-125 drop-shadow-2xl"
              style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
            />
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Discover Amazing Places
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Search for destinations and explore the best attractions, restaurants, and hotels
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  console.log('Input change:', e.target.value);
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                placeholder="Search destinations..."
                className="w-full px-8 py-5 text-lg border border-gray-200 rounded-full focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:shadow-lg outline-none shadow-sm hover:shadow-md transition-all duration-200 bg-white/95 backdrop-blur-xl placeholder-gray-400 text-gray-900 hover:border-gray-300"
                disabled={isSearching}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Error Message */}
            {searchError && (
              <div className="max-w-xl mx-auto mt-4 p-4 bg-red-50/90 border border-red-100 rounded-2xl backdrop-blur-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{searchError}</p>
                </div>
              </div>
            )}
          </form>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/trip-planner">
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Plan My Trip
              </button>
            </Link>
            
            <Link href="/smart-planning">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Smart Planning
              </button>
            </Link>
          </div>
        </div>
      </main>

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