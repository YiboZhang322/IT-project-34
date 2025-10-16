'use client';

import { useState, useEffect, useRef } from 'react';
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

type PlanningMode = 'quick' | 'custom';

// Global configurations for both Quick and Custom planning
const budgetConfigs = {
  economy: {
    breakfastVenues: ['The Hardware Societe', 'Higher Ground', 'Kettle Black', 'Operator25', 'Seven Seeds Coffee Roasters', 'Top Paddock', 'Auction Rooms', 'Cumulus Inc.', 'St Ali Coffee Roasters', 'Proud Mary Coffee'],
    lunchVenues: ['Lune Croissanterie', 'Queen Victoria Market Food Court', 'Section 8', 'Chin Chin', 'Supernormal', 'MoVida', 'Tipo 00', 'Mamasita', 'Hanoi Hannah', 'Laksa King'],
    dinnerVenues: ['Stalactites', 'Pellegrini\'s Espresso Bar', 'The Waiters Restaurant', 'Gazi', 'Bimbo Deluxe', 'Lucky Coq', 'Naked for Satan', 'Easey\'s', 'Leonard\'s House of Love', 'Biggie Smalls'],
    snackBreaks: ['Pidapipo Gelateria', 'Shortstop Coffee & Donuts', 'Dexter', 'Belles Hot Chicken', 'Good Times', 'Lazerpig', 'Heartattack and Vine', 'The Everleigh', 'Bar Ampere', 'Union Electric Bar'],
    transport: ['Myki Card (Public Transport)', 'Melbourne Bike Share', 'City Circle Tram (Free)', 'Walking', 'Uber/DiDi/Ola'],
    extraActivities: ['ACMI (Australian Centre for the Moving Image)', 'State Library Victoria', 'St Kilda Beach Penguin Parade', 'Brighton Beach Boxes', 'Fitzroy Gardens', 'Royal Arcade & Block Arcade', 'Hosier Lane Street Art', 'Shrine of Remembrance', 'Old Melbourne Gaol', 'Coop\'s Shot Tower'],
    accommodationStyle: ['The Nunnery Accommodation', 'United Backpackers Melbourne', 'Space Hotel', 'Flinders Backpackers', 'The Village Melbourne'][Math.floor(Math.random() * 5)]
  },
  comfortable: {
    breakfastVenues: ['Krimper Cafe', 'Hash Specialty Coffee', 'White Mojo', 'Manchester Press', 'Industry Beans', 'The Grain Store', 'Axil Coffee Roasters', 'Three Bags Full', 'Fifty Acres', 'The Glass Den'],
    lunchVenues: ['Coda', 'Tonka', 'Longrain', 'Izakaya Den', 'Rice Paper Scissors', 'Hawker Hall', 'Fonda Mexican', 'Jimmy Grants', 'Meatball & Wine Bar', 'Bao Down'],
    dinnerVenues: ['Cutler & Co.', 'Cumulus Up.', 'Marion', 'Embla', 'Aru', 'Lee Ho Fook', 'Ishizuka', 'Minamishima', 'The Town Mouse', 'Ides'],
    snackBreaks: ['Lune Croissanterie (Fitzroy)', 'Agathé Pâtisserie', 'Gontran Cherrier', 'Mörk Chocolate Brew House', 'Uncle Tetsu\'s Japanese Cheesecake', 'Burch & Purchese Sweet Studio', 'The Mill House', 'Eau De Vie Melbourne', 'The Croft Institute', 'Berlin Bar'],
    transport: ['Uber Premium', 'GoCatch', 'Silver Top Taxi', 'Rental Car (e.g., Avis, Hertz)', 'SkyBus'],
    extraActivities: ['Eureka Skydeck 88', 'Melbourne Star Observation Wheel', 'SEA LIFE Melbourne Aquarium', 'Healesville Sanctuary', 'Puffing Billy Railway', 'Dandenong Ranges National Park', 'Mornington Peninsula Hot Springs', 'Phillip Island Nature Parks', 'Great Ocean Road Tour (Day Trip)', 'Yarra Valley Wine Tour'],
    accommodationStyle: ['The Langham, Melbourne', 'QT Melbourne', 'Ovolo Laneways', 'Adelphi Hotel', 'The Cullen'][Math.floor(Math.random() * 5)]
  },
  luxury: {
    breakfastVenues: ['Vue de Monde', 'The Lui Bar', 'No. 35 Restaurant', 'Melba Restaurant', 'Collins Kitchen', 'Dinner by Heston Blumenthal (when available)', 'Attica (special events)', 'Grossi Florentino Upstairs', 'Society Restaurant', 'Reine & La Rue'],
    lunchVenues: ['Flower Drum', 'Vue de Monde', 'Attica', 'Brae (Birregurra)', 'Lake House (Daylesford)', 'Minamishima', 'Ishizuka', 'Amaru', 'O.My', 'IDES'],
    dinnerVenues: ['Gimlet at Cavendish House', 'Society', 'Reine & La Rue', 'Grill Americano', 'Warabi', 'Her Bar', 'March', 'Di Stasio Città', 'France-Soir', 'Grossi Florentino'],
    snackBreaks: ['Om Nom Kitchen', 'Hopetoun Tea Rooms', 'The Windsor High Tea', 'Yugen Tea Bar', 'Byrdi', 'Above Board', 'Caretaker\'s Cottage', 'Siglo Bar', 'Gerald\'s Bar', 'Bar Margaux'],
    transport: ['Chauffeur Service (e.g., Blacklane)', 'Helicopter Transfer', 'Luxury Car Rental (e.g., Porsche, Ferrari)', 'Private Yacht Charter', 'V/Line First Class'],
    extraActivities: ['Private Helicopter Tour over Melbourne', 'Hot Air Ballooning over Yarra Valley', 'Private Shopping Tour with a Stylist', 'Exclusive Backstage Theatre Tour', 'Hands-on Cooking Class with a Celebrity Chef', 'Private Art Gallery Viewing', 'Luxury Spa Day at Crown Spa', 'AFL Corporate Box Experience', 'Melbourne Cup Carnival (Spring)', 'Australian Open Finals Tickets'],
    accommodationStyle: ['Park Hyatt Melbourne', 'Crown Towers Melbourne', 'The Ritz-Carlton, Melbourne', 'W Melbourne', 'Jackalope Hotel (Mornington Peninsula)'][Math.floor(Math.random() * 5)]
  }
};

