// types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  role: string;
  token?: string;
}

export interface Store {
  id: string;
  name: string;
  brandImage: string;
  category: string;
  rating: number;
  description: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  mallId: string;
  mallName: string;
  storeId?: string;        // Make optional
  storeName: string;
  storeBrandImage: string;
  category: string;
  image: string;
  isLiked: boolean;
  distance: number;        // Changed to number
  rating: number;          // Changed to number
  location?: string;
  price?: number;
  isFlashDeal?: boolean;   // Add flash deal flag
}

export interface Mall {
  id: string;
  name: string;
  location: string;
  distance: number;        // Changed to number
  rating: number;
  image: string;
  offersCount: number;
}

// types/event.ts
export interface Event {
  _id: string;
  eventTitle: string;
  eventSubject: string;
  eventDescription: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  eventTime: string;
  eventStatus: 'scheduled' | 'active' | 'expired';
  isLive: boolean;
  createdAt: string;
}

export interface EventsResponse {
  success: boolean;
  currentPage: number;
  totalPages: number;
  totalEvents: number;
  data: Event[];
}

// types/index.ts
export interface FlashDeal {
  _id: string;
  title: string;
  description?: string;
  status: 'active' | 'upcoming' | 'expired';
  dealType: 'percentage' | 'flat';  // Updated from offerType
  dealValue: number;                 // Updated from offerValue
  isEnabled: boolean;
  startTime: string;                 // Add start time
  endTime: string;                   // Add end time
  sellerId: {
    _id: string;
    name: string;
    email?: string;
    shopName?: string;
  };
  mallId: {
    _id: string;
    mallName: string;
    location: string;
  };
  banners: Array<{
    _id: string;
    url: string;
    publicId: string;
  }>;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}