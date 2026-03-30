import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../lib/theme';

export const ROOMS = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Home Office',
  'Kids Room',
  'Outdoor',
];

const ROOM_META: Record<string, { color: string; emoji: string }> = {
  'Living Room': { color: '#E8E4DC', emoji: '🛋️' },
  'Bedroom':     { color: '#D4E4EC', emoji: '🛏️' },
  'Kitchen':     { color: '#EDE0D4', emoji: '🍳' },
  'Bathroom':    { color: '#DDE8E2', emoji: '🚿' },
  'Dining Room': { color: '#E4DCCC', emoji: '🪑' },
  'Home Office': { color: '#DCDAD6', emoji: '💻' },
  'Kids Room':   { color: '#EAD4E4', emoji: '🧸' },
  'Outdoor':     { color: '#D4ECD4', emoji: '🌿' },
};

type Props = {
  selectedRoom: string;
  onRoomSelect: (room: string) => void;
};

export default function RoomSelector({ selectedRoom, onRoomSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.container}
    >
      {ROOMS.map((room) => {
        const meta = ROOM_META[room] ?? { color: '#E8E8E8', emoji: '🏠' };
        const isSelected = selectedRoom === room;
        return (
          <TouchableOpacity
            key={room}
            onPress={() => onRoomSelect(room)}
            activeOpacity={0.8}
            style={s.card}
          >
            <View style={[s.swatch, { backgroundColor: meta.color }, isSelected && s.swatchSelected]}>
              <Text style={s.emoji}>{meta.emoji}</Text>
            </View>
            <Text style={[s.label, isSelected && s.labelSelected]}>{room}</Text>
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
