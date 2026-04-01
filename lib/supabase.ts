import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// AsyncStorage uses SQLite on iOS — no Keychain access, no cold-boot timing issues.
// expo-secure-store (Keychain) was causing SIGABRT at ~684ms on cold launch before
// the Keychain service was fully available.

// [STARTUP SIDE EFFECT DISABLED: autoRefreshToken]
// autoRefreshToken=true was scheduling a background token refresh on every cold
// launch via AsyncStorage → SQLite (RCTNativeModule call). If the stored session
// was stale or the refresh produced an unhandled rejection, it crashed via RCTFatal.
// Set back to true once the crash is confirmed resolved.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false,   // DISABLED — was triggering background refresh on startup
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function signInWithApple() {
  const AppleAuthentication = await import('expo-apple-authentication');
  const Crypto = await import('expo-crypto');

  const rawNonce = Math.random().toString(36).substring(2);
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
    nonce: hashedNonce,
  });

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
    nonce: rawNonce,
  });

  return { data, error };
}
