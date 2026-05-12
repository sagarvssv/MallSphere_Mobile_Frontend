// services/eventServices.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the EXACT same base URL as your auth service
const API_BASE_URL = 'https://mallsperebackend-uh9h.onrender.com/api/auth';

export interface Event {
  _id: string;
  eventId?: string;
  vendorId?: string;
  eventTitle: string;
  eventSubject: string;
  eventDescription: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTimezone?: string;
  eventTime: string;
  eventStatus?: string;
  isLive?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  eventImage?: any;
  eventGuests?: any[];
}

export interface EventsResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  data: Event[];
}

export const eventsService = {
  async getAllEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
  }): Promise<EventsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', (params?.page || 1).toString());
      queryParams.append('limit', (params?.limit || 10).toString());
      
      if (params?.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }
      if (params?.location && params.location.trim()) {
        queryParams.append('location', params.location.trim());
      }
      
      // CORRECT URL - Now matches your route mounting
      const url = `${API_BASE_URL}/get-all-events-user-dashboard?${queryParams.toString()}`;
      console.log('🌐 Events API URL:', url);
      
      const token = await AsyncStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      console.log('📊 Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Events fetched successfully:', data.totalEvents, 'events found');
      
      return data;
    } catch (error: any) {
      console.error('❌ Events API Error:', error.message);
      throw error;
    }
  },
};