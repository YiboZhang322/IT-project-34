'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';

interface IAttraction {
  id: string;
  name: string;
  description: string;
  image: string;
  category: 'Must go' | 'Popular';
  rating: number;
  lat: number;
  lng: number;
  city: string;
  addedAt: string;
}

export const useFavorites = () => {
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToastContext();
  const [favorites, setFavorites] = useState<IAttraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  // Load favorites from API
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/favorites/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
        // Update addedItems set based on loaded favorites
        const favoriteIds = new Set<string>(data.favorites?.map((fav: IAttraction) => fav.id) || []);
        setAddedItems(favoriteIds);
      } else {
        const errorData = await response.json();
        error('Failed to load favorites', errorData.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      error('Failed to load favorites', 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, error]);

  // Add attraction to favorites
  const addToFavorites = useCallback(async (attraction: Omit<IAttraction, 'addedAt'>) => {
    if (!isAuthenticated || !user) {
      error('Please login', 'You need to be logged in to add favorites');
      return false;
    }

    // Check if this item is already being processed
    if (processingItems.has(attraction.id)) {
      console.log('Item is already being processed, skipping duplicate request');
      return false;
    }

    try {
      // Mark item as being processed
      setProcessingItems(prev => new Set(prev).add(attraction.id));

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        error('Authentication required', 'Please login again');
        return false;
      }

      const response = await fetch('/api/favorites/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attraction }),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
        setAddedItems(prev => new Set([...prev, attraction.id]));
        return true;
      } else {
        const errorData = await response.json();
        error('Failed to add favorite', errorData.error || 'Unknown error');
        return false;
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
      error('Failed to add favorite', 'Network error occurred');
      return false;
    } finally {
      // Always remove from processing set
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(attraction.id);
        return newSet;
      });
    }
  }, [isAuthenticated, user, success, error, processingItems]);

  // Remove attraction from favorites
  const removeFromFavorites = useCallback(async (attractionId: string) => {
    if (!isAuthenticated || !user) {
      error('Please login', 'You need to be logged in to manage favorites');
      return false;
    }

    // Check if this item is already being processed
    if (processingItems.has(attractionId)) {
      return false;
    }

    try {
      // Mark item as being processed
      setProcessingItems(prev => new Set(prev).add(attractionId));

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        error('Authentication required', 'Please login again');
        return false;
      }

      const response = await fetch('/api/favorites/remove', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attractionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
        setAddedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(attractionId);
          return newSet;
        });
        return true;
      } else {
        const errorData = await response.json();
        error('Failed to remove favorite', errorData.error || 'Unknown error');
        return false;
      }
    } catch (err) {
      console.error('Error removing from favorites:', err);
      error('Failed to remove favorite', 'Network error occurred');
      return false;
    } finally {
      // Always remove from processing set
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(attractionId);
        return newSet;
      });
    }
  }, [isAuthenticated, user, error, processingItems]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (attraction: Omit<IAttraction, 'addedAt'>) => {
    if (addedItems.has(attraction.id)) {
      return await removeFromFavorites(attraction.id);
    } else {
      return await addToFavorites(attraction);
    }
  }, [addedItems, addToFavorites, removeFromFavorites]);

  // Check if attraction is favorited
  const isFavorited = useCallback((attractionId: string) => {
    return addedItems.has(attractionId);
  }, [addedItems]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFavorites();
    } else {
      // Clear favorites when user logs out
      setFavorites([]);
      setAddedItems(new Set());
    }
  }, [loadFavorites, isAuthenticated, user]);

  return {
    favorites,
    isLoading,
    addedItems,
    processingItems,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    loadFavorites,
  };
};
