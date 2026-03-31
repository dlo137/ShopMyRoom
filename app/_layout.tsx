import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

console.log('[LAUNCH] app entry reached');

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
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // --- Session / auth state ---
  useEffect(() => {
    console.log('[LAUNCH] first useEffect ran');
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
    </ErrorBoundary>
  );
}
