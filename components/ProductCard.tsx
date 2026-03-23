import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Product } from '../types/product';
import { colors, radius, shadow } from '../lib/theme';

type Props = {
  product: Product;
};

const SOURCE_LABELS: Record<string, string> = {
  wayfair: 'Wayfair',
  amazon: 'Amazon',
  google_shopping: 'Google',
};

export default function ProductCard({ product }: Props) {
  return (
    <View style={s.card}>
      <View style={s.imageWrap}>
        <Image source={{ uri: product.image_url }} style={s.image} resizeMode="cover" />
        {product.source && (
          <View style={s.sourceBadge}>
            <Text style={s.sourceText}>{SOURCE_LABELS[product.source] ?? product.source}</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        <Text style={s.price}>{product.price}</Text>
        <TouchableOpacity
          style={s.button}
          onPress={() => product.buy_url && Linking.openURL(product.buy_url)}
          activeOpacity={0.8}
        >
          <Text style={s.buttonText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: 156,
    marginRight: 12,
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
    height: 130,
    backgroundColor: colors.surfaceSecondary,
  },
  sourceBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
  body: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 17,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primaryFg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
