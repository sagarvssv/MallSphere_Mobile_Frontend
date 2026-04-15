// hooks/useEvents.ts
import { useState, useCallback, useEffect } from 'react';
import { eventsService, Event, EventsResponse } from '../services/eventServices';

interface UseEventsReturn {
  events: Event[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  searchQuery: string;
  selectedLocation: string;
  fetchEvents: (page?: number, search?: string, location?: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
  loadMoreEvents: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedLocation: (location: string) => void;
  searchEvents: () => Promise<void>;
  clearError: () => void;
}

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const fetchEvents = useCallback(async (
    page: number = 1,
    search: string = searchQuery,
    location: string = selectedLocation
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching events with:', { page, search, location });
      
      const response = await eventsService.getAllEvents({
        page,
        limit: 10,
        search: search || undefined,
        location: location || undefined,
      });
      
      console.log('✅ Events fetched successfully:', response);
      
      if (response.success) {
        if (page === 1) {
          setEvents(response.data);
        } else {
          setEvents(prev => [...prev, ...response.data]);
        }
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
        setTotalEvents(response.totalEvents);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err: any) {
      console.error('❌ Error fetching events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedLocation]);

  const refreshEvents = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEvents(1, searchQuery, selectedLocation);
    setIsRefreshing(false);
  }, [fetchEvents, searchQuery, selectedLocation]);

  const loadMoreEvents = useCallback(async () => {
    if (currentPage < totalPages && !isLoading && !isRefreshing) {
      console.log('📄 Loading more events, page:', currentPage + 1);
      await fetchEvents(currentPage + 1, searchQuery, selectedLocation);
    }
  }, [currentPage, totalPages, isLoading, isRefreshing, fetchEvents, searchQuery, selectedLocation]);

  const searchEvents = useCallback(async () => {
    console.log('🔎 Searching events:', { searchQuery, selectedLocation });
    await fetchEvents(1, searchQuery, selectedLocation);
  }, [fetchEvents, searchQuery, selectedLocation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch events on mount
  useEffect(() => {
    console.log('🚀 Initial events fetch');
    fetchEvents(1, '', '');
  }, []);

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    currentPage,
    totalPages,
    totalEvents,
    searchQuery,
    selectedLocation,
    fetchEvents,
    refreshEvents,
    loadMoreEvents,
    setSearchQuery,
    setSelectedLocation,
    searchEvents,
    clearError,
  };
};