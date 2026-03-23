import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useHistory, GenerationWithProducts } from '../../hooks/useHistory';
import { ProductResult } from '../../types/product';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;

const PLACEHOLDER_GENERATIONS: GenerationWithProducts[] = [
  {
    id: '1',
    user_id: 'placeholder',
    original_image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    generated_image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    style: 'Modern',
    status: 'complete',
    created_at: new Date().toISOString(),
    products: [{} as any, {} as any, {} as any],
  },
  {
    id: '2',
    user_id: 'placeholder',
    original_image_url: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400',
    generated_image_url: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?w=400',
    style: 'Scandinavian',
    status: 'complete',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    products: [{} as any, {} as any],
  },
  {
    id: '3',
    user_id: 'placeholder',
    original_image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400',
    generated_image_url: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400',
    style: 'Bohemian',
    status: 'complete',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    products: [{} as any, {} as any, {} as any, {} as any],
  },
  {
    id: '4',
    user_id: 'placeholder',
    original_image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400',
    generated_image_url: null,
    style: 'Industrial',
    status: 'processing',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    products: [],
  },
];

export default function HistoryScreen() {
  const router = useRouter();
  const { generations: fetchedGenerations, loading, error, refetch } = useHistory();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const isPlaceholder = error?.includes('authenticated') || error?.includes('Not auth');
  const generations = isPlaceholder ? PLACEHOLDER_GENERATIONS : fetchedGenerations;

  function handleCardPress(gen: GenerationWithProducts) {
    const productsJson: ProductResult[] = gen.products.map((p) => ({
      query: p.name,
      product: p,
    }));
    router.push({
      pathname: '/(tabs)/results',
      params: {
        generatedImageUrl: gen.generated_image_url ?? gen.original_image_url ?? '',
        productsJson: JSON.stringify(productsJson),
      },
    });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading && !isPlaceholder) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={s.loadingText}>Loading your designs...</Text>
      </View>
    );
  }

  if (error && !isPlaceholder) {
    return (
      <View style={s.centered}>
        <Text style={s.errorIcon}>⚠️</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryButton} onPress={refetch}>
          <Text style={s.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (generations.length === 0) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyIcon}>🛋️</Text>
        <Text style={s.emptyTitle}>No designs yet</Text>
        <Text style={s.emptySubtitle}>
          Take a photo of your room and pick a style to generate your first redesign.
        </Text>
        <TouchableOpacity style={s.ctaButton} onPress={() => router.push('/(tabs)/')}>
          <Text style={s.ctaButtonText}>Design a Room</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={generations}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={s.grid}
      columnWrapperStyle={s.row}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={s.header}>
          <Text style={s.headerTitle}>My Designs</Text>
          <Text style={s.headerCount}>{generations.length} room{generations.length !== 1 ? 's' : ''}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const imageUri = item.generated_image_url ?? item.original_image_url;
        const isComplete = item.status === 'complete';

        return (
          <TouchableOpacity
            style={s.card}
            onPress={() => handleCardPress(item)}
            activeOpacity={0.85}
          >
            <View style={s.imageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
              ) : (
                <View style={s.imagePlaceholder}>
                  <Text style={s.imagePlaceholderIcon}>🏠</Text>
                </View>
              )}
              <View style={[s.statusBadge, isComplete ? s.statusComplete : s.statusProcessing]}>
                <Text style={s.statusText}>{isComplete ? 'Done' : 'Processing'}</Text>
              </View>
            </View>

            <View style={s.cardBody}>
              <Text style={s.styleName}>{item.style}</Text>
              <View style={s.cardMeta}>
                <Text style={s.dateText}>{formatDate(item.created_at)}</Text>
                {item.products.length > 0 && (
                  <Text style={s.productCount}>{item.products.length} items</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  // STATES
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#f2f2f7',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 36,
  },
  errorText: {
    fontSize: 15,
    color: '#c0392b',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // GRID
  grid: {
    padding: 16,
    paddingTop: 64,
    paddingBottom: 40,
    backgroundColor: '#f2f2f7',
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerCount: {
    fontSize: 14,
    color: '#888',
  },

  // CARD
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
  },
  imagePlaceholder: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 32,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusComplete: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  statusProcessing: {
    backgroundColor: 'rgba(234,179,8,0.85)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  productCount: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
});
