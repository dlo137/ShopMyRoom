import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

console.log('[LAUNCH] app entry reached');

// react-native-purchases is intentionally NOT imported at the top level.
// When the RNPurchases TurboModule is accessed during module evaluation it calls
// void native methods that throw NSExceptions before the RN bridge is stable,
// triggering a Hermes GC race (SIGSEGV at ~280ms). We hold a reference here
// and set it only after the dynamic import inside the 1500ms timer.
let _Purchases: typeof import('react-native-purchases').default | null = null;

// Module-level state for RevenueCat initialisation
let _rcConfigured = false;
const RC_API_KEY = 'appl_DTNJDhMIgHzLtvBpteHLQhhKCGx';

// Single-slot queue for auth calls that arrive before configure() completes.
// Only the latest call matters — earlier ones are superseded by the final auth state.
type PendingRCCall = { type: 'login'; userId: string } | { type: 'logout' };
let _pendingRCCall: PendingRCCall | null = null;

async function flushPendingRCCall() {
  if (!_pendingRCCall || !_Purchases) return;
  const call = _pendingRCCall;
  _pendingRCCall = null;
  try {
    if (call.type === 'login') {
      await _Purchases.logIn(call.userId);
    } else {
      await _Purchases.logOut();
    }
  } catch (e: any) {
    console.error('[RC] flush pending call failed:', e?.message);
  }
}

function scheduleRCCall(call: PendingRCCall) {
  if (_rcConfigured && _Purchases) {
    // Configure already done — execute immediately
    (call.type === 'login'
      ? _Purchases.logIn(call.userId)
      : _Purchases.logOut()
    ).catch((e: any) => console.error('[RC] call failed:', e?.message));
  } else {
    // Store only the latest — previous pending call is superseded
    _pendingRCCall = call;
  }
}

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
  const [rcError, setRcError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // --- RevenueCat initialisation ---
  // Deferred by 1.5 s to ensure UIKit, the RN bridge, and the Hermes runtime are
  // all fully settled before touching the native RevenueCat SDK.
  // Calling configure() too early causes an NSException inside a TurboModule void
  // method invocation, which triggers a Hermes GC race and a SIGSEGV crash.
  useEffect(() => {
    console.log('[LAUNCH] first useEffect ran');
    if (_rcConfigured) return;

    const timer = setTimeout(async () => {
      if (_rcConfigured) return; // double-check after the delay

      try {
        // Dynamic import — the RNPurchases TurboModule and its NativeEventEmitter
        // are not touched until here, well after the native bridge is stable.
        console.log('[LAUNCH] before RevenueCat dynamic import');
        const rcModule = await import('react-native-purchases');
        console.log('[LAUNCH] after RevenueCat dynamic import');
        _Purchases = rcModule.default;
        const LOG_LEVEL = rcModule.LOG_LEVEL;

        // Only enable verbose logging in dev — setLogLevel(VERBOSE) itself can
        // throw if called at the wrong moment on the native side.
        if (__DEV__) {
          _Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        }
        console.log('[LAUNCH] before configure');
        _Purchases.configure({ apiKey: RC_API_KEY });
        console.log('[LAUNCH] after configure');
      } catch (e: any) {
        const msg = `RevenueCat configure failed: ${e?.message ?? String(e)}`;
        console.error('[RC]', msg);
        setRcError(msg);
        return;
      }

      // Mark as configured so scheduleRCCall executes immediately from now on
      _rcConfigured = true;

      // Flush any auth call that arrived during the 1500ms window.
      // If nothing is queued, fall back to the current session.
      if (_pendingRCCall) {
        await flushPendingRCCall();
      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && _Purchases) {
            await _Purchases.logIn(session.user.id);
          }
        } catch (e: any) {
          console.error('[RC] initial logIn failed:', e?.message);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // --- Session / auth state ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === 'SIGNED_IN' && session?.user) {
        scheduleRCCall({ type: 'login', userId: session.user.id });
      } else if (event === 'SIGNED_OUT') {
        scheduleRCCall({ type: 'logout' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Deep link / OAuth URL callback handler removed.
  // The app uses Apple Sign In (signInWithIdToken) and email/password — neither
  // uses a browser-redirect OAuth flow, so this listener is never triggered.
  // More importantly: Linking.addEventListener calls addListener() on the Linking
  // TurboModule (a void native method) immediately on mount. On iOS 18.6.1 +
  // RN 0.83.2 this was causing RCTLinkingManager to throw an NSException within
  // ~740 ms of launch, triggering a Hermes GC crash before our 1500 ms RC delay
  // could even fire.

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
