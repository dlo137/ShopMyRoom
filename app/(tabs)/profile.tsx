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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('delete pressed') },
      ]
    );
  }

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>

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
            <Text style={s.planTitle}>{isPro ? 'Pro Plan' : 'Free Plan'}</Text>
            {isPro && (
              <View style={s.proBadge}>
                <Text style={s.proBadgeText}>Pro Active</Text>
              </View>
            )}
          </View>

          <Text style={s.stat}>{GENERATIONS_COUNT} rooms designed</Text>

          {!isPro && (
            <TouchableOpacity
              style={s.upgradeButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Text style={s.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SETTINGS LIST */}
        <View style={s.card}>
          {!isPro && (
            <>
              <SettingsRow
                title="Upgrade to Pro"
                subtitle="Unlock unlimited designs"
                onPress={() => setShowUpgradeModal(true)}
              />
              <View style={s.separator} />
            </>
          )}

          <SettingsRow
            title="Restore Purchases"
            subtitle="Recover a previous purchase"
            onPress={handleRestorePurchases}
          />

          <View style={s.separator} />
          <SettingsRow
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
          />

          <View style={s.separator} />
          <SettingsRow
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            titleStyle={s.destructiveText}
          />
        </View>

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
              <Text style={s.modalCloseText}>×</Text>
            </TouchableOpacity>

            <Text style={s.modalTitle}>Upgrade to Pro</Text>
            <Text style={s.modalSubtitle}>
              Unlimited room designs, full history & priority generation
            </Text>

            <View style={s.planCard}>
              <View style={s.planCardHeader}>
                <Text style={s.planCardTitle}>Pro</Text>
                <Text style={s.planCardPrice}>$4.99 / month</Text>
              </View>
              <Text style={s.planCardDesc}>Unlimited room designs</Text>
            </View>

            <View style={s.featureList}>
              {['Unlimited generations', 'Full design history', 'Priority processing'].map(
                (f) => (
                  <View style={s.featureRow} key={f}>
                    <Text style={s.featureCheck}>✓</Text>
                    <Text style={s.featureText}>{f}</Text>
                  </View>
                )
              )}
            </View>

            <TouchableOpacity
              style={s.continueButtonWrapper}
              onPress={() => Alert.alert('Coming Soon', 'Payments not wired up yet.')}
            >
              <LinearGradient
                colors={['#1e40af', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.continueButton}
              >
                <Text style={s.continueButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRestorePurchases} style={s.restoreButton}>
              <Text style={s.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

type SettingsRowProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
  titleStyle?: object;
};

function SettingsRow({ title, subtitle, onPress, titleStyle }: SettingsRowProps) {
  return (
    <TouchableOpacity style={s.settingsRow} onPress={onPress}>
      <View style={s.settingsText}>
        <Text style={[s.settingsTitle, titleStyle]}>{title}</Text>
        <Text style={s.settingsSubtitle}>{subtitle}</Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 64,
    gap: 16,
    paddingBottom: 64,
  },

  // CARD
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },

  // USER INFO
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
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
    color: '#1a1a1a',
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 2,
    minWidth: 140,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  email: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  // PLAN CARD
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  proBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  stat: {
    fontSize: 14,
    color: '#555',
  },
  upgradeButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // SETTINGS
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingsText: {
    flex: 1,
    gap: 2,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e5e5',
  },
  destructiveText: {
    color: '#c0392b',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 1,
    padding: 4,
  },
  modalCloseText: {
    fontSize: 28,
    color: '#888',
    lineHeight: 30,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#1e40af',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  planCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
  },
  planCardDesc: {
    fontSize: 13,
    color: '#888',
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    fontSize: 15,
    color: '#1e40af',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  continueButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  continueButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#888',
  },
});
