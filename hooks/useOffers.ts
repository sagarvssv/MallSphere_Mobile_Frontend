// hooks/useOffers.ts 
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../constants/api';
import { wishlistService } from '../services/wishlistService';
import { FlashDeal, Mall, Offer } from '../types';

export const useOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<string>('Dubai');
  const [selectedMall, setSelectedMall] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlashDeals, setIsLoadingFlashDeals] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0
  });
  const [filters, setFilters] = useState({
    category: 'all',
    distance: 10,
    minDiscount: 0,
    sortBy: 'distance' as 'distance' | 'rating' | 'discount',
  });

  const FALLBACK_IMAGE = 'https://picsum.photos/300/150';
  
  const offersCountMapRef = useRef<Map<string, number>>(new Map());
  const allMallsCacheRef = useRef<Mall[]>([]);

  const extractImageUrl = (imageData: any): string => {
    if (!imageData) return FALLBACK_IMAGE;
    if (typeof imageData === 'string') {
      return imageData.trim() || FALLBACK_IMAGE;
    }
    if (Array.isArray(imageData)) {
      if (imageData.length === 0) return FALLBACK_IMAGE;
      return extractImageUrl(imageData[0]);
    }
    if (typeof imageData === 'object' && imageData !== null) {
      const candidate = imageData.url ?? imageData.uri ?? imageData.src ?? null;
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
      return FALLBACK_IMAGE;
    }
    return FALLBACK_IMAGE;
  };

  const handleApiResponse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON:', text.substring(0, 100));
      throw new Error('Invalid response from server');
    }
  };

  // Fetch user's wishlist IDs
  const fetchWishlistIds = useCallback(async () => {
    try {
      console.log('🔄 Fetching wishlist IDs...');
      const response = await wishlistService.getWishlist();
      
      if (response.success && response.data) {
        const ids = response.data
          .filter(item => item?.offerId != null && item?.offerId?._id != null)
          .map(item => item.offerId._id);
        const idSet = new Set(ids);
        setWishlistIds(idSet);
        console.log(`✅ Fetched ${ids.length} wishlist items`);
        return idSet;
      }
      
      return new Set<string>();
    } catch (error) {
      console.error('❌ Error fetching wishlist IDs:', error);
      return new Set<string>();
    }
  }, []);

  // Toggle wishlist with API call
  const toggleWishlist = useCallback(async (offerId: string) => {
    if (!offerId) {
      console.error('❌ No offerId provided to toggleWishlist');
      return null;
    }

    // Store previous state for rollback
    const wasLiked = wishlistIds.has(offerId);
    
    try {
      // Optimistic update
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.delete(offerId);
        } else {
          newSet.add(offerId);
        }
        return newSet;
      });
      
      setOffers(prev =>
        prev.map(offer =>
          offer.id === offerId ? { ...offer, isLiked: !wasLiked } : offer
        )
      );

      console.log(`🔄 Toggling wishlist for offer: ${offerId}`);
      
      // Make API call
      const response = await wishlistService.toggleWishlist(offerId);
      
      if (response.action === 'added') {
        console.log('✅ Added to wishlist:', offerId);
      } else if (response.action === 'removed') {
        console.log('✅ Removed from wishlist:', offerId);
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Error toggling wishlist:', error);
      
      // Rollback on error
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
          newSet.add(offerId);
        } else {
          newSet.delete(offerId);
        }
        return newSet;
      });
      
      setOffers(prev =>
        prev.map(offer =>
          offer.id === offerId ? { ...offer, isLiked: wasLiked } : offer
        )
      );
      
      // Show error message
      const message = error.message || 'Failed to update wishlist';
      setError(message);
      
      throw error;
    }
  }, [wishlistIds]);

  // Sync offers with wishlist status
  const syncOffersWithWishlist = useCallback((offersList: Offer[]) => {
    return offersList.map(offer => ({
      ...offer,
      isLiked: wishlistIds.has(offer.id)
    }));
  }, [wishlistIds]);

  // format offer 
  const formatOffer = (offer: any, mallId: string, mallName: string, location: string, isFlashDeal = false): Offer => {
    const imageUrl = extractImageUrl(offer.offerImages);
    const discountValue = offer.offerValue || 0;
    const discountType = offer.offerType || 'percentage';
    const discountText = discountType === 'percentage'
      ? `${discountValue}% OFF`
      : `${discountValue} AED OFF`;
    
    const offerId = offer._id || offer.offerId || Math.random().toString();
    
    return {
      id: offerId,
      title: offer.offerTitle || 'Special Offer',
      description: offer.offerDescription || '',
      discount: discountText,
      validUntil: offer.offerEndDate || offer.validUntil || '2024-12-31',
      mallId,
      mallName,
      storeId: offer.shopId || offer.storeId || offer.sellerId?._id,
      storeName: offer.stallName || offer.sellerId?.shopName || 'Store',
      storeBrandImage: imageUrl,
      category: offer.stallCategory || 'General',
      image: imageUrl,
      isLiked: wishlistIds.has(offerId),
      distance: 2.5,  // number
      rating: 4.5,    // number
      price: 0,
      location,
      isFlashDeal,
    };
  };

  // Fetch active flash deals
  const fetchFlashDeals = useCallback(async () => {
    setIsLoadingFlashDeals(true);
    try {
      const url = `${API_BASE_URL}/auth/get-flash-deal-user-dashboard?page=1&limit=10`;
      console.log('🔥 Fetching flash deals from:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('⚠️ Flash deals endpoint not found (404)');
          setFlashDeals([]);
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Flash deals response:', data);
      
      // Handle the response structure based on your API
      let flashDealsArray: FlashDeal[] = [];
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          flashDealsArray = data.data;
        } else if (data.data.flashDeals && Array.isArray(data.data.flashDeals)) {
          flashDealsArray = data.data.flashDeals;
        } else if (data.data.deals && Array.isArray(data.data.deals)) {
          flashDealsArray = data.data.deals;
        }
      }
      
      setFlashDeals(flashDealsArray);
      console.log(`✅ Fetched ${flashDealsArray.length} active flash deals`);
      return flashDealsArray;
    } catch (error: any) {
      console.error('Error fetching flash deals:', error);
      setFlashDeals([]);
      return [];
    } finally {
      setIsLoadingFlashDeals(false);
    }
  }, []);

  // Convert flash deals to offer format and merge with regular offers
  const mergeFlashDealsWithOffers = useCallback((regularOffers: Offer[], flashDealsData: FlashDeal[]) => {
    if (!flashDealsData || flashDealsData.length === 0) {
      return regularOffers;
    }
    
    const flashDealOffers: Offer[] = flashDealsData
      .filter(deal => {
        // Only show active and enabled flash deals
        return deal.status === 'active' && deal.isEnabled === true;
      })
      .map(deal => {
        // Format discount based on deal type
        const discountValue = deal.dealValue || 0;
        const discountType = deal.dealType || 'percentage';
        const discountText = discountType === 'percentage'
          ? `${discountValue}% OFF`
          : `${discountValue} AED OFF`;
        
        // Extract deal ID
        const flashDealId = deal._id;
        
        // Extract title with flash icon
        const title = deal.title || 'Flash Deal';
        
        // Extract description
        const description = deal.description || 'Limited time flash deal!';
        
        // Extract image from banners array
        const imageUrl = deal.banners && deal.banners.length > 0 
          ? deal.banners[0].url 
          : FALLBACK_IMAGE;
        
        // Extract mall info
        const mallId = deal.mallId?._id || 'flash-deal';
        const mallName = deal.mallId?.mallName || 'Flash Deal';
        const location = deal.mallId?.location || selectedLocation;
        
        // Extract store/seller info
        const storeId = deal.sellerId?._id;
        const storeName = deal.sellerId?.name || deal.sellerId?.shopName || 'Store';
        
        // Format dates for display
        const startDate = deal.startTime ? new Date(deal.startTime) : null;
        const endDate = deal.endTime ? new Date(deal.endTime) : null;
        
        // Format valid until text
        let validUntilText = 'N/A';
        if (endDate) {
          validUntilText = endDate.toLocaleDateString();
        }
        
        // Calculate time remaining
        const getTimeRemaining = () => {
          if (!endDate) return '';
          const now = new Date();
          const diff = endDate.getTime() - now.getTime();
          if (diff <= 0) return 'Expired';
          
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h remaining`;
          }
          return `${hours}h ${minutes}m remaining`;
        };
        
        // Check if in wishlist
        const isLiked = wishlistIds.has(flashDealId);
        
        return {
          id: flashDealId,
          title: `⚡ ${title}`,
          description: description,
          discount: discountText,
          validUntil: deal.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          mallId: mallId,
          mallName: mallName,
          storeId: storeId,
          storeName: storeName,
          storeBrandImage: imageUrl,
          category: 'Flash Deal',
          image: imageUrl,
          isLiked: isLiked,
          distance: 1.0,
          rating: 5.0,
          price: 0,
          location: location,
          isFlashDeal: true,
          // Additional flash deal metadata for detailed view
          flashDealMetadata: {
            startTime: deal.startTime,
            endTime: deal.endTime,
            timeRemaining: getTimeRemaining(),
            termsAndConditions: deal.termsAndConditions,
            dealValue: deal.dealValue,
            dealType: deal.dealType,
          }
        };
      });
    
    // Sort flash deals by discount value (highest first)
    const sortedFlashDeals = flashDealOffers.sort((a, b) => {
      const discountA = parseInt(a.discount) || 0;
      const discountB = parseInt(b.discount) || 0;
      return discountB - discountA;
    });
    
    console.log(`📊 Merged offers: ${sortedFlashDeals.length} flash deals, ${regularOffers.length} regular offers`);
    
    // Merge flash deals at the top of the list
    return [...sortedFlashDeals, ...regularOffers];
  }, [selectedLocation, wishlistIds]);

  // fetch the malls from the database
  const fetchAllMallsFromDatabase = useCallback(async (): Promise<Mall[]> => {
    try {
      const url = `${API_BASE_URL}/auth/get-all-malls?page=1&limit=100`;
      console.log('🔍 Fetching ALL malls from database:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        credentials: 'include',
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await handleApiResponse(response);
      
      if (data.success && data.data && data.data.length > 0) {
        const formattedMalls: Mall[] = data.data.map((mall: any) => {
          let mallImage = FALLBACK_IMAGE;
          if (mall.vendorShopImages && mall.vendorShopImages.length > 0) {
            mallImage = extractImageUrl(mall.vendorShopImages[0]);
          } else if (mall.image) {
            mallImage = extractImageUrl(mall.image);
          }
          
          return {
            id: mall.vendorId,
            name: mall.mallName,
            location: mall.location,
            distance: 2.5,
            rating: 4.5,
            image: mallImage,
            offersCount: 0,
          };
        });
        
        console.log(`✅ Found ${formattedMalls.length} total malls in database`);
        allMallsCacheRef.current = formattedMalls;
        return formattedMalls;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching all malls:', error);
      return [];
    }
  }, []);

  // fetch the malls based on the location
  const fetchMallsByLocation = useCallback(async (location: string, offersData?: any[]) => {
    try {
      console.log('🏢 Building malls list ONLY from malls that have active offers');
      
      if (offersData && offersData.length > 0) {
        console.log(`📊 Using offers data to build malls list (${offersData.length} mall groups with offers)`);
        
        const mallsWithOffers: Mall[] = [];
        
        offersData.forEach((mallGroup: any) => {
          if (mallGroup.mallName && mallGroup.mallId) {
            const offersCount = mallGroup.totalOffers || mallGroup.offers?.length || 0;
            
            if (offersCount > 0) {
              let mallImage = FALLBACK_IMAGE;
              
              if (mallGroup.mallDetails?.vendorShopImages) {
                mallImage = extractImageUrl(mallGroup.mallDetails.vendorShopImages);
              } else if (mallGroup.mallImage) {
                mallImage = extractImageUrl(mallGroup.mallImage);
              } else if (mallGroup.offers && mallGroup.offers.length > 0) {
                const firstOffer = mallGroup.offers[0];
                if (firstOffer?.offerImages) {
                  mallImage = extractImageUrl(firstOffer.offerImages);
                }
              }
              
              const cachedMall = allMallsCacheRef.current.find(
                m => m.name.toLowerCase() === mallGroup.mallName.toLowerCase()
              );
              
              const mall: Mall = {
                id: mallGroup.mallId,
                name: mallGroup.mallName,
                location: mallGroup.location || location,
                distance: 2.5,
                rating: 4.5,
                image: cachedMall?.image || mallImage,
                offersCount: offersCount,
              };
              
              mallsWithOffers.push(mall);
              console.log(`✅ Added mall with offers: ${mall.name} (${mall.offersCount} offers)`);
            }
          }
        });
        
        console.log(`🎯 Final malls to display (with offers only): ${mallsWithOffers.length}`);
        setMalls(mallsWithOffers);
        setError(null);
        return mallsWithOffers;
      }
      
      console.log('⚠️ No offers data, filtering cached malls by offers count');
      
      let allMalls = allMallsCacheRef.current;
      
      if (allMalls.length === 0) {
        allMalls = await fetchAllMallsFromDatabase();
      }
      
      const mallsWithOffers = allMalls.filter(mall => {
        const locationMatch = mall.location?.toLowerCase() === location.toLowerCase();
        const offersCount = offersCountMapRef.current.get(mall.name) || 0;
        const hasOffers = offersCount > 0;
        
        return locationMatch && hasOffers;
      });
      
      console.log(`📍 Found ${mallsWithOffers.length} malls in ${location} with active offers`);
      
      const finalMalls = mallsWithOffers.map(mall => ({
        ...mall,
        offersCount: offersCountMapRef.current.get(mall.name) || 0
      }));
      
      if (finalMalls.length === 0) {
        console.log(`⚠️ No malls with offers found in ${location}`);
      }
      
      setMalls(finalMalls);
      setError(null);
      return finalMalls;
      
    } catch (error: any) {
      console.error('Error fetching malls:', error);
      setMalls([]);
      return [];
    }
  }, [fetchAllMallsFromDatabase]);

  // fetch offers based on the location
  const fetchOffersByLocation = useCallback(async (location: string, page: number = 1, limit: number = 10) => {
    try {
      const normalizeLocationForAPI = (loc: string): string => {
        const normalized = loc.toLowerCase().trim().replace(/\s+/g, ' ');
        
        const locationMap: { [key: string]: string } = {
          'abu dhabi': 'AbuDhabi',
          'abudhabi': 'AbuDhabi',
          'abu-dhabi': 'AbuDhabi',
          'dubai': 'Dubai',
          'hyderabad': 'Hyderabad',
          'bangalore': 'Bangalore',
          'bengaluru': 'Bangalore',
        };
        
        return locationMap[normalized] || loc;
      };
      
      const normalizedLocation = normalizeLocationForAPI(location);
      
      const url = `${API_BASE_URL}/auth/get-offers-based-on-user-location?location=${encodeURIComponent(normalizedLocation)}&page=${page}&limit=${limit}`;
      console.log(`📡 Fetching offers from: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        let allOffers: Offer[] = [];
        const newOffersCountMap = new Map<string, number>();
        let rawOffersData: any[] = [];
        
        if (Array.isArray(data.data)) {
          rawOffersData = data.data;
          
          for (const mallGroup of data.data) {
            if (mallGroup.mallName) {
              const offersCount = mallGroup.totalOffers || 0;
              newOffersCountMap.set(mallGroup.mallName, offersCount);
            }
            
            if (mallGroup.offers && Array.isArray(mallGroup.offers)) {
              const mallOffers = mallGroup.offers.map((offer: any) => 
                formatOffer(offer, mallGroup.mallId, mallGroup.mallName, normalizedLocation, false)
              );
              
              allOffers = [...allOffers, ...mallOffers];
            }
          }
        }
        
        offersCountMapRef.current = newOffersCountMap;
        
        // Sync with wishlist before setting
        const syncedOffers = syncOffersWithWishlist(allOffers);
        setOffers(syncedOffers);
        
        setPagination({
          page: data.currentPage || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || 1,
          totalItems: data.totalMalls || allOffers.length,
        });
        
        setError(null);
        return { offers: syncedOffers, offersMap: newOffersCountMap, rawOffersData };
      } else {
        setOffers([]);
        setError(data.message || 'No offers found');
        return { offers: [], offersMap: new Map(), rawOffersData: [] };
      }
    } catch (error: any) {
      console.error('Error fetching offers by location:', error);
      
      if (error.name === 'AbortError') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        setError('Unable to connect to server. Please try again later.');
      }
      
      setOffers([]);
      return { offers: [], offersMap: new Map(), rawOffersData: [] };
    }
  }, [formatOffer, syncOffersWithWishlist]);

  // load the final data 
  const loadData = useCallback(async (location: string, page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch wishlist IDs first
      await fetchWishlistIds();
      
      // Fetch flash deals and offers in parallel
      const flashDealsPromise = fetchFlashDeals();
      const { offers: fetchedOffers, offersMap, rawOffersData } = await fetchOffersByLocation(location, page, pagination.limit);
      
      const flashDealsData = await flashDealsPromise;
      
      // Log flash deals data for debugging
      console.log('📊 Flash deals data received:', flashDealsData.length);
      if (flashDealsData.length > 0) {
        console.log('📊 Sample flash deal:', flashDealsData[0]);
      }
      
      // Merge flash deals with regular offers (flash deals will appear at the top)
      const mergedOffers = mergeFlashDealsWithOffers(fetchedOffers, flashDealsData);
      console.log(`📊 Total offers after merge: ${mergedOffers.length} (${flashDealsData.length} flash deals, ${fetchedOffers.length} regular offers)`);
      
      setOffers(mergedOffers);
      
      if (offersMap.size > 0) {
        offersCountMapRef.current = offersMap;
      }
      
      const fetchedMalls = await fetchMallsByLocation(location, rawOffersData);
      setSelectedMall(null);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchOffersByLocation, fetchMallsByLocation, fetchFlashDeals, fetchWishlistIds, mergeFlashDealsWithOffers, pagination.limit]);

  // change user's location
  const changeLocation = useCallback((location: string) => {
    setSelectedLocation(location);
    setPagination(prev => ({ ...prev, page: 1 }));
    loadData(location, 1);
  }, [loadData]);

  // fetch the offer based on the mall
  const fetchOffersByMall = useCallback(async (mallName: string, page: number = 1, limit: number = 10) => {
    try {
      const encodedMallName = encodeURIComponent(mallName);
      const url = `${API_BASE_URL}/auth/get-offers-based-on-mall/${encodedMallName}?page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await handleApiResponse(response);
      
      if (data.success && data.data) {
        let formattedOffers: Offer[] = [];
        
        if (data.data.offers && Array.isArray(data.data.offers)) {
          formattedOffers = data.data.offers.map((offer: any) =>
            formatOffer(offer, data.data.mallId, data.data.mallName, selectedLocation, false)
          );
        }
        
        // Sync with wishlist
        const syncedOffers = syncOffersWithWishlist(formattedOffers);
        
        // Merge with existing flash deals
        const mergedOffers = mergeFlashDealsWithOffers(syncedOffers, flashDeals);
        setOffers(mergedOffers);
        
        setPagination({
          page: data.currentPage || page,
          limit,
          totalPages: data.totalPages || 1,
          totalItems: data.totalOffers || formattedOffers.length,
        });
        
        setError(null);
      } else {
        setOffers(flashDeals.length > 0 ? mergeFlashDealsWithOffers([], flashDeals) : []);
        setError(data.message || 'No offers found for this mall');
      }
    } catch (error) {
      console.error('Error fetching offers by mall:', error);
      setOffers(flashDeals.length > 0 ? mergeFlashDealsWithOffers([], flashDeals) : []);
      setError('Failed to load offers for this mall');
    }
  }, [selectedLocation, flashDeals, mergeFlashDealsWithOffers, formatOffer, syncOffersWithWishlist]);

  // load the offers inside the mall
  const loadMallOffers = useCallback((mallName: string) => {
    setSelectedMall(mallName);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOffersByMall(mallName, 1, pagination.limit);
  }, [fetchOffersByMall, pagination.limit]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Refresh wishlist first
      await fetchWishlistIds();
      
      const refreshPromises = [fetchFlashDeals()];
      
      if (selectedMall) {
        refreshPromises.push(fetchOffersByMall(selectedMall, pagination.page, pagination.limit));
      } else {
        refreshPromises.push(loadData(selectedLocation, pagination.page));
      }
      
      await Promise.all(refreshPromises);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedMall, selectedLocation, pagination.page, pagination.limit, fetchOffersByMall, loadData, fetchFlashDeals, fetchWishlistIds]);

  useEffect(() => {
    loadData(selectedLocation, 1);
  }, []);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getFilteredOffers = () => {
    let filtered = [...offers];
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(
        offer => offer.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    const discountValue = parseInt(filters.minDiscount.toString());
    if (discountValue > 0) {
      filtered = filtered.filter(offer => {
        const offerDiscount = parseInt(offer.discount?.replace(/%|AED OFF/g, '') || '0');
        return offerDiscount >= discountValue;
      });
    }
    
    switch (filters.sortBy) {
      case 'distance':
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        filtered.sort((a, b) => {
          const discountA = parseInt(a.discount?.replace(/%|AED OFF/g, '') || '0');
          const discountB = parseInt(b.discount?.replace(/%|AED OFF/g, '') || '0');
          return discountB - discountA;
        });
        break;
    }
    
    return filtered;
  };

  const loadAllOffers = useCallback(() => {
    setSelectedMall(null);
    loadData(selectedLocation, 1);
  }, [loadData, selectedLocation]);

  const loadNextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      const nextPage = pagination.page + 1;
      setPagination(prev => ({ ...prev, page: nextPage }));
      if (selectedMall) {
        fetchOffersByMall(selectedMall, nextPage, pagination.limit);
      } else {
        loadData(selectedLocation, nextPage);
      }
    }
  }, [pagination.page, pagination.totalPages, pagination.limit, selectedMall, selectedLocation, fetchOffersByMall, loadData]);

  const loadPrevPage = useCallback(() => {
    if (pagination.page > 1) {
      const prevPage = pagination.page - 1;
      setPagination(prev => ({ ...prev, page: prevPage }));
      if (selectedMall) {
        fetchOffersByMall(selectedMall, prevPage, pagination.limit);
      } else {
        loadData(selectedLocation, prevPage);
      }
    }
  }, [pagination.page, pagination.limit, selectedMall, selectedLocation, fetchOffersByMall, loadData]);

  // Check if offer is in wishlist
  const isInWishlist = useCallback((offerId: string): boolean => {
    return wishlistIds.has(offerId);
  }, [wishlistIds]);

  return {
    offers: getFilteredOffers(),
    malls,
    flashDeals,
    wishlistIds: Array.from(wishlistIds),
    filters,
    isLoading,
    isLoadingFlashDeals,
    isRefreshing,
    selectedLocation,
    selectedMall,
    error,
    pagination,
    changeLocation,
    loadMallOffers,
    loadAllOffers,
    refreshData,
    loadNextPage,
    loadPrevPage,
    toggleWishlist,
    isInWishlist,
    updateFilters,
  };
};