const foodConfigs = {
  'no-preference': {
    specialVenues: ['Chin Chin', 'MoVida', 'Cumulus Inc.', 'Rockpool Bar & Grill', 'Supernormal', 'Tonka'],
    activities: ['Queen Victoria Market Ultimate Foodie Tour', 'Melbourne Food & Wine Festival event', 'Yarra Valley Gourmet Tour']
  },
  vegetarian: {
    specialVenues: ['Smith & Daughters', 'Transformer Fitzroy', 'Red Sparrow Pizza', 'Shakahari', 'Lentil As Anything', 'Gong De Lin', 'Vegie Bar', 'Lord of the Fries'],
    activities: ['Prahran Market Tour', 'Vegetarian Cooking Class', 'St Kilda Esplanade Market']
  },
  seafood: {
    specialVenues: ['Claypots Barbarossa', 'The Atlantic', 'Bacash', 'Rubira\'s at Swallows', 'Box Seafood Restaurant', 'Waterfront Southgate', 'Hunky Dory', 'Richmond Oysters'],
    activities: ['South Melbourne Market Seafood Tour', 'Port Phillip Bay Fishing Charter', 'Mornington Peninsula Seafood Trail']
  },
  'low-fat': {
    specialVenues: ['Serotonin Eatery', 'Matcha Mylkbar', 'Combi', 'Happy Place', 'Heal.thy Self Co.', 'Patch Cafe', 'Fitt Port Melbourne', 'Fourth Chapter'],
    activities: ['Collingwood Children\'s Farm Cafe', 'Guided walk in the Royal Botanic Gardens', 'Healthy Cooking Workshop']
  },
  kosher: {
    specialVenues: ['Glick\'s Bagels', 'Lamed Vov', 'Daneli\'s', 'Kiminsky\'s', 'Savion Cakes and Bagels', 'Kosher Kingdom (Supermarket with deli)'],
    activities: ['Jewish Museum of Australia visit', 'Explore Balaclava & St Kilda East Jewish community hubs']
  },
  'gluten-free': {
    specialVenues: ['GF Precinct (Bakery)', 'Caffe Strada', 'Kew Dining', 'Foddies Cafe', 'Fox in the Box', 'A25 Pizzeria', 'Mister Nice Guy\'s Bakeshop (also vegan)', 'Shop 225'],
    activities: ['Gasworks Farmers Market', 'Gluten-free baking class', 'Explore South Melbourne Market stalls']
  }
};

// Dynamic time slots based on group composition and preferences
const getTimeSlots = (hasElderly: boolean, budgetType: string) => {
  const baseSlots: any = {
    earlyMorning: hasElderly ? ['8:00 AM', '8:30 AM'] : ['7:45 AM', '8:15 AM', '8:45 AM'],
    breakfast: hasElderly ? ['8:30 AM', '9:00 AM', '9:30 AM'] : ['8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM'],
    midMorning: ['10:15 AM', '10:45 AM', '11:15 AM'],
    lunch: ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM'],
    afternoon: ['2:15 PM', '2:45 PM', '3:15 PM', '3:45 PM'],
    lateAfternoon: ['4:30 PM', '5:00 PM', '5:30 PM'],
    evening: hasElderly ? ['6:00 PM', '6:30 PM'] : ['6:15 PM', '6:45 PM', '7:15 PM'],
    dinner: hasElderly ? ['7:00 PM', '7:30 PM'] : ['7:30 PM', '8:00 PM', '8:30 PM'],
    night: hasElderly ? [] : ['9:00 PM', '9:30 PM', '10:00 PM']
  };

  if (budgetType === 'luxury') {
    baseSlots.champagneHour = ['4:45 PM', '5:15 PM'];
    baseSlots.lateEvening = ['10:00 PM', '10:30 PM'];
  }

  return baseSlots;
};

