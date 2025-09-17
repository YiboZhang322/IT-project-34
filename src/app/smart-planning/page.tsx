'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { useToastContext } from '@/contexts/ToastContext';
import { useFavorites } from '@/hooks/useFavorites';

interface TripData {
  destination: string;
  toDestination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  hasElderly: boolean;
  budgetType: 'economy' | 'comfortable' | 'luxury' | '';
  totalCost: string;
  foodPreference: string;
  specialNotes: string;
}

export default function SmartPlanningPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { info, error } = useToastContext();
  const router = useRouter();
  const { favorites, isLoading: favoritesLoading, removeFromFavorites, processingItems } = useFavorites();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleLogout = () => {
    logout();
    info('Logged out', 'You have been successfully logged out.');
  };

  // Load trip data from localStorage
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

  // Clear all data functionality
  const clearAllData = () => {
    localStorage.removeItem('tripData');
    setTripData(null);
    setGeneratedPlan(null);
    info('Data Cleared', 'All trip data has been cleared. You can start fresh!');
  };

  const isTripDataComplete = () => {
    if (!tripData) return false;
    return tripData.destination && 
           tripData.departureDate && 
           tripData.returnDate && 
           tripData.adults > 0 && 
           tripData.budgetType && 
           tripData.totalCost;
  };

  const calculateTripProgress = () => {
    if (!tripData) return 0;
    
    let completedSections = 0;
    const totalSections = 3;
    
    // Section 1: Details (destination, dates, transportation)
    if (tripData.destination && tripData.departureDate && tripData.returnDate && tripData.toDestination) {
      completedSections++;
    }
    
    // Section 2: Group (adults, children, elderly)
    if (tripData.adults > 0) {
      completedSections++;
    }
    
    // Section 3: Choice (budget, food preference, special notes)
    if (tripData.budgetType && tripData.totalCost) {
      completedSections++;
    }
    
    return Math.round((completedSections / totalSections) * 100);
  };

  const getCompletionStatus = () => {
    const tripComplete = isTripDataComplete();
    const attractionsSelected = favorites.length > 0;
    const tripProgress = calculateTripProgress();
    
    return {
      tripComplete,
      attractionsSelected,
      allComplete: tripComplete && attractionsSelected,
      tripProgress,
      attractionsProgress: attractionsSelected ? 100 : 0
    };
  };

  const getTripProgressText = (progress: number) => {
    if (!tripData) return 'Start by filling in your trip details';
    
    switch (progress) {
      case 0:
        return 'Fill in destination, dates, and transportation';
      case 33:
        return 'Complete group information (adults, children)';
      case 66:
        return 'Set your budget and preferences';
      case 100:
        return 'Complete';
      default:
        return 'Complete all three sections';
    }
  };

  const generateSmartPlan = async () => {
    const status = getCompletionStatus();
    
    if (!status.allComplete) {
      if (!status.tripComplete && !status.attractionsSelected) {
        error('Missing Information', 'Please complete your trip details and select some attractions first.');
      } else if (!status.tripComplete) {
        error('Missing Trip Details', 'Please complete your trip planning information first.');
      } else {
        error('No Attractions Selected', 'Please select some attractions from the guidebook first.');
      }
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI planning process
    setTimeout(() => {
      if (!tripData) return;
      
      const plan = {
        id: Date.now().toString(),
        title: `${tripData.destination} Adventure`,
        duration: calculateDuration(tripData.departureDate, tripData.returnDate),
        attractions: favorites,
        itinerary: generateItinerary(favorites, tripData),
        totalCost: tripData.totalCost,
        budgetType: tripData.budgetType,
        createdAt: new Date().toISOString()
      };
      
      setGeneratedPlan(plan);
      setIsGenerating(false);
      info('Plan Generated!', 'Your personalized trip plan is ready!');
      
      // Scroll to the generated plan section after a short delay
      setTimeout(() => {
        const planElement = document.getElementById('generated-plan');
        if (planElement) {
          planElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }, 3000);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 1;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const generateItinerary = (attractions: any[], tripData: TripData) => {
    const days = calculateDuration(tripData.departureDate, tripData.returnDate);
    const attractionsPerDay = Math.ceil(attractions.length / days);
    const itinerary = [];

    for (let day = 1; day <= days; day++) {
      const dayAttractions = attractions.slice(
        (day - 1) * attractionsPerDay,
        day * attractionsPerDay
      );
      
      itinerary.push({
        day,
        date: new Date(new Date(tripData.departureDate).getTime() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        attractions: dayAttractions,
        activities: [
          { time: '9:00 AM', activity: 'Breakfast at Hotel', location: 'Hotel' },
          ...dayAttractions.map((attraction, index) => ({
            time: `${10 + index * 2}:00 ${index % 2 === 0 ? 'AM' : 'PM'}`,
            activity: `Visit ${attraction.name}`,
            location: attraction.name
          })),
          { time: '7:00 PM', activity: 'Dinner', location: 'Local Restaurant' }
        ]
      });
    }

    return itinerary;
  };

  const renderProgressIndicator = () => {
    const status = getCompletionStatus();
    
    return (
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Planning Progress
        </h2>
        
        <div className="space-y-6">
          {/* Trip Planning Progress */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              status.tripComplete ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {status.tripComplete ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Trip Planning Details</h3>
                <span className="text-sm text-gray-600">{status.tripProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    status.tripComplete ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${status.tripProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {status.tripComplete ? 'Complete' : getTripProgressText(status.tripProgress)}
              </p>
            </div>
          </div>

          {/* Attractions Selection Progress */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              status.attractionsSelected ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {status.attractionsSelected ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Attractions Selection</h3>
                <span className="text-sm text-gray-600">{status.attractionsProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    status.attractionsSelected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${status.attractionsProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {status.attractionsSelected ? `${favorites.length} attractions selected` : 'Select attractions from guidebook'}
              </p>
            </div>
          </div>
        </div>

        {status.allComplete && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-semibold">Ready to generate your smart itinerary!</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTripSummary = () => (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Trip Summary
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Destination</h3>
          <p className="text-blue-700">{tripData?.destination || 'Not specified'}</p>
        </div>
        
        <div className="bg-green-50 rounded-xl p-4">
          <h3 className="font-semibold text-green-900 mb-2">Duration</h3>
          <p className="text-green-700">
            {tripData?.departureDate && tripData?.returnDate 
              ? `${calculateDuration(tripData.departureDate, tripData.returnDate)} days`
              : 'Not specified'
            }
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Group Size</h3>
          <p className="text-purple-700">
            {tripData ? `${tripData.adults} adults${tripData.children > 0 ? `, ${tripData.children} children` : ''}` : 'Not specified'}
          </p>
        </div>
        
        <div className="bg-orange-50 rounded-xl p-4">
          <h3 className="font-semibold text-orange-900 mb-2">Budget</h3>
          <p className="text-orange-700">{tripData?.budgetType || 'Not specified'}</p>
        </div>
        
        <div className="bg-red-50 rounded-xl p-4">
          <h3 className="font-semibold text-red-900 mb-2">Selected Attractions</h3>
          <p className="text-red-700">{favorites.length} attractions</p>
        </div>
        
        <div className="bg-indigo-50 rounded-xl p-4">
          <h3 className="font-semibold text-indigo-900 mb-2">Transportation</h3>
          <p className="text-indigo-700">{tripData?.toDestination || 'Not specified'}</p>
        </div>
      </div>
    </div>
  );

  const renderFavoritesPreview = () => (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        Your Selected Attractions ({favorites.length})
      </h2>
      
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.slice(0, 6).map((attraction) => (
            <div key={attraction.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3 group hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={attraction.image}
                  alt={attraction.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{attraction.name}</h3>
                <p className="text-gray-600 text-xs truncate">{attraction.city}</p>
              </div>
              <button
                onClick={() => removeFromFavorites(attraction.id)}
                disabled={processingItems.has(attraction.id)}
                className={`flex-shrink-0 p-1 transition-colors opacity-0 group-hover:opacity-100 ${
                  processingItems.has(attraction.id)
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                title={processingItems.has(attraction.id) ? "Removing..." : "Remove from favorites"}
              >
                {processingItems.has(attraction.id) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
          {favorites.length > 6 && (
            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center">
              <span className="text-gray-600 font-medium">+{favorites.length - 6} more</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No attractions selected yet</p>
          <Link 
            href="/guidebook"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Browse Attractions
          </Link>
        </div>
      )}
    </div>
  );

  const renderGeneratedPlan = () => (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your Personalized Trip Plan
        </h2>
        <button 
          onClick={() => setGeneratedPlan(null)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {generatedPlan?.itinerary.map((day: any) => (
          <div key={day.day} className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-3">
              {day.activities.map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-4 bg-white rounded-lg p-3">
                  <div className="w-16 text-sm font-semibold text-blue-600 flex-shrink-0">
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.activity}</p>
                    <p className="text-sm text-gray-600">{activity.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Plan
        </button>
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share Plan
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <header className="w-full bg-black text-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-8">
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
            <Link href="/smart-planning" className="text-orange-400 font-medium text-lg tracking-wide">MY PLANS</Link>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Trip Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let us create your perfect itinerary based on your preferences and selected attractions
          </p>
          
          {/* Clear data button */}
          {(tripData || favorites.length > 0) && (
            <div className="mt-6">
              <button
                onClick={clearAllData}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear all data and start fresh
              </button>
            </div>
          )}
        </div>

        {!generatedPlan ? (
          <>
            {renderProgressIndicator()}
            {renderTripSummary()}
            {renderFavoritesPreview()}
            
            <div className="text-center">
              <button
                onClick={generateSmartPlan}
                disabled={!getCompletionStatus().allComplete || isGenerating}
                className={`px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
                  !getCompletionStatus().allComplete || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Generating Your Plan...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Smart Itinerary
                  </div>
                )}
              </button>
              
              {!getCompletionStatus().allComplete && (
                <div className="mt-6 text-center">
                  <p className="text-gray-600 mb-4">
                    {!getCompletionStatus().tripComplete && !getCompletionStatus().attractionsSelected
                      ? 'Please complete both your trip details and select some attractions first.'
                      : !getCompletionStatus().tripComplete 
                        ? 'Please complete your trip planning details first.'
                        : 'Please select some attractions from the guidebook first.'
                    }
                  </p>
                  <div className="flex gap-4 justify-center">
                    {!getCompletionStatus().tripComplete && (
                      <Link 
                        href="/trip-planner"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Complete Trip Details
                      </Link>
                    )}
                    {!getCompletionStatus().attractionsSelected && (
                      <Link 
                        href="/guidebook"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Browse Attractions
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div id="generated-plan">
            {renderGeneratedPlan()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-black text-white mt-16">
        <div className="max-w-7xl mx-auto px-8 py-12 border-t border-gray-800/50">
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
