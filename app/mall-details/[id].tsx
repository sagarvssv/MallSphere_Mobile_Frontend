import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useOffers } from '../../hooks/useOffers';
import OfferCard from '../../components/offers/OfferCard';
import { useEffect } from 'react';

export default function MallDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { malls, offers, loadMallOffers, selectedMall } = useOffers();

  const mall = malls.find(m => m.id === id);
  const mallOffers = offers.filter(o => o.mallId === id);

  useEffect(() => {
    if (mall) {
      loadMallOffers(mall.name);
    }
  }, [mall]);

  if (!mall) {
    return (
      <View style={styles.center}>
        <Text>Mall not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: mall.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name}>{mall.name}</Text>
        <Text style={styles.location}>{mall.location}</Text>
        <Text style={styles.offersCount}>{mall.offersCount} offers available</Text>
        
        <Text style={styles.sectionTitle}>Available Offers</Text>
        {mallOffers.map(offer => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onPress={() => router.push(`/(tabs)/offer-details/${offer.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  offersCount: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});