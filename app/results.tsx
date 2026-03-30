import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { ProductResult } from '../types/product';
import ProductShelf from '../components/ProductShelf';
import { colors, radius, shadow, spacing } from '../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ResultsScreen() {
  const router = useRouter();
  const { generatedImageUrl, originalImageUri, productsJson, selectedStyle } = useLocalSearchParams<{
    generatedImageUrl: string;
    originalImageUri: string;
    productsJson: string;
    selectedStyle: string;
  }>();

  const products: ProductResult[] = productsJson ? JSON.parse(productsJson) : [];
  const [showBefore, setShowBefore] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasOriginal = Boolean(originalImageUri);
  const displayImage = showBefore ? originalImageUri : generatedImageUrl;

  async function downloadToLocal(): Promise<string> {
    const localUri = FileSystem.cacheDirectory + `room-${Date.now()}.jpg`;
    const { uri } = await FileSystem.downloadAsync(generatedImageUrl, localUri);
    return uri;
  }

  async function handleRegenerate() {
    router.push({
      pathname: '/(tabs)/',
      params: {
        originalImageUri: originalImageUri ?? '',
        selectedStyle: selectedStyle ?? 'Modern',
      },
    });
  }

  async function handleSave() {
    if (!generatedImageUrl) return;
    setSaving(true);
    try {
      const localUri = await downloadToLocal();
      await Share.share(
        Platform.OS === 'ios'
          ? { url: localUri }
          : { message: generatedImageUrl }
      );
    } catch (err: any) {
      if (!err?.message?.includes('cancel')) {
        console.error('[results] save error:', err);
        Alert.alert('Save Failed', 'Could not save the image. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!generatedImageUrl) return;
    try {
      const localUri = await downloadToLocal();
      await Share.share(
        Platform.OS === 'ios'
          ? { url: localUri, message: 'Check out my AI room design from ShopMyRoom!' }
          : { message: `Check out my AI room design from ShopMyRoom! ${generatedImageUrl}` }
      );
    } catch (err: any) {
      if (!err?.message?.includes('cancel')) {
        Alert.alert('Share Failed', 'Could not share the image. Please try again.');
      }
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={s.heroWrap}>
          {displayImage ? (
            <Image
              source={{ uri: displayImage }}
              style={s.hero}
              resizeMode="cover"
            />
          ) : (
            <View style={[s.hero, s.heroPlaceholder]}>
              <Ionicons name="image-outline" size={40} color={colors.textMuted} />
            </View>
          )}

          {/* Before / After toggle */}
          {hasOriginal && (
            <View style={s.toggle}>
              <TouchableOpacity
                style={[s.toggleTab, !showBefore && s.toggleTabActive]}
                onPress={() => setShowBefore(false)}
              >
                <Text style={[s.toggleText, !showBefore && s.toggleTextActive]}>After</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.toggleTab, showBefore && s.toggleTabActive]}
                onPress={() => setShowBefore(true)}
              >
                <Text style={[s.toggleText, showBefore && s.toggleTextActive]}>Before</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Label badge */}
          <View style={s.labelBadge}>
            <Ionicons name="sparkles" size={11} color={colors.pro} />
            <Text style={s.labelBadgeText}>{showBefore ? 'Original' : 'AI Redesign'}</Text>
          </View>
        </View>

        {/* Action row */}
        <View style={s.actions}>
          <ActionButton
            icon="arrow-undo-outline"
            label="Try Again"
            onPress={() => router.push('/(tabs)/')}
          />
          <ActionButton
            icon="refresh-outline"
            label="Regenerate"
            onPress={handleRegenerate}
          />
          <ActionButton
            icon="bookmark-outline"
            label={saving ? 'Saving...' : 'Save'}
            onPress={handleSave}
            disabled={saving}
          />
          <ActionButton
            icon="share-outline"
            label="Share"
            onPress={handleShare}
          />
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Product shelf */}
        <ProductShelf products={products} />

        {/* Bottom CTA */}
        <View style={s.cta}>
          <TouchableOpacity
            style={s.ctaButton}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.85}
          >
            <Ionicons name="color-wand-outline" size={16} color="#fff" />
            <Text style={s.ctaButtonText}>Design Another Room</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.7} disabled={disabled}>
      <View style={[s.actionIcon, disabled && { opacity: 0.4 }]}>
        <Ionicons name={icon} size={20} color={colors.text} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: 40,
    gap: 24,
  },

  // Hero
  heroWrap: {
    position: 'relative',
  },
  hero: {
    width: SCREEN_WIDTH,
    height: Math.round(SCREEN_WIDTH * 0.75),
    backgroundColor: colors.surfaceSecondary,
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.full,
    padding: 3,
    gap: 2,
  },
  toggleTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  toggleTabActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  toggleTextActive: {
    color: colors.text,
  },
  labelBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  labelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  // CTA
  cta: {
    paddingHorizontal: spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadow.md,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