export default function QuickPlanningPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { info, error } = useToastContext();
  const router = useRouter();
  const { favorites, isLoading: favoritesLoading, removeFromFavorites, processingItems } = useFavorites();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [planningMode, setPlanningMode] = useState<PlanningMode>('quick');
  const [customPlan, setCustomPlan] = useState<DayPlan[]>([]);
  const [editingActivity, setEditingActivity] = useState<{ dayIndex: number; activityIndex: number; activity: Activity } | null>(null);
  const [showAddActivityModal, setShowAddActivityModal] = useState<{ dayIndex: number } | null>(null);
  const [showEditActivityModal, setShowEditActivityModal] = useState<{ dayIndex: number; activityIndex: number; activity: Activity } | null>(null);
  const [newActivity, setNewActivity] = useState({ time: '', activity: '', location: '' });
  const [editActivity, setEditActivity] = useState({ time: '', activity: '', location: '' });
  const [showCustomPlan, setShowCustomPlan] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [showAllAttractions, setShowAllAttractions] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ activity: Activity; dayIndex: number; activityIndex: number; } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle the timeout for undoing a delete
  useEffect(() => {
    // If there's an activity that was recently deleted, set a timeout to clear it
    if (recentlyDeleted) {
      // Clear any existing timeout to ensure we don't have multiple running
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      // Set a new timeout
      undoTimeoutRef.current = setTimeout(() => {
        setRecentlyDeleted(null);
      }, 6000); // 6 seconds to undo
    }

    // Cleanup function to clear the timeout if the component unmounts
    // or if recentlyDeleted changes before the timeout finishes
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, [recentlyDeleted]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, 
        tolerance: 5,
        delay: 100,
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
      } catch (e) {
        // In case of parsing error, good to clear corrupted data
        localStorage.removeItem('tripData');
      }
    }
  }, []);

  // Clear all data functionality
  const clearAllData = () => {
    localStorage.removeItem('tripData');
    setTripData(null);
    setGeneratedPlan(null);
    setCustomPlan([]);
    setPlanningMode('quick');
    setShowCustomPlan(false);
    info('Data Cleared', 'All trip data has been cleared. You can start fresh!');
  };

  // Enhanced drag end handler with time-slot based reordering
  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      setCustomPlan((prevPlan) => {
        return prevPlan.map((dayPlan, index) => {
          if (index === dayIndex) {
            const activities = dayPlan.activities;
            const draggedIndex = activities.findIndex((a) => a.id === active.id);
            const targetIndex = activities.findIndex((a) => a.id === over.id);

            if (draggedIndex !== -1 && targetIndex !== -1) {
              const newActivities = [...activities];
              const draggedActivity = newActivities[draggedIndex];
              const targetActivity = newActivities[targetIndex];

              // Extract content to be swapped
              const draggedContent = {
                activity: draggedActivity.activity,
                location: draggedActivity.location,
                type: draggedActivity.type,
              };

              // Perform the content swap
              newActivities[draggedIndex] = {
                ...draggedActivity,
                activity: targetActivity.activity,
                location: targetActivity.location,
                type: targetActivity.type,
              };

              newActivities[targetIndex] = {
                ...targetActivity,
                activity: draggedContent.activity,
                location: draggedContent.location,
                type: draggedContent.type,
              };
              
              return { ...dayPlan, activities: newActivities };
            }
          }
          return dayPlan;
        });
      });
    }
  };

  // Initialize custom plan from favorites
  const initializeCustomPlan = () => {
    if (!tripData || favorites.length === 0) return;
    
    const days = calculateDuration(tripData.departureDate, tripData.returnDate);
    const newPlan: DayPlan[] = [];

    // Custom plan deduplication tracking
    const customUsedActivities = new Set<string>();
    const customUsedVenues = new Set<string>();
    const customUsedRestaurants = new Set<string>();

    // Helper functions for custom plan (same as main itinerary)
    const getUniqueItemCustom = (items: string[], usedSet: Set<string>, fallbackItems?: string[]): string | null => {
      const unusedItems = items.filter(item => !usedSet.has(item));
      
      if (unusedItems.length > 0) {
        const selected = unusedItems[Math.floor(Math.random() * unusedItems.length)];
        usedSet.add(selected);
        return selected;
      } else if (fallbackItems && fallbackItems.length > 0) {
        const unusedFallback = fallbackItems.filter(item => !usedSet.has(item));
        if (unusedFallback.length > 0) {
          const selected = unusedFallback[Math.floor(Math.random() * unusedFallback.length)];
          usedSet.add(selected);
          return selected;
        }
      }
      return null;
    };

    const getUniqueActivityCustom = (activities: any[], usedSet: Set<string>, keyField: string = 'activity'): any | null => {
      const unusedActivities = activities.filter(activity => !usedSet.has(activity[keyField]));
      
      if (unusedActivities.length > 0) {
        const selected = unusedActivities[Math.floor(Math.random() * unusedActivities.length)];
        usedSet.add(selected[keyField]);
        return selected;
      }
      return null;
    };

    for (let day = 1; day <= days; day++) {
      const dayAttractions = favorites.slice(
        (day - 1) * Math.ceil(favorites.length / days),
        day * Math.ceil(favorites.length / days)
      );
      
       // Generate quick base activities for custom planning
       const generateCustomBaseActivities = () => {
         const getUniqueActivity = (activities: any[], usedSet: Set<string>, keyField: string = 'activity'): any | null => {
           const unusedActivities = activities.filter(activity => !usedSet.has(activity[keyField]));
           
           if (unusedActivities.length > 0) {
             const selected = unusedActivities[Math.floor(Math.random() * unusedActivities.length)];
             usedSet.add(selected[keyField]);
             return selected;
           }
           return null;
         };

         const config = budgetConfigs[tripData?.budgetType as keyof typeof budgetConfigs] || budgetConfigs.comfortable;
         const foodConfig = foodConfigs[tripData?.foodPreference as keyof typeof foodConfigs];
         const timeSlots = getTimeSlots(tripData?.hasElderly || false, tripData?.budgetType || 'comfortable');
         const baseActivities: Activity[] = [];

         // Dynamic morning routine - vary by day
         if (tripData?.budgetType === 'luxury' && (day === 1 || day % 3 === 0)) {
           const luxuryMorningOptions = [
             { activity: 'Private Sunrise Yoga Session', location: 'Crown Towers Rooftop', isYoga: true },
             { activity: 'Executive Wellness Session', location: 'Park Hyatt Melbourne Spa', isYoga: false },
             { activity: 'Premium Fitness Experience', location: 'Hotel Premium Facilities', isYoga: false }
           ];
           const selectedMorning = getUniqueActivityCustom(luxuryMorningOptions, customUsedActivities);
           
           if (selectedMorning) {
             const activityTime = selectedMorning.isYoga ? 
               '7:00 AM' : 
               timeSlots.earlyMorning[Math.floor(Math.random() * timeSlots.earlyMorning.length)];
             
             baseActivities.push({
               id: `morning-${day}`,
               time: activityTime,
               activity: selectedMorning.activity,
               location: selectedMorning.location,
               type: 'custom'
             });
           }
         }

         // Dynamic breakfast for custom planning
         const customBreakfastVenue = getUniqueItemCustom(config.breakfastVenues, customUsedRestaurants);
         if (customBreakfastVenue) {
           const breakfastTimeIndex = Math.floor(Math.random() * timeSlots.breakfast.length);
           
           const customBreakfastStyles = [
             tripData?.foodPreference !== 'no-preference' ? ` - ${tripData?.foodPreference} options` : ' - Local Melbourne Style',
             ' - Continental Breakfast',
             ' - Full Australian Breakfast',
             ' - Light & Healthy Options'
           ];
           
           baseActivities.push({
             id: `breakfast-${day}`,
             time: timeSlots.breakfast[breakfastTimeIndex],
             activity: `${customBreakfastVenue}${customBreakfastStyles[(day - 1) % customBreakfastStyles.length]}`,
             location: config.accommodationStyle,
             type: 'breakfast'
           });
         }

         // Coffee/snack break for non-economy
         if (tripData?.budgetType !== 'economy') {
           const snackVenue = getUniqueItemCustom(config.snackBreaks, customUsedVenues);
           if (snackVenue) {
             baseActivities.push({
               id: `snack-${day}`,
               time: timeSlots.midMorning[0],
               activity: snackVenue,
               location: 'Block Arcade Melbourne',
               type: 'custom'
             });
           }
         }

         // Attractions with varied timing
         dayAttractions.forEach((attraction, index) => {
           const timeSlot = index < 2 ? 
             timeSlots.midMorning[index + 1] || timeSlots.midMorning[timeSlots.midMorning.length - 1] :
             timeSlots.afternoon[index - 2] || timeSlots.afternoon[timeSlots.afternoon.length - 1];

           baseActivities.push({
             id: `attraction-${day}-${index}`,
             time: timeSlot,
             activity: `${tripData?.budgetType === 'luxury' ? 'Premium Visit to' : 'Visit'} ${attraction.name}${tripData?.children && tripData.children > 0 ? ' - Family Tour' : ''}`,
             location: attraction.name,
             type: 'attraction'
           });

           // Transport between attractions
           if (index < dayAttractions.length - 1 && index < 1) {
             const transport = config.transport[Math.floor(Math.random() * config.transport.length)];
             baseActivities.push({
               id: `transport-${day}-${index}`,
               time: timeSlots.midMorning[index + 2] || timeSlots.lunch[0],
               activity: `Travel via ${transport}`,
               location: 'Melbourne CBD Streets',
               type: 'custom'
             });
           }
         });

         // Lunch with food preferences
         let lunchVenue = getUniqueItemCustom(
           foodConfigs[tripData.foodPreference as keyof typeof foodConfigs]?.specialVenues || [],
           customUsedRestaurants,
           config.lunchVenues
         );
         if (!lunchVenue) {
            lunchVenue = getUniqueItemCustom(config.lunchVenues, customUsedRestaurants);
         }
         
         if (lunchVenue) {
           baseActivities.push({
             id: `lunch-${day}`,
             time: timeSlots.lunch[Math.floor(Math.random() * timeSlots.lunch.length)],
             activity: `Lunch at ${lunchVenue}`,
             location: lunchVenue,
             type: 'meal'
           });
         }

         // Afternoon rest for elderly/luxury, but not every day
         if ((tripData.hasElderly || tripData.budgetType === 'luxury') && (day === 1 || day % 3 === 0)) {
           const restOptions = [
             { activity: tripData.budgetType === 'luxury' ? 'Private Relaxation Time' : 'Comfortable Rest', location: tripData.budgetType === 'luxury' ? 'Crown Casino Premium Lounge' : 'Hotel Lobby & Facilities' },
             { activity: 'Quiet Time & Personal Break', location: 'Hotel Room or Quiet Area' },
             { activity: 'Leisurely Coffee/Tea Break', location: 'Nearby Cafe with a View' }
           ];
           const selectedRest = getUniqueActivityCustom(restOptions, customUsedActivities);
           if (selectedRest) {
             baseActivities.push({
               id: `rest-${day}`,
               time: timeSlots.afternoon[Math.floor(Math.random() * timeSlots.afternoon.length)], // Randomize time
               activity: selectedRest.activity,
               location: selectedRest.location,
               type: 'custom'
             });
           }
         }

         // Special activity based on group, not every day
         const isLargeGroup = (tripData?.adults || 0) + (tripData?.children || 0) > 3;
         if ((isLargeGroup || tripData?.budgetType === 'luxury') && (day % 2 === 0)) { // Every other day
             let specialActivityOptions: { activity: string; location: string }[] = [];
             if (isLargeGroup) {
                 specialActivityOptions = [
                     { activity: 'Group Photo Session & Memory Making', location: 'Federation Square Melbourne' },
                     { activity: 'Family Fun Time & Games', location: 'Royal Botanic Gardens Melbourne' },
                     { activity: 'Group Shopping Experience', location: 'Collins Street Melbourne' }
                 ];
             } else if (tripData?.budgetType === 'luxury') {
                 specialActivityOptions = [
                     { activity: 'Champagne & Canapés Hour', location: 'Eureka 89 Bar Melbourne' },
                     { activity: 'Premium Wine Tasting Experience', location: 'Crown Casino Melbourne' },
                     { activity: 'Executive Lounge Relaxation', location: 'The Melbourne Club' }
                 ];
             }

             const selectedSpecial = getUniqueActivityCustom(specialActivityOptions, customUsedActivities);
             if (selectedSpecial) {
                 baseActivities.push({
                     id: `special-${day}`,
                     time: timeSlots.lateAfternoon[Math.floor(Math.random() * timeSlots.lateAfternoon.length)], // Randomize
                     activity: selectedSpecial.activity,
                     location: selectedSpecial.location,
                     type: 'custom'
                 });
             }
         }

         // Evening activity for non-elderly
         if (!tripData?.hasElderly && tripData?.budgetType !== 'economy') {
           baseActivities.push({
             id: `evening-${day}`,
             time: timeSlots.evening[0],
             activity: tripData?.budgetType === 'luxury' ? 'Premium Evening Experience' : 'Scenic Evening Walk',
             location: tripData?.budgetType === 'luxury' ? 'Eureka Skydeck 88' : 'Yarra River Southbank',
             type: 'custom'
           });
         }

         // Dynamic dinner with flexible timing
         const allCustomDinnerVenues = [
           ...(foodConfigs[tripData.foodPreference as keyof typeof foodConfigs]?.specialVenues || []),
           ...config.dinnerVenues,
         ];
         
         const customDinnerVenue = getUniqueItemCustom(allCustomDinnerVenues, customUsedRestaurants);
         if (customDinnerVenue) {
           const dinnerTimeIndex = Math.floor(Math.random() * timeSlots.dinner.length);
           
           // Vary dinner style by day for custom planning too
           const customDinnerStyles = [
             tripData?.budgetType === 'luxury' ? ' - Signature Experience' : ' - Chef\'s Recommendation',
             tripData?.budgetType === 'luxury' ? ' - Premium Selection' : ' - Local Favorites',
             tripData?.budgetType === 'luxury' ? ' - Tasting Experience' : ' - Popular Dishes'
           ];
           
           baseActivities.push({
             id: `dinner-${day}`,
             time: timeSlots.dinner[dinnerTimeIndex],
             activity: `Dinner at ${customDinnerVenue}${customDinnerStyles[(day - 1) % customDinnerStyles.length]}`,
             location: customDinnerVenue,
             type: 'meal'
           });
         }

         // Dynamic night activities - not every night, vary by day
         if (!tripData.hasElderly && timeSlots.night.length > 0 && tripData.adults > tripData.children) {
           // Only add night activities on select days (not every night)
           const shouldAddNightActivity = (day === 1 && days > 1) || (day % 3 === 2) || (day === days && days > 2);
           
           if (shouldAddNightActivity) {
             const nightActivitiesByBudget = {
               luxury: [
                 { activity: 'Premium Cocktail Experience', location: 'Crown Casino Mahogany Room' },
                 { activity: 'Exclusive Wine Bar Experience', location: 'Eureka 89 Bar Melbourne' },
                 { activity: 'High-End Dining & Entertainment', location: 'The Melbourne Club' }
               ],
               comfortable: [
                 { activity: 'Trendy Rooftop Bar Experience', location: 'Rooftop Bar Melbourne' },
                 { activity: 'Live Music Venue Visit', location: 'Corner Hotel Richmond' },
                 { activity: 'Craft Cocktail Tour', location: 'Fitzroy Cocktail Bars' }
               ],
               economy: [
                 { activity: 'Local Pub Experience', location: 'Young & Jackson Hotel' },
                 { activity: 'Night Market Exploration', location: 'Queen Victoria Night Market' },
                 { activity: 'Street Food & Local Culture', location: 'Chinatown Melbourne' }
               ]
             };
             
             const budgetActivities = nightActivitiesByBudget[tripData.budgetType as keyof typeof nightActivitiesByBudget] || nightActivitiesByBudget.comfortable;
             const selectedNightActivity = getUniqueActivity(budgetActivities, customUsedActivities);
             if (selectedNightActivity) {
               const nightTimeIndex = Math.floor(Math.random() * timeSlots.night.length);
               
               baseActivities.push({
                 id: `night-activity-${day}-${nightTimeIndex}`,
                 time: timeSlots.night[nightTimeIndex],
                 activity: selectedNightActivity.activity,
                 location: selectedNightActivity.location,
                 type: 'custom'
               });
             }
           }
         }

         // Late evening luxury experience (only on select days)
         if (tripData.budgetType === 'luxury' && timeSlots.lateEvening && !tripData.hasElderly && day === days) {
           // Only on the last day for a special farewell experience
           baseActivities.push({
             id: `late-evening-${day}`,
             time: timeSlots.lateEvening[0],
             activity: 'Farewell Premium Experience',
             location: 'The Melbourne Club',
             type: 'custom'
           });
         }

         return baseActivities.sort((a, b) => {
           const timeA = new Date(`1970-01-01 ${a.time}`);
           const timeB = new Date(`1970-01-01 ${b.time}`);
           return timeA.getTime() - timeB.getTime();
         });
       };

       const activities: Activity[] = generateCustomBaseActivities();

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
        // Add new activity and sort by time
        newPlan[dayIndex].activities.push(newActivity);
        
        // Sort activities by time
        newPlan[dayIndex].activities.sort((a, b) => {
          const timeA = new Date(`1970-01-01 ${a.time}`);
          const timeB = new Date(`1970-01-01 ${b.time}`);
          return timeA.getTime() - timeB.getTime();
        });
      }
      
      return newPlan;
    });
  };

  // Update activity
  const updateActivity = (dayIndex: number, activityIndex: number, updatedActivity: Activity) => {
    setCustomPlan((prevPlan) => {
      return prevPlan.map((day, dIndex) => {
        if (dIndex !== dayIndex) {
          return day;
        }

        // For the target day, create a new list of activities
        // by replacing the one at activityIndex
        const newActivities = day.activities.map((act, aIndex) =>
          aIndex === activityIndex ? updatedActivity : act
        );

        // Sort the activities by time after updating
        newActivities.sort((a, b) => {
          const timeA = new Date(`1970-01-01 ${a.time}`);
          const timeB = new Date(`1970-01-01 ${b.time}`);
          return timeA.getTime() - timeB.getTime();
        });

        // Return the updated day
        return {
          ...day,
          activities: newActivities,
        };
      });
    });
  };

  // Delete activity
  const deleteActivity = (dayIndex: number, activityIndex: number) => {
    setCustomPlan(prevPlan => {
      const newPlan = prevPlan.map(day => ({
        ...day,
        activities: [...day.activities],
      }));

      const deletedActivity = newPlan[dayIndex].activities[activityIndex];

      // This will trigger the useEffect to set the timeout
      setRecentlyDeleted({
        activity: deletedActivity,
        dayIndex,
        activityIndex,
      });

      newPlan[dayIndex].activities.splice(activityIndex, 1);
      return newPlan;
    });
  };

  const handleUndoDelete = () => {
    if (recentlyDeleted) {
      setCustomPlan((prevPlan) => {
        const newPlan = prevPlan.map(day => ({
          ...day,
          activities: [...day.activities],
        }));
        
        newPlan[recentlyDeleted.dayIndex].activities.splice(
          recentlyDeleted.activityIndex,
          0,
          recentlyDeleted.activity
        );
        return newPlan;
      });

      setRecentlyDeleted(null);
    }
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
  };

  // Enhanced Sortable Activity Component with Apple-style UI
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
      isOver,
    } = useSortable({ id: activity.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : transition,
      opacity: isDragging ? 0.9 : 1,
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative transition-all duration-300 ease-out ${
          isDragging 
            ? 'scale-105 rotate-1 z-50' 
            : isOver 
              ? 'scale-[1.02]' 
              : 'hover:scale-[1.01]'
        }`}
      >
        {/* Drop indicator */}
        {isOver && !isDragging && (
          <div className="absolute -top-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-80 animate-pulse" />
        )}
        
        <div className={`flex items-stretch bg-white/95 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
          isDragging 
            ? 'shadow-2xl border-orange-200/50 bg-white ring-4 ring-orange-100/50' 
            : isOver
              ? 'shadow-xl border-orange-200/30 bg-orange-50/30'
              : 'border-gray-100/50 hover:shadow-lg hover:border-gray-200/60 hover:bg-white'
        }`}>
          {/* Fixed Time Column - Apple Design */}
          <div className={`w-20 flex-shrink-0 flex items-center justify-center rounded-l-2xl transition-all duration-300 ${
            isDragging 
              ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700' 
              : 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 group-hover:from-orange-100 group-hover:to-orange-200'
          }`}>
            <div className="text-center">
              <div className="text-sm font-bold tracking-tight leading-none">
                {activity.time.split(' ')[0]}
              </div>
              <div className="text-xs font-medium opacity-75 leading-none mt-0.5">
                {activity.time.split(' ')[1]}
              </div>
            </div>
          </div>

          {/* Drag Handle - Redesigned */}
          <div
            {...attributes}
            {...listeners}
            className={`flex items-center justify-center w-8 cursor-grab active:cursor-grabbing transition-all duration-200 ${
              isDragging 
                ? 'text-orange-500 bg-orange-50/50' 
                : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50/50 group-hover:text-gray-600'
            }`}
            title="Drag to reorder"
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
              <div className="w-1 h-1 rounded-full bg-current opacity-60"></div>
            </div>
          </div>

          {/* Activity Content - Enhanced Layout */}
          <div className="flex-1 min-w-0 p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base leading-5 tracking-tight mb-1 truncate">
                {activity.activity}
              </h4>
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-500 leading-4 truncate">{activity.location}</p>
              </div>
            </div>

            {/* Action Buttons - Apple Style with better spacing */}
            <div className={`flex gap-1 ml-4 transition-all duration-200 ${
              isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <button
                onClick={() => onEdit(activity)}
                className="p-2.5 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50/80 active:bg-blue-100 transition-all duration-200 hover:scale-110"
                title="Edit activity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50/80 active:bg-red-100 transition-all duration-200 hover:scale-110"
                title="Delete activity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
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

  const generateQuickPlan = async () => {
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

      // Activity deduplication tracking
      const usedActivities = new Set<string>();
      const usedVenues = new Set<string>();
      const usedRestaurants = new Set<string>();

      const config = budgetConfigs[tripData.budgetType as keyof typeof budgetConfigs] || budgetConfigs.comfortable;
      const foodConfig = foodConfigs[tripData.foodPreference as keyof typeof foodConfigs];

      // Helper function to get unique item from array
      const getUniqueItem = (items: string[], usedSet: Set<string>, fallbackItems?: string[]): string | null => {
        const unusedItems = items.filter(item => !usedSet.has(item));
        
        if (unusedItems.length > 0) {
          const selected = unusedItems[Math.floor(Math.random() * unusedItems.length)];
          usedSet.add(selected);
          return selected;
        } else if (fallbackItems && fallbackItems.length > 0) {
          const unusedFallback = fallbackItems.filter(item => !usedSet.has(item));
          if (unusedFallback.length > 0) {
            const selected = unusedFallback[Math.floor(Math.random() * unusedFallback.length)];
            usedSet.add(selected);
            return selected;
          }
        }
        return null;
      };

      // Helper function to get unique activity from object array
      const getUniqueActivity = (activities: any[], usedSet: Set<string>, keyField: string = 'activity'): any | null => {
        const unusedActivities = activities.filter(activity => !usedSet.has(activity[keyField]));
        
        if (unusedActivities.length > 0) {
          const selected = unusedActivities[Math.floor(Math.random() * unusedActivities.length)];
          usedSet.add(selected[keyField]);
          return selected;
        }
        return null;
      };
      
      for (let day = 1; day <= days; day++) {
        const dayAttractions = attractions.slice(
          (day - 1) * attractionsPerDay,
          day * attractionsPerDay
        );
        
        const timeSlots = getTimeSlots(tripData.hasElderly, tripData.budgetType);
        const activities = [];

        // Dynamic early morning activities - vary by day and preferences
        if (tripData.budgetType === 'luxury' && !tripData.hasElderly) {
          const luxuryMorningActivities = [
            { activity: 'Private Sunrise Yoga Session', location: 'Crown Towers Rooftop', isYoga: true },
            { activity: 'Premium Spa Morning Treatment', location: 'Crown Towers Spa & Wellness', isYoga: false },
            { activity: 'Executive Fitness Session', location: 'Hotel Premium Gym', isYoga: false },
            { activity: 'Private Meditation Experience', location: 'Royal Botanic Gardens Melbourne', isYoga: false }
          ];
          
          // Only add early morning activity every other day or specific days
          if (day === 1 || day % 3 === 0) {
            const selectedActivity = getUniqueActivity(luxuryMorningActivities, usedActivities);
            
            if (selectedActivity) {
              const activityTime = selectedActivity.isYoga ? 
                '7:00 AM' : 
                timeSlots.earlyMorning[Math.floor(Math.random() * timeSlots.earlyMorning.length)];
              
              activities.push({
                id: `morning-${day}`,
                time: activityTime,
                activity: selectedActivity.activity,
                location: selectedActivity.location,
                type: 'custom',
              });
            }
          }
        } else if (tripData.hasElderly && day <= 2) {
          // Only first couple of days for elderly
          const elderlyMorningActivities = [
            { activity: 'Gentle Morning Walk', location: 'Fitzroy Gardens Melbourne' },
            { activity: 'Peaceful Garden Stroll', location: 'Royal Botanic Gardens Melbourne' }
          ];
          const selectedActivity = getUniqueActivity(elderlyMorningActivities, usedActivities);
          if (selectedActivity) {
            activities.push({
              id: `elderly-morning-${day}`,
              time: timeSlots.earlyMorning[Math.floor(Math.random() * timeSlots.earlyMorning.length)],
              activity: selectedActivity.activity,
              location: selectedActivity.location,
              type: 'custom',
            });
          }
        }

        // Dynamic breakfast - vary timing and venue by day
        const breakfastTimeIndex = Math.floor(Math.random() * timeSlots.breakfast.length);
        const breakfastTime = timeSlots.breakfast[breakfastTimeIndex];
        
        // Get unique breakfast venue to avoid repetition
        const breakfastVenue = getUniqueItem(config.breakfastVenues, usedRestaurants);
        
        // Vary breakfast style by day
        const breakfastStyles = [
          tripData.foodPreference !== 'no-preference' ? ` - ${tripData.foodPreference} options` : ' - Local Specialties',
          ' - Continental Style',
          ' - Australian Breakfast',
          ' - International Options'
        ];
        
        if (breakfastVenue) {
          activities.push({
            id: `breakfast-${day}`,
            time: breakfastTime,
            activity: `${breakfastVenue}${breakfastStyles[(day - 1) % breakfastStyles.length]}`,
            location: config.accommodationStyle,
            type: 'meal',
          });
        }

        // Mid-morning coffee/snack (vary by day and budget)
        if (tripData.budgetType !== 'economy' && (day % 2 === 1 || tripData.budgetType === 'luxury')) {
          // Not every day, and vary the timing
          const snackTimeIndex = Math.floor(Math.random() * timeSlots.midMorning.length);
          const snackVenue = getUniqueItem(config.snackBreaks, usedVenues);
          if (snackVenue) {
            activities.push({
              id: `snack-${day}`,
              time: timeSlots.midMorning[snackTimeIndex],
              activity: snackVenue,
              location: day % 2 === 1 ? 'Block Arcade Melbourne' : 'Degraves Street Melbourne',
              type: 'custom',
            });
          }
        }

        // Morning attractions with transport consideration
        const morningAttractions = dayAttractions.slice(0, Math.min(2, dayAttractions.length));
        morningAttractions.forEach((attraction, index) => {
          const timeSlot = timeSlots.midMorning[index + 1] || timeSlots.midMorning[timeSlots.midMorning.length - 1];
          activities.push({
            id: `attraction-morning-${day}-${index}`,
            time: timeSlot,
            activity: `Explore ${attraction.name}${tripData.budgetType === 'luxury' ? ' - Premium Experience' : ''}`,
            location: attraction.name,
            type: 'attraction',
          });

          // Transport between attractions
          if (index < morningAttractions.length - 1) {
            const transport = config.transport[Math.floor(Math.random() * config.transport.length)];
            activities.push({
              id: `transport-morning-${day}-${index}`,
              time: timeSlots.midMorning[index + 2] || timeSlots.lunch[0],
              activity: `Travel via ${transport}`,
              location: 'Melbourne CBD Streets',
              type: 'custom',
            });
          }
        });

        // Lunch - food preference integration
        const lunchTime = timeSlots.lunch[Math.floor(Math.random() * timeSlots.lunch.length)];
        
        // Get unique lunch venue considering food preferences
        let lunchVenue = getUniqueItem(
          foodConfigs[tripData.foodPreference as keyof typeof foodConfigs]?.specialVenues || [],
          usedRestaurants,
          config.lunchVenues
        );
        if (!lunchVenue) {
          lunchVenue = getUniqueItem(config.lunchVenues, usedRestaurants);
        }
        
        if (lunchVenue) {
          activities.push({
            id: `lunch-${day}`,
            time: lunchTime,
            activity: `Lunch at ${lunchVenue}`,
            location: lunchVenue,
            type: 'meal',
          });
        }

        // Post-lunch rest (for elderly or luxury), not every day and varied
        if ((tripData.hasElderly || tripData.budgetType === 'luxury') && (day === 1 || day % 3 === 1)) {
          const restOptions = [
            { activity: tripData.budgetType === 'luxury' ? 'Private Lounge Relaxation' : 'Comfortable Rest Break', location: tripData.budgetType === 'luxury' ? 'Premium Lounge' : 'Hotel Lobby' },
            { activity: 'Power Nap & Recharge', location: 'Hotel Room' },
            { activity: 'Relaxed Reading Time', location: 'Hotel Garden or Lounge' }
          ];
          const selectedRest = getUniqueActivity(restOptions, usedActivities);
          if (selectedRest) {
            activities.push({
              id: `rest-${day}`,
              time: timeSlots.afternoon[Math.floor(Math.random() * timeSlots.afternoon.length)],
              activity: selectedRest.activity,
              location: selectedRest.location,
              type: 'custom',
            });
          }
        }

        // Afternoon attractions
        const afternoonAttractions = dayAttractions.slice(2);
        afternoonAttractions.forEach((attraction, index) => {
          const timeIndex = Math.min(index + (tripData.hasElderly ? 2 : 1), timeSlots.afternoon.length - 1);
          activities.push({
            id: `attraction-afternoon-${day}-${index}`,
            time: timeSlots.afternoon[timeIndex],
            activity: `Visit ${attraction.name}${tripData.children > 0 ? ' - Family-Friendly Tour' : ''}`,
            location: attraction.name,
            type: 'attraction',
          });
        });

        // Dynamic afternoon activities - vary by day
        let afternoonSpecialActivities: { activity: string; location: string }[] = [];
        
        if (tripData.adults + tripData.children > 3) {
          afternoonSpecialActivities = [
            { activity: 'Group Photo Session & Memory Making', location: 'Federation Square Melbourne' },
            { activity: 'Family Fun Time & Games', location: 'Royal Botanic Gardens Melbourne' },
            { activity: 'Group Shopping Experience', location: 'Collins Street Melbourne' }
          ];
        } else if (tripData.budgetType === 'luxury') {
          afternoonSpecialActivities = [
            { activity: 'Champagne & Canapés Hour', location: 'Eureka 89 Bar Melbourne' },
            { activity: 'Premium Wine Tasting Experience', location: 'Crown Casino Melbourne' },
            { activity: 'Executive Lounge Relaxation', location: 'The Melbourne Club' }
          ];
        }
        
        // Add afternoon activity on alternating days or based on conditions
        if (afternoonSpecialActivities.length > 0 && (day === 1 || day % 2 === 0)) {
          const selectedActivity = getUniqueActivity(afternoonSpecialActivities, usedActivities);
          if (selectedActivity) {
            const timeIndex = Math.floor(Math.random() * timeSlots.lateAfternoon.length);
            activities.push({
              id: `special-afternoon-${day}`,
              time: timeSlots.champagneHour && tripData.budgetType === 'luxury' && day % 3 === 1 ? 
                timeSlots.champagneHour[0] : timeSlots.lateAfternoon[timeIndex],
              activity: selectedActivity.activity,
              location: selectedActivity.location,
              type: 'custom',
            });
          }
        }

        // Food-specific activity (every other day)
        if (day % 2 === 0 && foodConfig && foodConfig.activities) {
          const foodActivity = getUniqueItem(foodConfig.activities, usedActivities);
          if (foodActivity) {
            activities.push({
              id: `food-activity-${day}`,
              time: timeSlots.lateAfternoon[1] || timeSlots.evening[0],
              activity: foodActivity,
              location: 'Queen Victoria Market Melbourne',
              type: 'custom',
            });
          }
        }

        // Evening pre-dinner activity
        if (!tripData.hasElderly && tripData.budgetType !== 'economy') {
          activities.push({
            id: `pre-dinner-${day}`,
            time: timeSlots.evening[0],
            activity: tripData.budgetType === 'luxury' ? 'Premium Sunset Experience' : 'Scenic Evening Stroll',
            location: tripData.budgetType === 'luxury' ? 'Eureka Skydeck 88' : 'Southbank Promenade',
            type: 'custom',
          });
        }

        // Dynamic dinner arrangements - vary timing and style by day
        const dinnerTimeIndex = Math.floor(Math.random() * timeSlots.dinner.length);
        const dinnerTime = timeSlots.dinner[dinnerTimeIndex];
        
        // Mix food config venues with regular venues for variety
        const allDinnerVenues = [
          ...(foodConfigs[tripData.foodPreference as keyof typeof foodConfigs]?.specialVenues || []),
          ...config.dinnerVenues,
        ];
        
        // Get unique dinner venue
        const dinnerVenue = getUniqueItem(allDinnerVenues, usedRestaurants);
        
        // Vary dinner experience by day
        const dinnerExperiences = {
          1: tripData.budgetType === 'luxury' ? ' - Welcome Tasting Menu' : ' - Local Specialties',
          2: tripData.budgetType === 'luxury' ? ' - Chef\'s Signature Dishes' : ' - Popular Favorites',
          3: tripData.budgetType === 'luxury' ? ' - Wine Pairing Experience' : ' - Cultural Cuisine',
          default: tripData.budgetType === 'luxury' ? ' - Premium Selection' : ' - House Recommendations'
        };
        
        if (dinnerVenue) {
          const dinnerExperience = dinnerExperiences[day as keyof typeof dinnerExperiences] || dinnerExperiences.default;
          
          activities.push({
            id: `dinner-${day}`,
            time: dinnerTime,
            activity: `Dinner at ${dinnerVenue}${dinnerExperience}`,
            location: dinnerVenue,
            type: 'meal',
          });
        }

        // Dynamic night activities - not every night, vary by day
        if (!tripData.hasElderly && timeSlots.night.length > 0 && tripData.adults > tripData.children) {
          // Only add night activities on select days (not every night)
          const shouldAddNightActivity = (day === 1 && days > 1) || (day % 3 === 2) || (day === days && days > 2);
          
          if (shouldAddNightActivity) {
            const nightActivitiesByBudget = {
              luxury: [
                { activity: 'Premium Cocktail Experience', location: 'Crown Casino Mahogany Room' },
                { activity: 'Exclusive Wine Bar Experience', location: 'Eureka 89 Bar Melbourne' },
                { activity: 'High-End Dining & Entertainment', location: 'The Melbourne Club' }
              ],
              comfortable: [
                { activity: 'Trendy Rooftop Bar Experience', location: 'Rooftop Bar Melbourne' },
                { activity: 'Live Music Venue Visit', location: 'Corner Hotel Richmond' },
                { activity: 'Craft Cocktail Tour', location: 'Fitzroy Cocktail Bars' }
              ],
              economy: [
                { activity: 'Local Pub Experience', location: 'Young & Jackson Hotel' },
                { activity: 'Night Market Exploration', location: 'Queen Victoria Night Market' },
                { activity: 'Street Food & Local Culture', location: 'Chinatown Melbourne' }
              ]
            };
            
            const budgetActivities = nightActivitiesByBudget[tripData.budgetType as keyof typeof nightActivitiesByBudget] || nightActivitiesByBudget.comfortable;
            const selectedNightActivity = getUniqueActivity(budgetActivities, usedActivities);
            if (selectedNightActivity) {
              const nightTimeIndex = Math.floor(Math.random() * timeSlots.night.length);
              
              activities.push({
                id: `night-${day}`,
                time: timeSlots.night[nightTimeIndex],
                activity: selectedNightActivity.activity,
                location: selectedNightActivity.location,
                type: 'custom',
              });
            }
          }
        }

        // Late evening luxury experience (only on select days)
        if (tripData.budgetType === 'luxury' && timeSlots.lateEvening && !tripData.hasElderly && day === days) {
          // Only on the last day for a special farewell experience
          activities.push({
            id: `farewell-${day}`,
            time: timeSlots.lateEvening[0],
            activity: 'Farewell Premium Experience',
            location: 'The Melbourne Club',
            type: 'custom',
          });
        }

        // Sort activities by time
        const sortedActivities = activities.sort((a, b) => {
          const timeA = new Date(`1970-01-01 ${a.time}`);
          const timeB = new Date(`1970-01-01 ${b.time}`);
          return timeA.getTime() - timeB.getTime();
        });

        itinerary.push({
          day,
          date: new Date(new Date(tripData.departureDate).getTime() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          attractions: dayAttractions,
          activities: sortedActivities
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
              <p className="text-green-800 font-semibold">Ready to generate your quick itinerary!</p>
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
          {(showAllAttractions ? favorites : favorites.slice(0, 6)).map((attraction) => (
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
          {favorites.length > 6 && !showAllAttractions && (
            <button 
              onClick={() => setShowAllAttractions(true)}
              className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 flex items-center justify-center transition-colors duration-200 group"
            >
              <span className="text-gray-600 group-hover:text-gray-800 font-medium">+{favorites.length - 6} more</span>
            </button>
          )}
          {showAllAttractions && favorites.length > 6 && (
            <button 
              onClick={() => setShowAllAttractions(false)}
              className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 flex items-center justify-center transition-colors duration-200 group"
            >
              <span className="text-gray-600 group-hover:text-gray-800 font-medium">Show less</span>
            </button>
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
                <div key={index} className="flex items-center gap-4 bg-white rounded-lg p-4">
                  <div className="w-24 text-sm font-semibold text-orange-600 flex-shrink-0 whitespace-nowrap text-center">
                    <div>{activity.time.split(' ')[0]}</div>
                    <div className="text-xs opacity-75">{activity.time.split(' ')[1]}</div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{activity.activity}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{activity.location}</span>
                    </div>
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
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white px-8 py-3 rounded-full transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
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
            Trip Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Create your perfect itinerary
          </p>
          
          {/* Mode Selection - Apple Style */}
          {getCompletionStatus().allComplete && (
            <div className="flex justify-center mb-8">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 p-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setPlanningMode('quick')}
                    className={`px-8 py-4 rounded-3xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                      planningMode === 'quick'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl transform scale-105 shadow-orange-500/25'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Planning
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

        {planningMode === 'quick' ? (
          !generatedPlan ? (
            <>
              {renderProgressIndicator()}
              {renderTripSummary()}
              {renderFavoritesPreview()}
              
              <div className="text-center">
                <button
                  onClick={generateQuickPlan}
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
                      Generate Quick Itinerary
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                      
                      {/* Enhanced Drag and Drop Container */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, dayIndex)}
                      >
                        <SortableContext
                          items={day.activities.map(activity => activity.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2 relative">
                            {/* Timeline Guide */}
                            <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 opacity-30 rounded-full" />
                            
                            {/* Activity Cards */}
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
                            
                            {/* Empty State Hint */}
                            {day.activities.length === 0 && (
                              <div className="flex items-center justify-center py-12 text-gray-400">
                                <div className="text-center">
                                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  <p className="text-lg font-medium">No activities yet</p>
                                  <p className="text-sm">Click "Add Activity" to get started</p>
                                </div>
                              </div>
                            )}
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

      {recentlyDeleted && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] border border-gray-700/50 backdrop-blur-sm bg-opacity-80">
          <p className="text-sm font-medium">Activity removed.</p>
          <button
            onClick={handleUndoDelete}
            className="font-semibold text-orange-400 hover:text-orange-300 transition-colors text-sm"
          >
            Undo
          </button>
          <div className="w-px h-4 bg-gray-600" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRecentlyDeleted(null);
              if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = null;
              }
            }}
            className="text-gray-400 hover:text-white"
            title="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
