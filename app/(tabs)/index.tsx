import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGenerate } from '../../hooks/useGenerate';
import { STYLES } from '../../lib/nanoBanana';
import { colors, radius, shadow, spacing } from '../../lib/theme';
import StyleSelector from '../../components/StyleSelector';
import RoomUploader, { LoadingStatus } from '../../components/RoomUploader';

const ACTIVE_STATUSES = ['uploading', 'generating', 'extracting', 'searching', 'saving'] as const;
type ActiveStatus = typeof ACTIVE_STATUSES[number];

function isActive(status: string): status is ActiveStatus {
  return ACTIVE_STATUSES.includes(status as ActiveStatus);
}

export default function HomeScreen() {
  const router = useRouter();
  const { status, generatedImageUrl, products, error, startGeneration } = useGenerate();
  const [selectedStyle, setSelectedStyle] = useState('Modern');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'done') {
      router.push({
        pathname: '/(tabs)/results',
        params: {
          generatedImageUrl: generatedImageUrl ?? '',
          originalImageUri: imageUri ?? '',
          productsJson: JSON.stringify(products),
        },
      });
    }
  }, [status]);

  const isGenerating = isActive(status);
  const canGenerate = imageUri !== null && !isGenerating;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>ShopMyRoom</Text>
            <Text style={s.subtitle}>AI Interior Design</Text>
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="sparkles" size={12} color={colors.pro} />
            <Text style={s.headerBadgeText}>AI</Text>
          </View>
        </View>

        {/* Upload zone */}
        <RoomUploader
          onImageSelected={setImageUri}
          imageUri={imageUri}
          isLoading={isGenerating}
          loadingStatus={isGenerating ? (status as LoadingStatus) : undefined}
        />

        {/* Style picker */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Choose a Style</Text>
          <StyleSelector
            styles={STYLES}
            selectedStyle={selectedStyle}
            onStyleSelect={setSelectedStyle}
          />
        </View>

        {/* Error */}
        {status === 'error' && error && (
          <View style={s.errorBanner}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer with generate button */}
      <View style={s.footer}>
        {!imageUri && !isGenerating && (
          <Text style={s.footerHint}>Upload a room photo to get started</Text>
        )}
        <TouchableOpacity
          style={[s.generateButton, !canGenerate && s.generateButtonDisabled]}
          onPress={() => imageUri && startGeneration(imageUri, selectedStyle)}
          disabled={!canGenerate}
          activeOpacity={0.85}
        >
          <Ionicons
            name="sparkles"
            size={17}
            color={canGenerate ? '#fff' : '#aaa'}
          />
          <Text style={[s.generateButtonText, !canGenerate && s.generateButtonTextDisabled]}>
            {isGenerating ? 'Generating Design...' : 'Generate Design'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: 24,
    gap: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: '400',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.proBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.pro,
  },

  // Section
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  footerHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadow.md,
  },
  generateButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  generateButtonTextDisabled: {
    color: colors.textMuted,
  },
});
