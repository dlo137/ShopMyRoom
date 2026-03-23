import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../lib/theme';

export type LoadingStatus = 'uploading' | 'generating' | 'extracting' | 'searching' | 'saving';

const STEPS: { status: LoadingStatus; label: string }[] = [
  { status: 'uploading',  label: 'Upload photo' },
  { status: 'generating', label: 'Generate design' },
  { status: 'extracting', label: 'Identify items' },
  { status: 'searching',  label: 'Find products' },
  { status: 'saving',     label: 'Save results' },
];

type Props = {
  status: LoadingStatus;
};

export default function GenerationLoader({ status }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <View style={s.container}>
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <View key={step.status} style={s.row}>
            <View style={[s.dot, isDone && s.dotDone, isActive && s.dotActive]}>
              {isDone && <Text style={s.check}>✓</Text>}
            </View>
            <Text style={[s.label, isActive && s.labelActive, isDone && s.labelDone]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotDone: {
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  check: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  labelDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
