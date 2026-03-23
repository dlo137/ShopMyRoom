import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ZONE_SIZE = SCREEN_WIDTH - 32;
const ZONE_HEIGHT = Math.round(ZONE_SIZE * 0.7);

export type LoadingStatus = 'uploading' | 'generating' | 'extracting' | 'searching' | 'saving';

const STATUS_LABELS: Record<LoadingStatus, string> = {
  uploading: 'Uploading photo...',
  generating: 'Generating your design...',
  extracting: 'Identifying furniture...',
  searching: 'Finding products...',
  saving: 'Almost done...',
};

const STATUS_ORDER: LoadingStatus[] = [
  'uploading',
  'generating',
  'extracting',
  'searching',
  'saving',
];

type Props = {
  onImageSelected: (uri: string) => void;
  imageUri: string | null;
  isLoading?: boolean;
  loadingStatus?: LoadingStatus;
};

export default function RoomUploader({
  onImageSelected,
  imageUri,
  isLoading = false,
  loadingStatus,
}: Props) {
  async function pickFromLibrary() {
    if (isLoading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    if (isLoading) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  }

  const currentStepIndex = loadingStatus ? STATUS_ORDER.indexOf(loadingStatus) : -1;

  return (
    <View style={s.wrapper}>
      {/* Upload zone */}
      <TouchableOpacity
        style={s.zone}
        onPress={pickFromLibrary}
        activeOpacity={0.9}
        disabled={isLoading}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.placeholder}>
            <View style={s.iconWrap}>
              <Ionicons name="image-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={s.placeholderTitle}>Upload your room</Text>
            <Text style={s.placeholderSub}>Tap to choose from library</Text>
          </View>
        )}

        {/* Loading overlay */}
        {isLoading && loadingStatus && (
          <View style={s.overlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={s.overlayLabel}>{STATUS_LABELS[loadingStatus]}</Text>
            <View style={s.dots}>
              {STATUS_ORDER.map((_, i) => (
                <View
                  key={i}
                  style={[s.dot, i <= currentStepIndex ? s.dotActive : s.dotInactive]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Change photo badge */}
        {imageUri && !isLoading && (
          <View style={s.changeBadge}>
            <Ionicons name="camera-outline" size={13} color="#fff" />
            <Text style={s.changeBadgeText}>Change</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Camera shortcut — only when no image selected */}
      {!imageUri && !isLoading && (
        <TouchableOpacity style={s.cameraRow} onPress={takePhoto} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={16} color={colors.textSecondary} />
          <Text style={s.cameraRowText}>Or take a photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    gap: 10,
  },
  zone: {
    width: ZONE_SIZE,
    height: ZONE_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    ...shadow.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  placeholderSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  overlayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  changeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  cameraRowText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
