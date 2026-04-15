import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useOffers } from '../hooks/useOffers';
import OfferCard from '../components/offers/OfferCard';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { offers, malls } = useOffers();

  const filteredOffers = offers.filter(offer => 
    offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.mallName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search offers, malls, brands..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoFocus
      />
      <FlatList
        data={filteredOffers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OfferCard
            offer={item}
            onPress={() => {
              // Navigate to offer details
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 16,
  },
});