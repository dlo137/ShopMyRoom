import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextStyle,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
// TEMP DISABLED FOR CRASH TEST — ConfettiCannon disabled
// import ConfettiCannon from 'react-native-confetti-cannon';
// TEMP DISABLED FOR CRASH TEST — Haptics disabled
// import * as Haptics from 'expo-haptics';
// TEMP DISABLED FOR CRASH TEST — Supabase disabled
// import { supabase } from '../lib/supabase';
// TEMP DISABLED FOR CRASH TEST — FloatingParticles disabled
// import FloatingParticles from '../src/components/FloatingParticles';
// TEMP DISABLED FOR CRASH TEST — TimeChart disabled
// import TimeChart from '../src/components/TimeChart';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// TEMP DISABLED FOR CRASH TEST — haptic helper disabled (Haptics import removed)
// async function triggerHaptic(style: Haptics.ImpactFeedbackStyle) {
//   try {
//     await Haptics.impactAsync(style);
//   } catch {
//     // silently fail in Expo Go or unsupported environments
//   }
// }

const CONFETTI_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#ffffff'];

function GradientText({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>}>
      <LinearGradient
        colors={['#6366f1', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // TEMP DISABLED FOR CRASH TEST — start false so we skip the auth loading spinner
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Looping glow pulse on mount
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // TEMP DISABLED FOR CRASH TEST — Supabase session check disabled
  // useEffect(() => {
  //   checkSession();
  // }, []);

  // TEMP DISABLED FOR CRASH TEST — Haptics on step 1 disabled
  // useEffect(() => {
  //   if (step === 1 && !isCheckingAuth) {
  //     triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
  //     setTimeout(() => triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy), 100);
  //     setTimeout(() => triggerHaptic(Haptics.ImpactFeedbackStyle.Medium), 200);
  //   }
  // }, [isCheckingAuth]);

  // TEMP DISABLED FOR CRASH TEST — Supabase checkSession function disabled
  // async function checkSession() {
  //   try {
  //     const { data: { session }, error } = await supabase.auth.getSession();

  //     if (error) {
  //       if (error.message.includes('refresh_token') || error.message.includes('Refresh Token')) {
  //         await supabase.auth.signOut();
  //       }
  //       setIsCheckingAuth(false);
  //       return;
  //     }

  //     if (session) {
  //       router.replace('/(tabs)/');
  //       return;
  //     }

  //     setIsCheckingAuth(false);
  //   } catch {
  //     setIsCheckingAuth(false);
  //   }
  // }

  function handleGetStarted() {
    // TEMP DISABLED FOR CRASH TEST — router.push disabled to prevent navigation crash
    // router.push('/subscription');
    console.log('[CRASH TEST] handleGetStarted pressed — navigation disabled');
  }

  const translateX = slideAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-500, 0, 500],
  });

  if (isCheckingAuth) {
    return (
      <View style={s.centered}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar style="dark" />
      {/* TEMP DISABLED FOR CRASH TEST — FloatingParticles disabled */}
      {/* <FloatingParticles /> */}

      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          paddingHorizontal: 24,
          transform: [{ translateX }],
          opacity: fadeAnim,
        }}
      >
        {step === 3 && (
          <View style={{ gap: 24, alignItems: 'center' }}>
            {/* Heading with inline gradient words */}
            <View style={s.headingWrap}>
              <Text style={s.headingLine}>Used by creators who value</Text>
              <View style={s.headingInlineRow}>
                <GradientText style={s.headingGradient}>speed</GradientText>
                <Text style={s.headingPlain}>, </Text>
                <GradientText style={s.headingGradient}>quality</GradientText>
                <Text style={s.headingPlain}>, and </Text>
                <GradientText style={s.headingGradient}>consistency</GradientText>
              </View>
            </View>

            {/* Subtitle */}
            <Text style={s.socialSubtitle}>Join creators working faster, not harder</Text>

            {/* Stat cards */}
            <View style={s.statRow}>
              <View style={s.statCard}>
                <Text style={s.statNumber}>10K+</Text>
                <Text style={s.statLabel}>Thumbnails Generated</Text>
              </View>
              <View style={[s.statCard, { flex: 2 }]}>
                <Text style={s.statNumber}>5 Star Rating</Text>
                <Text style={s.statLabel}>☆ ☆ ☆ ☆ ☆</Text>
              </View>
            </View>

            {/* Testimonial */}
            <View style={s.testimonialCard}>
              <Text style={s.testimonialText}>
                "This app completely changed how fast I ship content. What used to take hours now takes minutes."
              </Text>
            </View>

          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 16, width: '100%' }}>
            <Text style={s.title}>{'Save instantly.\nSave 85% of your time & cost.'}</Text>
            <Text style={s.subtitle}>Grow faster</Text>
            {/* TEMP DISABLED FOR CRASH TEST — TimeChart disabled */}
            {/* <TimeChart /> */}
          </View>
        )}

        {step === 1 && (
          <>
            {/* TEMP DISABLED FOR CRASH TEST — ConfettiCannon disabled */}
            {/* <View style={s.confettiWrapper}>
              <ConfettiCannon
                count={40}
                origin={{ x: WINDOW_WIDTH * 0.25, y: 0 }}
                autoStart
                fadeOut
                fallSpeed={3000}
                explosionSpeed={400}
                colors={CONFETTI_COLORS}
              />
              <ConfettiCannon
                count={40}
                origin={{ x: WINDOW_WIDTH * 0.75, y: 0 }}
                autoStart
                fadeOut
                fallSpeed={3000}
                explosionSpeed={400}
                colors={CONFETTI_COLORS}
              />
            </View> */}


            {/* Hero image */}
            <View style={s.heroImageWrapper}>
              <Image
                source={require('../assets/icon.png')}
                style={s.heroImage}
                resizeMode="cover"
              />
            </View>

            {/* Title */}
            <Text style={s.screenTitle}>Your Room,{'\n'}Redesigned Instantly</Text>

          </>
        )}
      </Animated.View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[s.getStartedButton, step === 3 && { marginTop: 40 }, { alignSelf: 'center' }]}
        onPress={handleGetStarted}
        activeOpacity={0.85}
      >
        <Text style={s.getStartedButtonText}>
          Get Started
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={[s.footerRow, { alignSelf: 'center' }]}>
        {step !== 3 ? (
          <>
            <Text style={s.footerText}>Already got an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={s.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={s.footerNote}>Built for creators, not agencies</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const BG   = '#f8fafc';
const TEXT = '#0f172a';
const MUTED = '#64748b';

const s = StyleSheet.create({
  // Layout
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Confetti & glow
  confettiWrapper: {
    position: 'absolute',
    top: -200,
    left: -25,
    right: -25,
    bottom: 0,
    zIndex: 9999,
  },
  glow: {
    position: 'absolute',
    width: '55%',
    height: 400,
    backgroundColor: '#e0e7ff',
    borderRadius: 200,
    shadowColor: '#6366f1',
    shadowOpacity: 0.25,
    shadowRadius: 200,
    shadowOffset: { width: 0, height: 0 },
    elevation: 40,
  },

  // Hero
  heroImageWrapper: {
    width: 300,
    height: 300,
    borderRadius: 32,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: TEXT,
    marginTop: 20,
    marginBottom: 6,
    textAlign: 'center',
  },

  // Step 2
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'left',
    marginTop: 8,
  },

  // Step 3 headings
  headingWrap: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  headingLine: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  headingInlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  headingGradient: {
    fontSize: 22,
    fontWeight: '700',
  },
  headingPlain: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },
  socialSubtitle: {
    fontSize: 15,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Stat cards
  socialProofContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
    textAlign: 'center',
  },

  // Testimonial
  testimonialCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialText: {
    fontSize: 15,
    color: TEXT,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },

  // CTA button
  getStartedButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerNote: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: MUTED,
  },
  loginLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    color: MUTED,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
  },
});
