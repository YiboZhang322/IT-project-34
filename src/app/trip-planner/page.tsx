'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { useToastContext } from '@/contexts/ToastContext';

type TabType = 'details' | 'group' | 'choice';

interface TripData {
  // Details
  destination: string;
  toDestination: string;
  departureDate: string;
  returnDate: string;
  
  // Group
  adults: number;
  children: number;
  hasElderly: boolean;
  
  // Choice
  budgetType: 'economy' | 'comfortable' | 'luxury' | '';
  totalCost: string;
  foodPreference: string;
  specialNotes: string;
}

export default function TripPlanner() {
  const { user, isAuthenticated, logout } = useAuth();
  const { info } = useToastContext();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    toDestination: '',
    departureDate: '',
    returnDate: '',
    adults: 0,
    children: -1,
    hasElderly: false,
    budgetType: '',
    totalCost: '',
    foodPreference: '',
    specialNotes: ''
  });

  const handleLogout = () => {
    logout();
    info('Logged out', 'You have been successfully logged out.');
  };

  // Load saved data from localStorage
  useEffect(() => {
    const savedTripData = localStorage.getItem('tripData');
    if (savedTripData) {
      try {
        const parsedData = JSON.parse(savedTripData);
        setTripData(parsedData);
      } catch (error) {
        console.error('Error loading saved trip data:', error);
      }
    }
  }, []);

  const updateTripData = (updates: Partial<TripData>) => {
    const newData = { ...tripData, ...updates };
    setTripData(newData);
    
    // Auto-save to localStorage
    localStorage.setItem('tripData', JSON.stringify(newData));
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Destination</label>
          <input 
            type="text" 
            value={tripData.destination}
            onChange={(e) => updateTripData({ destination: e.target.value })}
            placeholder="Enter your destination"
            className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 placeholder-gray-600 font-medium shadow-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">To Destination</label>
          <select 
            value={tripData.toDestination}
            onChange={(e) => updateTripData({ toDestination: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
          >
            <option value="">Select transportation</option>
            <option value="Flight">Flight</option>
            <option value="Train">Train</option>
            <option value="Car">Car</option>
            <option value="Bus">Bus</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Departure Date</label>
          <div className="space-y-2">
            {/* HTML5 Date Picker */}
            <input 
              type="date" 
              value={tripData.departureDate}
              onChange={(e) => updateTripData({ departureDate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateTripData({ departureDate: new Date().toISOString().split('T')[0] })}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => updateTripData({ departureDate: '' })}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-semibold shadow-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Return Date</label>
          <div className="space-y-2">
            <input 
              type="date" 
              value={tripData.returnDate}
              onChange={(e) => updateTripData({ returnDate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateTripData({ returnDate: new Date().toISOString().split('T')[0] })}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => updateTripData({ returnDate: '' })}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-semibold shadow-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGroupTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Adults</label>
          <select 
            value={tripData.adults === 0 ? '' : tripData.adults}
            onChange={(e) => updateTripData({ adults: parseInt(e.target.value) || 0 })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
          >
            <option value="">Select adults</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Children</label>
          <select 
            value={tripData.children === -1 ? '' : tripData.children}
            onChange={(e) => updateTripData({ children: e.target.value === '' ? -1 : parseInt(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
          >
            <option value="">Select children</option>
            {[0, 1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="elderly"
          checked={tripData.hasElderly}
          onChange={(e) => updateTripData({ hasElderly: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-white border border-gray-300 rounded focus:ring-blue-500/50 focus:ring-2 shadow-sm hover:border-gray-400 transition-all duration-200"
        />
        <label htmlFor="elderly" className="text-sm font-bold text-gray-900">
          Anyone elderly in your group?
        </label>
      </div>
    </div>
  );

  const renderChoiceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Budget Type</label>
        <div className="flex space-x-4">
          {[
            { key: 'economy', label: 'Economy' },
            { key: 'comfortable', label: 'Comfortable' },
            { key: 'luxury', label: 'Luxury' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => updateTripData({ budgetType: key as any })}
              className={`px-6 py-3 rounded-xl border font-medium transition-all duration-200 ${
                tripData.budgetType === key
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600 font-semibold shadow-sm hover:shadow-md transition-all duration-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Total Cost</label>
          <select 
            value={tripData.totalCost}
            onChange={(e) => updateTripData({ totalCost: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
          >
            <option value="">Select budget range</option>
            <option value="500 - 1000 $">$ 500 - 1000</option>
            <option value="1000 - 1500 $">$ 1000 - 1500</option>
            <option value="1500 - 2000 $">$ 1500 - 2000</option>
            <option value="2000 - 2500 $">$ 2000 - 2500</option>
            <option value="2500 - 3000 $">$ 2500 - 3000</option>
            <option value="3000+ $">$ 3000+</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Food Preference</label>
          <select 
            value={tripData.foodPreference}
            onChange={(e) => updateTripData({ foodPreference: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200"
          >
            <option value="">Select food preference</option>
            <option value="No Preference">No Preference</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Seafood">Seafood</option>
            <option value="Low-Fat">Low-Fat</option>
            <option value="Kosher">Kosher</option>
            <option value="Gluten-Free">Gluten-Free</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2 font-bold">Special Notes</label>
        <textarea
          value={tripData.specialNotes}
          onChange={(e) => updateTripData({ specialNotes: e.target.value })}
          placeholder="Dietary restrictions, accessibility needs, special requests..."
          rows={4}
          maxLength={200}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none bg-white text-gray-900 font-medium shadow-sm hover:border-gray-400 transition-all duration-200 resize-none"
        />
                  <div className="text-sm text-gray-700 mt-1 font-medium">
            {tripData.specialNotes.length}/200 Characters
          </div>
      </div>
    </div>
  );

  const handleStartPlanning = () => {
    // Navigate to smart planning page
    window.location.href = '/smart-planning';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center px-8 py-8">
        <div className="flex items-center gap-4">
          <Image
            src="/Logo.png"
            alt="GoPlanner Logo"
            width={180}
            height={60}
            className="object-contain brightness-125 contrast-125 drop-shadow-lg"
            style={{ filter: 'brightness(1.5) contrast(1.4) saturate(1.3) hue-rotate(-10deg)' }}
          />
        </div>
        
                  <nav className="flex items-center gap-10">
            <Link href="/" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">HOME</Link>
            <Link href="/guidebook" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">ATTRACTIONS</Link>
            <Link href="/smart-planning" className="text-white hover:text-orange-400 transition-all duration-200 font-medium text-lg tracking-wide hover:scale-105">MY PLANS</Link>
          </nav>
        
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
                      <Link href="/login">
              <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:from-purple-800 active:to-purple-900 text-white px-8 py-3 rounded-full transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                LOGIN
              </button>
            </Link>
        )}
      </header>

      {/* Main Content */}
      <div className="relative min-h-[80vh] flex items-center justify-center p-6">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/Sydney-Opera.jpg')"
          }}
        />
        
        <div className="relative z-10 w-full max-w-4xl">
          {/* Trip Planning Form */}
          <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 p-10 border border-white/60 ring-1 ring-black/5">
            {/* Tab Navigation */}
            <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-xl mb-8 p-1 shadow-inner">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 px-6 text-center font-medium rounded-lg transition-all duration-300 ${
                  activeTab === 'details'
                    ? 'bg-white text-gray-900 shadow-lg shadow-black/10 scale-[0.98]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Details
                </div>
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`flex-1 py-3 px-6 text-center font-medium rounded-lg transition-all duration-300 mx-1 ${
                  activeTab === 'group'
                    ? 'bg-white text-gray-900 shadow-lg shadow-black/10 scale-[0.98]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Group
                </div>
              </button>
              <button
                onClick={() => setActiveTab('choice')}
                className={`flex-1 py-3 px-6 text-center font-medium rounded-lg transition-all duration-300 ${
                  activeTab === 'choice'
                    ? 'bg-white text-gray-900 shadow-lg shadow-black/10 scale-[0.98]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Choice
                </div>
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'details' && renderDetailsTab()}
              {activeTab === 'group' && renderGroupTab()}
              {activeTab === 'choice' && renderChoiceTab()}
            </div>
            
            {/* Navigation Button */}
            {activeTab === 'details' && (
              <button 
                onClick={() => setActiveTab('group')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
              >
                Next
              </button>
            )}
            
            {activeTab === 'group' && (
              <button 
                onClick={() => setActiveTab('choice')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
              >
                Next
              </button>
            )}
            
            {activeTab === 'choice' && (
              <button 
                onClick={handleStartPlanning}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
              >
                Start Planning
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-8 border-t border-gray-800/50">
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
                <span className="text-lg font-semibold text-gray-300">f</span>
              </button>
              <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                <span className="text-lg font-semibold text-gray-300">t</span>
              </button>
              <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50">
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6 text-gray-500 text-sm font-medium">
          © 2025 GoPlanner - by Group 34
        </div>
      </footer>
    </div>
  );
}
