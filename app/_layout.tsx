import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
// [ENABLE_AUTH_CHECK] import { supabase } from '../lib/supabase';

console.log('[LAUNCH] app entry reached');

// ── NUCLEAR: Global JS error handler ──────────────────────────────────────
// Installed at MODULE LOAD TIME — before any React component renders.
// Replaces React Native's default fatal error handler, which calls
// RCTFatal → SIGABRT and crashes the app.
// Our handler logs the error but does NOT propagate it, so the app stays alive.
//
// This catches everything that survives try/catch blocks:
//   • expo-router navigation state restoration errors
//   • Supabase token refresh rejections
//   • Native module timing issues on cold launch
//   • Any other unhandled JS rejection/throw
//
// TO RESTORE default crash behavior: delete this block and rebuild.
try {
  // ErrorUtils is a React Native global (no import needed)
  // @ts-ignore — not in the TS global scope but always present at runtime
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    const tag = isFatal ? 'FATAL' : 'non-fatal';
    const msg = error?.message ?? '(no message)';
    const stack = error?.stack ?? '(no stack)';
    console.error(`[CRASH SHIELD] ${tag} JS error intercepted — app kept alive`);
    console.error(`[CRASH SHIELD] Message: ${msg}`);
    console.error(`[CRASH SHIELD] Stack:\n${stack}`);
    // ↑ Check Xcode / device console to see what was actually throwing.
    // Do NOT call the original handler — that path leads to RCTFatal → abort.
  });
  console.log('[CRASH SHIELD] Global error handler installed');
} catch (e) {
  console.warn('[CRASH SHIELD] Failed to install global handler:', e);
}
// ──────────────────────────────────────────────────────────────────────────

// ── NUCLEAR: Clear persisted navigation state ──────────────────────────────
// expo-router persists the navigation stack in AsyncStorage and restores it
// on cold launch BEFORE any of our React code runs. If the user was last on
// /(tabs)/profile or /subscription, those screens mount at startup,
// importing supabase and triggering native calls before any guard fires.
// Wiping the state key here forces every cold launch to start at app/index.tsx.
//
// Keys observed in expo-router v3 / React Navigation v6:
const NAV_STATE_KEYS = [
  'EXPO_ROUTER_STATE',
  '@react-navigation/native',
  '@react-navigation/native:state',
  'RootNavigationState',
];
AsyncStorage.multiRemove(NAV_STATE_KEYS).catch(() => {
  // Non-critical — ignore silently
});
// ──────────────────────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Render crash:', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 60 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#c0392b', marginBottom: 8 }}>
            Render Error (Debug)
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 }}>
            {this.state.error.name}: {this.state.error.message}
          </Text>
          <ScrollView style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  console.log('[LAUNCH] RootLayout render reached');
  const [session, setSession] = useState<Session | null>(null);
  // [ENABLE_AUTH_CHECK] — starts false so auth spinner is skipped while flag is off
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // ── NUCLEAR: Force root route on every cold launch ───────────────────────
  // Even if AsyncStorage.multiRemove above runs, expo-router may have already
  // consumed the state before this file loads. This useEffect fires after the
  // first render and hard-redirects to '/' (app/index.tsx — onboarding screen),
  // ensuring no tab screen stays mounted long enough to crash.
  useEffect(() => {
    try {
      router.replace('/');
    } catch (e) {
      console.warn('[CRASH SHIELD] router.replace failed:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ─────────────────────────────────────────────────────────────────────────

  // [STARTUP SIDE EFFECT DISABLED: Supabase session fetch + auth state listener]
  // Set ENABLE_AUTH_CHECK = true and restore the supabase import to re-enable.
  // useEffect(() => {
  //   console.log('[LAUNCH] first useEffect ran');
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setSession(session);
  //     setLoading(false);
  //   });
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setSession(session);
  //   });
  //   return () => subscription.unsubscribe();
  // }, []);

  // [STARTUP SIDE EFFECT DISABLED: redirect unauthenticated users out of tabs]
  // useEffect(() => {
  //   if (loading) return;
  //   const inTabs = segments[0] === '(tabs)';
  //   if (!session && inTabs) {
  //     router.replace('/login');
  //   }
  // }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
}
