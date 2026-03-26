import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BARS = [
  { label: 'Without App', hours: 8, color: '#e2e8f0' },
  { label: 'With App',    hours: 1, color: '#6366f1' },
];

const MAX_HOURS = 8;
const BAR_MAX_HEIGHT = 160;

export default function TimeChart() {
  return (
    <View style={s.container}>
      <Text style={s.chartTitle}>Time spent per project</Text>
      <View style={s.chart}>
        {BARS.map((bar) => (
          <View key={bar.label} style={s.barGroup}>
            <Text style={s.barValue}>{bar.hours}h</Text>
            <View style={s.barTrack}>
              <View
                style={[
                  s.bar,
                  {
                    height: (bar.hours / MAX_HOURS) * BAR_MAX_HEIGHT,
                    backgroundColor: bar.color,
                  },
                ]}
              />
            </View>
            <Text style={s.barLabel}>{bar.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.savingsBadge}>
        <Text style={s.savingsText}>85% faster ⚡</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 32,
    height: BAR_MAX_HEIGHT + 20,
  },
  barGroup: {
    alignItems: 'center',
    gap: 6,
  },
  barValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  barTrack: {
    width: 56,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  savingsBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
});
