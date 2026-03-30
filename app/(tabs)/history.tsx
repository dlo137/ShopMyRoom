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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistory, GenerationWithProducts } from '../../hooks/useHistory';
import { ProductResult } from '../../types/product';
import { colors, radius, shadow, spacing } from '../../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - 12) / 2;

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
      pathname: '/results',
      params: {
        generatedImageUrl: gen.generated_image_url ?? gen.original_image_url ?? '',
        productsJson: JSON.stringify(productsJson),
      },
    });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading && !isPlaceholder) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading your designs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !isPlaceholder) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={s.ctaButton} onPress={refetch}>
            <Text style={s.ctaButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (generations.length === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="color-wand-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>No designs yet</Text>
          <Text style={s.emptySubtitle}>
            Take a photo of your room and pick a style to generate your first AI redesign.
          </Text>
          <TouchableOpacity style={s.ctaButton} onPress={() => router.push('/(tabs)/')}>
            <Ionicons name="sparkles" size={15} color="#fff" />
            <Text style={s.ctaButtonText}>Design a Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={generations}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>My Designs</Text>
              <Text style={s.headerSubtitle}>
                {generations.length} room{generations.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={s.newButton}
              onPress={() => router.push('/(tabs)/')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.newButtonText}>New</Text>
            </TouchableOpacity>
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
              <View style={s.imageWrap}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
                ) : (
                  <View style={s.imagePlaceholder}>
                    <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                  </View>
                )}
                <View style={[s.badge, isComplete ? s.badgeDone : s.badgePending]}>
                  <Text style={s.badgeText}>{isComplete ? 'Done' : 'Processing'}</Text>
                </View>
              </View>

              <View style={s.cardBody}>
                <Text style={s.styleName}>{item.style}</Text>
                <View style={s.cardMeta}>
                  <Text style={s.dateText}>{formatDate(item.created_at)}</Text>
                  {item.products.length > 0 && (
                    <View style={s.itemsBadge}>
                      <Text style={s.itemsText}>{item.products.length} items</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadow.md,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Grid
  grid: {
    padding: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: 40,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  newButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
  },
  imagePlaceholder: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeDone: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  badgePending: {
    backgroundColor: 'rgba(217,119,6,0.85)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  styleName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemsBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  itemsText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
