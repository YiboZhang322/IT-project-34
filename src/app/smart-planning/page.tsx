'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { useToastContext } from '@/contexts/ToastContext';
import { useFavorites } from '@/hooks/useFavorites';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface Activity {
  id: string;
  time: string;
  activity: string;
  location: string;
  type: 'breakfast' | 'attraction' | 'meal' | 'custom';
}

interface DayPlan {
  day: number;
  date: string;
  activities: Activity[];
}

type PlanningMode = 'smart' | 'custom';

export default function SmartPlanningPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { info, error } = useToastContext();
  const router = useRouter();
  const { favorites, isLoading: favoritesLoading, removeFromFavorites, processingItems } = useFavorites();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [planningMode, setPlanningMode] = useState<PlanningMode>('smart');
  const [customPlan, setCustomPlan] = useState<DayPlan[]>([]);
  const [editingActivity, setEditingActivity] = useState<{ dayIndex: number; activityIndex: number; activity: Activity } | null>(null);
  const [showAddActivityModal, setShowAddActivityModal] = useState<{ dayIndex: number } | null>(null);
  const [showEditActivityModal, setShowEditActivityModal] = useState<{ dayIndex: number; activityIndex: number; activity: Activity } | null>(null);
  const [newActivity, setNewActivity] = useState({ time: '', activity: '', location: '' });
  const [editActivity, setEditActivity] = useState({ time: '', activity: '', location: '' });
  const [showCustomPlan, setShowCustomPlan] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    setCustomPlan([]);
    setPlanningMode('smart');
    setShowCustomPlan(false);
    info('Data Cleared', 'All trip data has been cleared. You can start fresh!');
  };

  // Handle drag end for custom planning
  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCustomPlan((prevPlan) => {
        const newPlan = [...prevPlan];
        const oldIndex = newPlan[dayIndex].activities.findIndex((activity) => activity.id === active.id);
        const newIndex = newPlan[dayIndex].activities.findIndex((activity) => activity.id === over?.id);
        
        newPlan[dayIndex].activities = arrayMove(newPlan[dayIndex].activities, oldIndex, newIndex);
        return newPlan;
      });
    }
  };

  // Initialize custom plan from favorites
  const initializeCustomPlan = () => {
    if (!tripData || favorites.length === 0) return;
    
    const days = calculateDuration(tripData.departureDate, tripData.returnDate);
    const newPlan: DayPlan[] = [];

    for (let day = 1; day <= days; day++) {
      const dayAttractions = favorites.slice(
        (day - 1) * Math.ceil(favorites.length / days),
        day * Math.ceil(favorites.length / days)
      );
      
      const activities: Activity[] = [
        {
          id: `breakfast-${day}`,
          time: '9:00 AM',
          activity: 'Breakfast at Hotel',
          location: 'Hotel',
          type: 'breakfast'
        },
        ...dayAttractions.map((attraction, index) => ({
          id: `attraction-${day}-${index}`,
          time: `${10 + index * 2}:00 ${index % 2 === 0 ? 'AM' : 'PM'}`,
          activity: `Visit ${attraction.name}`,
          location: attraction.name,
          type: 'attraction' as const
        })),
        {
          id: `dinner-${day}`,
          time: '7:00 PM',
          activity: 'Dinner',
          location: 'Local Restaurant',
          type: 'meal'
        }
      ];

      newPlan.push({
        day,
        date: new Date(new Date(tripData.departureDate).getTime() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activities
      });
    }

    setCustomPlan(newPlan);
    setPlanningMode('custom');
    setShowCustomPlan(true);
    
    // Auto scroll to custom plan section after a short delay
    setTimeout(() => {
      const customPlanElement = document.getElementById('custom-plan-section');
      if (customPlanElement) {
        customPlanElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // Add custom activity
  const addCustomActivity = (dayIndex: number, activity: Omit<Activity, 'id'>) => {
    // Generate a more unique ID with performance.now() for higher precision
    const uniqueId = `custom-${performance.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.floor(Math.random() * 10000)}`;
    
    const newActivity: Activity = {
      ...activity,
      id: uniqueId
    };

    setCustomPlan((prevPlan) => {
      const newPlan = [...prevPlan];
      
      // Double check for duplicates before adding
      const existingActivity = newPlan[dayIndex].activities.find(
        act => act.time === newActivity.time && 
               act.activity === newActivity.activity && 
               act.location === newActivity.location
      );
      
      if (!existingActivity) {
        newPlan[dayIndex].activities.push(newActivity);
      }
      
      return newPlan;
    });
  };

  // Update activity
  const updateActivity = (dayIndex: number, activityIndex: number, updatedActivity: Activity) => {
    setCustomPlan((prevPlan) => {
      const newPlan = [...prevPlan];
      newPlan[dayIndex].activities[activityIndex] = updatedActivity;
      return newPlan;
    });
  };

  // Delete activity
  const deleteActivity = (dayIndex: number, activityIndex: number) => {
    setCustomPlan((prevPlan) => {
      const newPlan = [...prevPlan];
      newPlan[dayIndex].activities.splice(activityIndex, 1);
      return newPlan;
    });
  };

  // Handle add activity modal
  const handleAddActivity = (dayIndex: number) => {
    setShowAddActivityModal({ dayIndex });
    setNewActivity({ time: '', activity: '', location: '' });
  };

  const handleSaveActivity = async () => {
    if (isAddingActivity || !showAddActivityModal || !newActivity.time || !newActivity.activity || !newActivity.location) {
      return;
    }
    
    setIsAddingActivity(true);
    
    try {
      // Prevent duplicate submissions
      const dayIndex = showAddActivityModal.dayIndex;
      
      // Additional check: verify no duplicate activity exists in the current day
      const currentDayActivities = customPlan[dayIndex]?.activities || [];
      const isDuplicate = currentDayActivities.some(activity => 
        activity.time === newActivity.time && 
        activity.activity === newActivity.activity && 
        activity.location === newActivity.location
      );
      
      if (!isDuplicate) {
        addCustomActivity(dayIndex, {
          time: newActivity.time,
          activity: newActivity.activity,
          location: newActivity.location,
          type: 'custom'
        });
      }
      
      // Clear modal and form immediately
      setShowAddActivityModal(null);
      setNewActivity({ time: '', activity: '', location: '' });
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleCancelActivity = () => {
    setShowAddActivityModal(null);
    setNewActivity({ time: '', activity: '', location: '' });
  };

  // Handle edit activity modal
  const handleEditActivity = (activity: Activity, dayIndex: number, activityIndex: number) => {
    setShowEditActivityModal({ dayIndex, activityIndex, activity });
    setEditActivity({ 
      time: activity.time, 
      activity: activity.activity, 
      location: activity.location 
    });
  };

  const handleSaveEditActivity = () => {
    if (showEditActivityModal && editActivity.time && editActivity.activity && editActivity.location) {
      updateActivity(showEditActivityModal.dayIndex, showEditActivityModal.activityIndex, {
        ...showEditActivityModal.activity,
        time: editActivity.time,
        activity: editActivity.activity,
        location: editActivity.location
      });
      setShowEditActivityModal(null);
      setEditActivity({ time: '', activity: '', location: '' });
    }
  };

  const handleCancelEditActivity = () => {
    setShowEditActivityModal(null);
    setEditActivity({ time: '', activity: '', location: '' });
  };

  // Close custom planning
  const closeCustomPlanning = () => {
    setShowCustomPlan(false);
    // Keep the planning mode as 'custom' to avoid scrolling to top
    // setPlanningMode('smart');
  };

  // Sortable Activity Component
  const SortableActivity = ({ 
    activity, 
    dayIndex, 
    activityIndex, 
    onEdit, 
    onDelete 
  }: { 
    activity: Activity; 
    dayIndex: number; 
    activityIndex: number; 
    onEdit: (activity: Activity) => void;
    onDelete: () => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: activity.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : transition,
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-100/50 transition-all duration-300 ease-out ${
          isDragging 
            ? 'shadow-2xl scale-105 rotate-1 border-blue-200/50 bg-white' 
            : 'hover:shadow-lg hover:scale-[1.02] hover:border-gray-200/80 hover:bg-white'
        }`}
      >
        {/* Drag Handle - Apple Style */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group-hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>

        {/* Time - Apple Typography */}
        <div className="w-20 text-sm font-medium text-blue-600 flex-shrink-0 tracking-tight">
          {activity.time}
        </div>

        {/* Activity Content - Apple Style */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-base leading-5 tracking-tight">{activity.activity}</p>
          <p className="text-sm text-gray-500 mt-0.5 leading-4">{activity.location}</p>
        </div>

        {/* Action Buttons - Apple Style */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onEdit(activity)}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            title="Edit activity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            title="Delete activity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    );
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
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
        <button className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Plan
        </button>
        <button className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Let us create your perfect itinerary based on your preferences and selected attractions
          </p>
          
          {/* Mode Selection - Apple Style */}
          {getCompletionStatus().allComplete && (
            <div className="flex justify-center mb-8">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 p-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setPlanningMode('smart')}
                    className={`px-8 py-4 rounded-3xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                      planningMode === 'smart'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl transform scale-105 shadow-orange-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Smart Planning
                  </button>
                  <button
                    onClick={() => setPlanningMode('custom')}
                    className={`px-8 py-4 rounded-3xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                      planningMode === 'custom'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl transform scale-105 shadow-orange-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                    Custom Planning
                  </button>
                </div>
              </div>
            </div>
          )}
          
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

        {planningMode === 'smart' ? (
          !generatedPlan ? (
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
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 shadow-orange-500/25'
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
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl shadow-orange-500/25"
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
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl shadow-orange-500/25"
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
          )
        ) : (
          // Custom Planning Mode
          <>
            {!showCustomPlan ? (
              <div className="space-y-8">
                {renderProgressIndicator()}
                {renderTripSummary()}
                {renderFavoritesPreview()}
                
                <div className="text-center">
                  <button
                    onClick={initializeCustomPlan}
                    disabled={!getCompletionStatus().allComplete}
                    className={`px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
                      !getCompletionStatus().allComplete
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 shadow-orange-500/25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Start Custom Planning
                    </div>
                  </button>
                  
                  {!getCompletionStatus().allComplete && (
                    <div className="mt-6 text-center">
                      <p className="text-gray-600 mb-4">
                        Please complete your trip details and select attractions first.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div id="custom-plan-section" className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Your Custom Trip Plan
                  </h2>
                  <button 
                    onClick={closeCustomPlanning}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  {customPlan.map((day, dayIndex) => (
                    <div key={day.day} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                            Day {day.day}
                          </h3>
                          <p className="text-base text-gray-600 mt-1">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddActivity(dayIndex)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 shadow-orange-500/25"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Activity
                        </button>
                      </div>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, dayIndex)}
                      >
                        <SortableContext
                          items={day.activities.map(activity => activity.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {day.activities.map((activity, activityIndex) => (
                              <SortableActivity
                                key={activity.id}
                                activity={activity}
                                dayIndex={dayIndex}
                                activityIndex={activityIndex}
                                onEdit={(activity) => handleEditActivity(activity, dayIndex, activityIndex)}
                                onDelete={() => deleteActivity(dayIndex, activityIndex)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Activity Modal */}
        {showAddActivityModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Add Activity</h3>
                  <button
                    onClick={handleCancelActivity}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="text"
                      value={newActivity.time}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, time: e.target.value }))}
                      placeholder="e.g., 2:00 PM"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg text-gray-900 placeholder-gray-400 bg-white"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
                    <input
                      type="text"
                      value={newActivity.activity}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, activity: e.target.value }))}
                      placeholder="e.g., Visit Museum"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newActivity.location}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., National Museum"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleCancelActivity}
                    className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveActivity}
                    disabled={isAddingActivity || !newActivity.time || !newActivity.activity || !newActivity.location}
                    className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                      !isAddingActivity && newActivity.time && newActivity.activity && newActivity.location
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl shadow-orange-500/25'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isAddingActivity ? 'Adding...' : 'Add Activity'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Activity Modal */}
        {showEditActivityModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Activity</h3>
                  <button
                    onClick={handleCancelEditActivity}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="text"
                      value={editActivity.time}
                      onChange={(e) => setEditActivity(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg text-gray-900 placeholder-gray-400 bg-white"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
                    <input
                      type="text"
                      value={editActivity.activity}
                      onChange={(e) => setEditActivity(prev => ({ ...prev, activity: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={editActivity.location}
                      onChange={(e) => setEditActivity(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg text-gray-900 placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleCancelEditActivity}
                    className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditActivity}
                    disabled={!editActivity.time || !editActivity.activity || !editActivity.location}
                    className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                      editActivity.time && editActivity.activity && editActivity.location
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl shadow-orange-500/25'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
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
