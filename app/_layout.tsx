import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Module-level guard — prevents double-configure if the component ever re-mounts
let _rcConfigured = false;

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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rcError, setRcError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // --- RevenueCat initialisation ---
  // Must complete before logIn is called.
  // Uses a module-level flag so it is safe across strict-mode double-invocations.
  useEffect(() => {
    if (_rcConfigured) return;
    _rcConfigured = true;

    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      Purchases.configure({ apiKey: 'appl_DTNJDhMIgHzLtvBpteHLQhhKCGx' });
    } catch (e: any) {
      const msg = `RevenueCat configure failed: ${e?.message ?? String(e)}`;
      console.error('[RC]', msg);
      setRcError(msg);
      return; // do not attempt logIn if configure failed
    }

    // Identify the current user after configure is complete
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        Purchases.logIn(session.user.id).catch((e: any) => {
          const msg = `RevenueCat logIn failed: ${e?.message ?? String(e)}`;
          console.error('[RC]', msg);
          setRcError(msg);
        });
      }
    });
  }, []);

  // --- Session / auth state ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          Purchases.logIn(session.user.id).catch((e: any) => {
            console.error('[RC] logIn on auth change failed:', e?.message);
          });
        } else if (event === 'SIGNED_OUT') {
          Purchases.logOut().catch((e: any) => {
            console.error('[RC] logOut failed:', e?.message);
          });
        }
      } catch (e: any) {
        console.error('[RC] auth change handler error:', e?.message);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Deep link handler for Supabase OAuth callback ---
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      if (url.includes('supabase.co/auth/v1/callback')) {
        await supabase.auth.getSession();
        router.replace('/(tabs)/');
      }
    });
    return () => sub.remove();
  }, []);

  // --- Redirect unauthenticated users out of tabs ---
  useEffect(() => {
    if (loading) return;
    const inTabs = segments[0] === '(tabs)';
    if (!session && inTabs) {
      router.replace('/login');
    }
  }, [session, loading, segments]);

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

      {/* Floating debug banner — only shown when there is a native module error */}
      {rcError && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#c0392b',
          padding: 12,
          paddingBottom: Platform.OS === 'ios' ? 32 : 12,
        }}>
          <TouchableOpacity onPress={() => setShowDebug(v => !v)}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              ⚠ Native Module Error — tap to {showDebug ? 'hide' : 'expand'}
            </Text>
          </TouchableOpacity>
          {showDebug && (
            <ScrollView style={{ marginTop: 8, maxHeight: 200, backgroundColor: '#7b1c11', borderRadius: 6, padding: 8 }}>
              <Text style={{ color: '#ffd', fontSize: 11, fontFamily: 'monospace' }}>
                {rcError}
              </Text>
            </ScrollView>
          )}
        </View>
      )}
    </ErrorBoundary>
  );
}
