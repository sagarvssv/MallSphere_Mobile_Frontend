import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OfferCard from '../../components/offers/OfferCard';
import { useOffers } from '../../hooks/useOffers';

const { width, height } = Dimensions.get('window');

export default function MallDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { malls, offers, isLoading, loadMallOffers, selectedMall } = useOffers();
  const [activeTab, setActiveTab] = useState('offers');
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Find the mall by id
  const mall = malls.find(m => m.id === id);
  
  // Filter offers for this specific mall
  const mallOffers = offers.filter(o => o.mallId === id);

  useEffect(() => {
    if (mall) {
      console.log(`🛍️ Loading offers for mall: ${mall.name}`);
      loadMallOffers(mall.name);
    }
  }, [mall]);

  const handleShare = async () => {
    if (!mall) return;
    try {
      await Share.share({
        message: `Check out ${mall.name} in ${mall.location}! Great offers and deals available.`,
        title: `Share ${mall.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  // Show loading indicator while data is being fetched
  if (isLoading && malls.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading mall details...</Text>
      </View>
    );
  }

  // Show not found only after loading is complete and mall doesn't exist
  if (!mall && !isLoading) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="mall" size={80} color="#ccc" />
        <Text style={styles.notFoundText}>Mall not found</Text>
        <TouchableOpacity onPress={handleGoBack} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If we have a mall but offers are still loading
  if (isLoading && mallOffers.length === 0) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: mall.image }} 
            style={styles.image}
            onLoadStart={() => setIsImageLoaded(false)}
            onLoadEnd={() => setIsImageLoaded(true)}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Feather name="share-2" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{mall.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.location}>{mall.location}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="local-offer" size={20} color="#FF6B35" />
              <Text style={styles.statText}>{mall.offersCount} Offers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color="#FFB800" />
              <Text style={styles.statText}>{mall.rating || 4.5} Rating</Text>
            </View>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
              onPress={() => setActiveTab('offers')}>
              <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
                Available Offers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}>
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                Information
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'offers' && (
            <View style={styles.loadingOffersContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading amazing offers...</Text>
            </View>
          )}
          
          {activeTab === 'info' && (
            <View style={styles.infoContainer}>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>About {mall.name}</Text>
                <Text style={styles.infoText}>
                  Discover the best shopping experience at {mall.name}. 
                  Located in the heart of {mall.location}, this premier destination 
                  offers a wide range of international and local brands, 
                  entertainment options, and dining experiences.
                </Text>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Opening Hours</Text>
                <View style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>Monday - Thursday:</Text>
                  <Text style={styles.hoursTime}>10:00 AM - 10:00 PM</Text>
                </View>
                <View style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>Friday - Sunday:</Text>
                  <Text style={styles.hoursTime}>10:00 AM - 12:00 AM</Text>
                </View>
              </View>
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Contact Information</Text>
                <TouchableOpacity style={styles.contactRow}>
                  <Ionicons name="call-outline" size={20} color="#FF6B35" />
                  <Text style={styles.contactText}>+971 4 123 4567</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={20} color="#FF6B35" />
                  <Text style={styles.contactText}>info@{mall.name.toLowerCase().replace(/\s/g, '')}.com</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactRow}>
                  <Ionicons name="globe-outline" size={20} color="#FF6B35" />
                  <Text style={styles.contactText}>www.{mall.name.toLowerCase().replace(/\s/g, '')}.com</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: mall.image }} 
          style={styles.image}
          onLoadStart={() => setIsImageLoaded(false)}
          onLoadEnd={() => setIsImageLoaded(true)}
        />
        {!isImageLoaded && (
          <View style={styles.imageLoader}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.imageGradient}
        />
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Feather name="share-2" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{mall.name}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{mall.location}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialIcons name="local-offer" size={20} color="#FF6B35" />
            <Text style={styles.statText}>{mallOffers.length} Active Offers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#FFB800" />
            <Text style={styles.statText}>{mall.rating || 4.5} Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <FontAwesome5 name="store" size={18} color="#4CAF50" />
            <Text style={styles.statText}>50+ Stores</Text>
          </View>
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
            onPress={() => setActiveTab('offers')}>
            <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
              Available Offers
            </Text>
            {activeTab === 'offers' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}>
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Information
            </Text>
            {activeTab === 'info' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>
        
        {activeTab === 'offers' && (
          <>
            {mallOffers.length > 0 ? (
              <View style={styles.offersList}>
                {mallOffers.map((offer, index) => (
                  <View key={offer.id} style={styles.offerCardWrapper}>
                    <OfferCard
                      offer={offer}
                      onPress={() => router.push(`/(tabs)/offer-details/${offer.id}`)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noOffersContainer}>
                <View style={styles.noOffersIcon}>
                  <MaterialIcons name="local-offer" size={60} color="#ccc" />
                </View>
                <Text style={styles.noOffersTitle}>No Offers Available</Text>
                <Text style={styles.noOffersText}>
                  There are currently no active offers at {mall.name}. 
                  Please check back later for amazing deals!
                </Text>
              </View>
            )}
          </>
        )}
        
        {activeTab === 'info' && (
          <View style={styles.infoContainer}>
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>About {mall.name}</Text>
              <Text style={styles.infoText}>
                Discover the best shopping experience at {mall.name}. 
                Located in the heart of {mall.location}, this premier destination 
                offers a wide range of international and local brands, 
                entertainment options, and dining experiences.
              </Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Opening Hours</Text>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Monday - Thursday:</Text>
                <Text style={styles.hoursTime}>10:00 AM - 10:00 PM</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Friday - Sunday:</Text>
                <Text style={styles.hoursTime}>10:00 AM - 12:00 AM</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                <View style={styles.amenityItem}>
                  <FontAwesome5 name="wifi" size={20} color="#FF6B35" />
                  <Text style={styles.amenityText}>Free WiFi</Text>
                </View>
                <View style={styles.amenityItem}>
                  <FontAwesome5 name="parking" size={20} color="#FF6B35" />
                  <Text style={styles.amenityText}>Free Parking</Text>
                </View>
                <View style={styles.amenityItem}>
                  <Ionicons name="restaurant" size={20} color="#FF6B35" />
                  <Text style={styles.amenityText}>Food Court</Text>
                </View>
                <View style={styles.amenityItem}>
                  <FontAwesome5 name="child" size={20} color="#FF6B35" />
                  <Text style={styles.amenityText}>Kids Area</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Contact Information</Text>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call-outline" size={20} color="#FF6B35" />
                <Text style={styles.contactText}>+971 4 123 4567</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail-outline" size={20} color="#FF6B35" />
                <Text style={styles.contactText}>info@{mall.name.toLowerCase().replace(/\s/g, '')}.com</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="globe-outline" size={20} color="#FF6B35" />
                <Text style={styles.contactText}>www.{mall.name.toLowerCase().replace(/\s/g, '')}.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: 280,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  offersList: {
    marginTop: 8,
  },
  offerCardWrapper: {
    marginBottom: 16,
  },
  loadingOffersContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  notFoundText: {
    fontSize: 20,
    color: '#333',
    marginTop: 16,
    marginBottom: 20,
    fontWeight: '500',
  },
  goBackButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noOffersContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginTop: 20,
  },
  noOffersIcon: {
    marginBottom: 16,
  },
  noOffersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noOffersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hoursDay: {
    fontSize: 14,
    color: '#666',
  },
  hoursTime: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    fontSize: 14,
    color: '#333',
  },
});