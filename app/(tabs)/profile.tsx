import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadow, spacing } from '../../lib/theme';

const PLACEHOLDER_EMAIL = 'user@example.com';
const GENERATIONS_COUNT = 12;
const isPro = false;

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('Alex Johnson');
  const [displayName, setDisplayName] = useState('Alex Johnson');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const initials = displayName.charAt(0).toUpperCase();

  function handleSave() {
    setDisplayName(editName.trim() || displayName);
    setIsEditing(false);
  }

  function handleRestorePurchases() {
    Alert.alert('Restore Purchases', 'No purchases found to restore.');
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: () => console.log('sign out pressed') },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('delete pressed') },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* USER INFO */}
          <View style={s.card}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>

            <View style={s.nameRow}>
              {isEditing ? (
                <TextInput
                  style={s.nameInput}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              ) : (
                <Text style={s.displayName}>{displayName}</Text>
              )}
              <TouchableOpacity
                style={s.editButton}
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
              >
                <Text style={s.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.email}>{PLACEHOLDER_EMAIL}</Text>
          </View>

          {/* PLAN CARD */}
          <View style={s.card}>
            <View style={s.planRow}>
              <View style={s.planTitleRow}>
                <Ionicons
                  name={isPro ? 'star' : 'star-outline'}
                  size={16}
                  color={isPro ? '#F59E0B' : colors.textMuted}
                />
                <Text style={s.planTitle}>{isPro ? 'Pro Plan' : 'Free Plan'}</Text>
              </View>
              {isPro && (
                <View style={s.proBadge}>
                  <Text style={s.proBadgeText}>Active</Text>
                </View>
              )}
            </View>

            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statValue}>{GENERATIONS_COUNT}</Text>
                <Text style={s.statLabel}>Rooms Designed</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statValue}>{isPro ? '∞' : '3'}</Text>
                <Text style={s.statLabel}>{isPro ? 'Unlimited' : 'Remaining'}</Text>
              </View>
            </View>

            {!isPro && (
              <TouchableOpacity
                style={s.upgradeButton}
                onPress={() => setShowUpgradeModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={15} color="#fff" />
                <Text style={s.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SETTINGS */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Account</Text>

            {!isPro && (
              <>
                <SettingsRow
                  icon="sparkles-outline"
                  title="Upgrade to Pro"
                  subtitle="Unlock unlimited designs"
                  onPress={() => setShowUpgradeModal(true)}
                  accent
                />
                <View style={s.separator} />
              </>
            )}

            <SettingsRow
              icon="refresh-outline"
              title="Restore Purchases"
              subtitle="Recover a previous purchase"
              onPress={handleRestorePurchases}
            />

            <View style={s.separator} />

            <SettingsRow
              icon="log-out-outline"
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
            />

            <View style={s.separator} />

            <SettingsRow
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
              destructive
            />
          </View>

          <Text style={s.version}>ShopMyRoom · v1.0.0</Text>
        </ScrollView>

        {/* UPGRADE MODAL */}
        <Modal
          visible={showUpgradeModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowUpgradeModal(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalSheet}>
              <TouchableOpacity
                style={s.modalClose}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={s.modalHeader}>
                <Ionicons name="sparkles" size={28} color={colors.pro} />
                <Text style={s.modalTitle}>Upgrade to Pro</Text>
                <Text style={s.modalSubtitle}>
                  Unlimited room designs, full history & priority generation
                </Text>
              </View>

              <View style={s.planCard}>
                <View style={s.planCardTop}>
                  <Text style={s.planCardName}>Pro</Text>
                  <View style={s.planCardPricing}>
                    <Text style={s.planCardPrice}>$4.99</Text>
                    <Text style={s.planCardPer}> / month</Text>
                  </View>
                </View>
                <Text style={s.planCardDesc}>Billed monthly · Cancel anytime</Text>
              </View>

              <View style={s.featureList}>
                {[
                  'Unlimited AI room generations',
                  'Full design history',
                  'Priority processing',
                ].map((f) => (
                  <View style={s.featureRow} key={f}>
                    <View style={s.featureCheck}>
                      <Ionicons name="checkmark" size={13} color={colors.pro} />
                    </View>
                    <Text style={s.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={s.continueWrapper}
                onPress={() => Alert.alert('Coming Soon', 'Payments not wired up yet.')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.continueButton}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={s.continueButtonText}>Unlock Pro Designs</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRestorePurchases} style={s.restoreButton}>
                <Text style={s.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    </SafeAreaView>
  );
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
  accent?: boolean;
};

function SettingsRow({ icon, title, subtitle, onPress, destructive, accent }: SettingsRowProps) {
  const titleColor = destructive
    ? colors.error
    : accent
    ? colors.pro
    : colors.text;

  return (
    <TouchableOpacity style={s.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.settingsIcon, destructive && s.settingsIconDestructive, accent && s.settingsIconAccent]}>
        <Ionicons
          name={icon}
          size={16}
          color={destructive ? colors.error : accent ? colors.pro : colors.textSecondary}
        />
      </View>
      <View style={s.settingsText}>
        <Text style={[s.settingsTitle, { color: titleColor }]}>{title}</Text>
        <Text style={s.settingsSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  // CARD
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  // USER
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
    minWidth: 140,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // PLAN
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  proBadge: {
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadow.sm,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // SETTINGS
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconDestructive: {
    backgroundColor: colors.errorBg,
  },
  settingsIconAccent: {
    backgroundColor: colors.proBg,
  },
  settingsText: {
    flex: 1,
    gap: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  settingsSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 46,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: 44,
    gap: spacing.lg,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    borderWidth: 2,
    borderColor: colors.pro,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.proBg,
    gap: 4,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  planCardPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planCardPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.pro,
  },
  planCardPer: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.proBg,
    borderWidth: 1.5,
    borderColor: colors.pro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  continueWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  restoreButtonText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
