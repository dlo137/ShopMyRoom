import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';


// ─── Component ───────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const router = useRouter();

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [discountModalAnim] = useState(new Animated.Value(0));

  // Modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Purchase
  const [currentPurchaseAttempt, setCurrentPurchaseAttempt] = useState<
    'monthly' | 'yearly' | 'weekly' | null
  >(null);

  // ── 1. Fade-in on mount + mark paywall seen ──────────────────────────────

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    async function markPaywallSeen() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
          .from('profiles')
          .update({ has_seen_paywall: true })
          .eq('id', user.id);
      } catch {
        // non-critical — ignore silently
      }
    }

    markPaywallSeen();
  }, []);


  // ── Handlers ─────────────────────────────────────────────────────────────

  async function simulatePurchase(
    plan: 'yearly' | 'monthly' | 'weekly' | 'discountedWeekly'
  ) {
    const creditsMap: Record<string, number> = {
      yearly: 90,
      monthly: 75,
      weekly: 10,
      discountedWeekly: 10,
    };
    const credits_max = creditsMap[plan] ?? 10;
    const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    setCurrentPurchaseAttempt(plan === 'discountedWeekly' ? 'weekly' : plan);

    try {
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError || !anonData.session) {
          Alert.alert('Error', 'Could not create your account. Please try again.');
          setCurrentPurchaseAttempt(null);
          return;
        }
        session = anonData.session;
      }

      const user = session.user;

      await supabase
        .from('profiles')
        .update({
          subscription_plan: plan,
          is_pro_version: true,
          entitlement: 'pro',
          is_trial_version: true,
          trial_end_date: trialEndDate,
          subscription_id: `dev_${plan}_${Date.now()}`,
          purchase_time: now,
          credits_current: credits_max,
          credits_max,
          last_credit_reset: now,
        })
        .eq('id', user.id);

      try {
        await supabase.functions.invoke('track-event', {
          body: {
            event: 'subscription_completed',
            plan,
            source: 'simulate',
            userId: user.id,
          },
        });
      } catch {
        // tracking is non-critical
      }

      router.replace('/(tabs)/' as any);
    } catch (err: any) {
      setCurrentPurchaseAttempt(null);
      Alert.alert('Purchase Failed', err?.message ?? 'Something went wrong. Please try again.');
    }
  }

  async function handleContinue() {
    await simulatePurchase(selectedPlan);
  }

  function handleRestore() {
    Alert.alert('Coming Soon', 'Purchase restore will be available in a future update.');
  }

  function handleClose() {
    try {
      supabase.functions.invoke('track-event', {
        body: { event: 'discount_modal_shown', context: 'subscription_exit' },
      });
    } catch {}

    setShowDiscountModal(true);
    Animated.timing(discountModalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function handleCloseWithoutDiscount() {
    try {
      supabase.functions.invoke('track-event', {
        body: { event: 'discount_modal_dismissed', context: 'subscription_exit' },
      });
    } catch {}

    Animated.timing(discountModalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      setShowDiscountModal(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_plan, is_pro_version')
            .eq('id', user.id)
            .single();

          if (profile?.subscription_plan || profile?.is_pro_version) {
            router.back();
            return;
          }
        }
      } catch {}

      await supabase.auth.signOut();
      router.replace('/login');
    });
  }

  async function handleDiscountPurchase() {
    await simulatePurchase('discountedWeekly');
  }

  const isButtonDisabled = currentPurchaseAttempt !== null;
  const buttonLabel = currentPurchaseAttempt ? 'Processing...' : 'Get Started';

  const modalScale = discountModalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#050810', '#0d1120', '#08091a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top-left: Restore */}
      <TouchableOpacity style={s.restoreButton} onPress={handleRestore}>
        <Text style={s.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>

      {/* Top-right: Close */}
      <TouchableOpacity style={s.closeButton} onPress={handleClose}>
        <Text style={s.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Scrollable content */}
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / glow */}
        <View style={s.logoSection}>
          <View style={s.glowOuter}>
            <View style={s.glowInner}>
              <Image
                source={require('../assets/icon.png')}
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Header */}
        <View style={s.headerSection}>
          <Text style={s.headline}>[YOUR_APP_HEADLINE]</Text>
          <Text style={s.subheadline}>
            Unlimited AI room designs, shoppable results, and priority generation — all in one place.
          </Text>
        </View>

        {/* Plan cards */}
        <View style={s.plansSection}>

          {/* Lifetime */}
          <TouchableOpacity
            style={[s.planCard, selectedPlan === 'weekly' && s.planCardSelected]}
            onPress={() => setSelectedPlan('weekly')}
            activeOpacity={0.8}
          >
            <View style={[s.radio, selectedPlan === 'weekly' && s.radioSelected]} />
            <View style={s.planInfo}>
              <Text style={s.planName}>Weekly</Text>
              <Text style={s.planPrice}>$2.99 / week</Text>
              <Text style={s.planCredits}>10 designs / week</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            style={[s.planCard, selectedPlan === 'monthly' && s.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <View style={[s.radio, selectedPlan === 'monthly' && s.radioSelected]} />
            <View style={s.planInfo}>
              <Text style={s.planName}>Monthly</Text>
              <Text style={s.planPrice}>$9.99 / month</Text>
              <Text style={s.planCredits}>75 designs / month</Text>
            </View>
            {selectedPlan !== 'yearly' && (
              <View style={s.trialBadge}>
                <Text style={s.trialBadgeText}>3 DAY FREE TRIAL</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Yearly */}
          <TouchableOpacity
            style={[s.planCard, s.popularPlan, selectedPlan === 'yearly' && s.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <View style={[s.radio, selectedPlan === 'yearly' && s.radioSelected]} />
            <View style={s.planInfo}>
              <Text style={s.planName}>Yearly</Text>
              <Text style={s.planPrice}>$59.99 / year</Text>
              <Text style={s.planCredits}>90 designs / month · Best value</Text>
            </View>
            {selectedPlan === 'yearly' && (
              <View style={s.trialBadge}>
                <Text style={s.trialBadgeText}>3 DAY FREE TRIAL</Text>
              </View>
            )}
          </TouchableOpacity>

        </View>

        {/* Spacer for fixed bottom bar */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Fixed bottom bar */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.continueButton, isButtonDisabled && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={isButtonDisabled}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1e40af', '#1e3a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.continueGradient}
          >
            <Text style={s.continueText}>{buttonLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={s.cancelNote}>Cancel Anytime. No Commitment.</Text>
      </View>


      {/* Discount modal */}
      {showDiscountModal && (
        <Animated.View style={[s.modalOverlay, { opacity: discountModalAnim }]}>
          <Animated.View style={[s.modalCard, { transform: [{ scale: modalScale }] }]}>
            <Text style={s.modalTitle}>Wait! Special Offer</Text>
            <View style={s.discountBadge}>
              <Text style={s.discountBadgeText}>33% OFF</Text>
            </View>
            <Text style={s.modalTryText}>Try it for just</Text>
            <View style={s.priceRow}>
              <Text style={s.originalPrice}>$2.99</Text>
              <Text style={s.discountPrice}>$1.99</Text>
              <Text style={s.perWeek}> / week</Text>
            </View>
            <TouchableOpacity
              style={s.modalCTAButton}
              onPress={handleDiscountPurchase}
              activeOpacity={0.85}
            >
              <Text style={s.modalCTAText}>Claim Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCloseWithoutDiscount} style={s.skipButton}>
              <Text style={s.skipText}>No thanks, skip this offer</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const { width: W, height: H } = Dimensions.get('window');

const TEXT  = '#ffffff';
const MUTED = '#94a3b8';

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050810',
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },

  // Top controls
  closeButton: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  restoreButton: {
    position: 'absolute',
    top: 54,
    left: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  restoreText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  glowOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(99,102,241,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 64,
    height: 64,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 34,
  },
  subheadline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Plans
  plansSection: {
    width: '100%',
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  planCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  popularPlan: {
    borderColor: 'rgba(99,102,241,0.4)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  radioSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  planPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  planCredits: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  trialBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  trialBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 0.5,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: 'rgba(5,8,16,0.95)',
    gap: 10,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  cancelNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },

  // Debug panel
  debugToggle: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 50,
  },
  debugToggleText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  debugPanel: {
    position: 'absolute',
    bottom: 130,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 14,
    zIndex: 50,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  debugTitle: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
  },
  debugLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  debugValue: {
    color: '#a5f3fc',
    fontSize: 11,
  },
  debugSimBtn: {
    marginTop: 8,
    backgroundColor: '#1e40af',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  debugSimBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Discount modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalCard: {
    width: W - 48,
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  discountBadge: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.5)',
  },
  discountBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 1,
  },
  modalTryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  originalPrice: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4ade80',
  },
  perWeek: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  modalCTAButton: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  skipButton: {
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'underline',
  },

  // ── Named aliases matching the spec ──────────────────────────────────────

  container: {
    flex: 1,
    backgroundColor: '#0d1120',
  },
  scrollContainer: {
    flex: 1,
  },

  // Already-purchased bar
  alreadyPurchased: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  alreadyPurchasedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(30,64,175,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e40af',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30,64,175,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Plans
  plansContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 8,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPlan: {
    borderColor: '#1e40af',
    backgroundColor: 'rgba(30,64,175,0.15)',
  },
  popularPlan: {
    borderColor: 'rgba(30,64,175,0.5)',
  },
  tryFreeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#1e40af',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  tryFreeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: 0.5,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e40af',
  },
  planContent: {
    flex: 1,
    gap: 2,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  planSubtext: {
    fontSize: 11,
    color: MUTED,
  },

  // Bottom CTA
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    backgroundColor: 'rgba(5,8,16,0.95)',
    gap: 10,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 0.3,
  },
  cancelAnytimeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },

  // Discount modal
  discountModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  discountModalContent: {
    width: W - 40,
    backgroundColor: '#0d1120',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(30,64,175,0.6)',
    shadowColor: '#1e40af',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  discountModalHeader: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  discountModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
  },
  discountModalClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountModalCloseText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '600',
  },
  discountModalBody: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  discountBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  discountBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#22c55e',
    letterSpacing: 1,
  },
  discountModalSubtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  discountPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  discountOriginalPrice: {
    fontSize: 16,
    color: MUTED,
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#22c55e',
  },
  discountPriceLabel: {
    fontSize: 13,
    color: MUTED,
  },
  discountModalDescription: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
  discountButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  discountButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  discountButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: 0.3,
  },
  discountSkipButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  discountSkipButtonText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textDecorationLine: 'underline',
  },
});
