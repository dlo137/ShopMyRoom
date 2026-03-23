import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductResult } from '../types/product';
import ProductCard from './ProductCard';
import { colors, radius } from '../lib/theme';

type Props = {
  products: ProductResult[];
};

export default function ProductShelf({ products }: Props) {
  const visible = products.filter((r) => r.product !== null);

  return (
    <View style={s.section}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="bag-outline" size={18} color={colors.text} />
          <Text style={s.title}>Shop This Room</Text>
        </View>
        {visible.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{visible.length} items</Text>
          </View>
        )}
      </View>

      {visible.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={28} color={colors.textMuted} />
          <Text style={s.emptyText}>No products found for this design.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.list}
        >
          {visible.map((r, i) => (
            <ProductCard key={i} product={r.product!} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
