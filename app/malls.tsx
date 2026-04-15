import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useOffers } from '../hooks/useOffers';
import MallCard from '../components/offers/MallCard';
import { router } from 'expo-router';

export default function MallsScreen() {
  const { malls, isLoading, selectedLocation } = useOffers();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading malls...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Malls in {selectedLocation}</Text>
      <FlatList
        data={malls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MallCard
            mall={item}
            onPress={() => router.push(`/(tabs)/mall-details/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
  },
  list: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});