import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadow, spacing } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { restorePurchases } from '../../lib/purchases';

type Profile = {
  email: string;
  display_name: string | null;
  is_pro_version: boolean;
  subscription_plan: string | null;
  credits_current: number;
  credits_max: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [generationsCount, setGenerationsCount] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('generations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.display_name ?? '');
      }
      setGenerationsCount(count ?? 0);
    } catch (err) {
      console.error('[profile] loadProfile error:', err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSave() {
    const trimmed = editName.trim();
    setIsEditing(false);
    if (!trimmed || trimmed === profile?.display_name) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', user.id);
    if (error) {
      console.error('[profile] display_name update error:', error.message);
    } else {
      setProfile(prev => prev ? { ...prev, display_name: trimmed } : prev);
    }
  }

  async function handleRestorePurchases() {
    try {
      const customerInfo = await restorePurchases();

      if (customerInfo.entitlements.active['ShopMyRoom Pro']) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ is_pro_version: true }).eq('id', user.id);
          setProfile(prev => prev ? { ...prev, is_pro_version: true } : prev);
        }
        Alert.alert('Purchases Restored', 'Your subscription has been restored.');
      } else {
        Alert.alert('Nothing to Restore', 'No active subscription was found.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message || 'Something went wrong. Please try again.');
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await supabase.auth.signOut({ scope: 'global' });
          router.replace('/login');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  }

  async function confirmDeleteAccount() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'Not signed in.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      console.log('[profile] delete-account response:', JSON.stringify(data), JSON.stringify(error));

      if (error) {
        console.error('[profile] delete-account error:', JSON.stringify(error));
        Alert.alert('Error', 'Failed to delete account. Please try again.');
        return;
      }

      await supabase.auth.signOut({ scope: 'global' });
      router.replace('/login');
    } catch (err) {
      console.error('[profile] delete-account unexpected error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }

  if (loadingProfile) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const email = profile?.email ?? '';
  const displayName = profile?.display_name || email.split('@')[0] || 'User';
  const isPro = profile?.is_pro_version ?? false;
  const initials = displayName.charAt(0).toUpperCase();

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

            <Text style={s.email}>{email}</Text>
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
                <Text style={s.statValue}>{generationsCount}</Text>
                <Text style={s.statLabel}>Rooms Designed</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statValue}>{isPro ? profile?.credits_current ?? 0 : 0}</Text>
                <Text style={s.statLabel}>{isPro ? 'Credits Left' : 'No Plan'}</Text>
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
