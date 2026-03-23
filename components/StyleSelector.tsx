import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../lib/theme';

type Props = {
  styles: string[];
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
};

const STYLE_META: Record<string, { color: string; emoji: string }> = {
  Modern:        { color: '#E8E4DC', emoji: '🏛' },
  Scandinavian:  { color: '#DDE8E2', emoji: '🌿' },
  Bohemian:      { color: '#EDE0D4', emoji: '🪴' },
  Industrial:    { color: '#DCDAD6', emoji: '🔩' },
  Coastal:       { color: '#D4E4EC', emoji: '🌊' },
  Maximalist:    { color: '#EAD4E4', emoji: '✨' },
  'Mid-Century': { color: '#E4DCCC', emoji: '🪑' },
  Minimalist:    { color: '#EBEBEB', emoji: '◻️' },
};

export default function StyleSelector({ styles, selectedStyle, onStyleSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      {styles.map((style) => {
        const meta = STYLE_META[style] ?? { color: '#E8E8E8', emoji: '🏠' };
        const isSelected = selectedStyle === style;
        return (
          <TouchableOpacity
            key={style}
            onPress={() => onStyleSelect(style)}
            activeOpacity={0.8}
            style={[s.card, isSelected && s.cardSelected]}
          >
            <View style={[s.swatch, { backgroundColor: meta.color }, isSelected && s.swatchSelected]}>
              <Text style={s.emoji}>{meta.emoji}</Text>
            </View>
            <Text style={[s.label, isSelected && s.labelSelected]}>{style}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  card: {
    width: 76,
    alignItems: 'center',
    gap: 6,
  },
  cardSelected: {},
  swatch: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow.sm,
  },
  swatchSelected: {
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
});
