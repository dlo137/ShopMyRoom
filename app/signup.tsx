import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase, signInWithApple } from '../lib/supabase';
import AppleSignInButton from '../components/AppleSignInButton';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'confirmPassword' | null>(null);
  const router = useRouter();

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: authError } = await signInWithApple();

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          updated_at: new Date().toISOString(),
        });
        if (profileError) console.error('[apple] profile upsert error:', profileError.message);
      }

      router.replace('/subscription');
    } catch (err) {
      setError('Apple sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[signup] calling signUp for', email.trim());
      const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
      console.log('[signup] signUp result — user:', data?.user?.id, '| session:', !!data?.session, '| error:', authError);

      if (authError) {
        console.error('[signup] signUp error:', authError.status, authError.message);
        setError(authError.message);
        return;
      }

      // If no session was returned (email confirmation enabled), sign in immediately
      let userId = data.user?.id;
      if (!data.session) {
        console.log('[signup] no session returned — attempting immediate signIn');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        console.log('[signup] signIn result — user:', signInData?.user?.id, '| error:', signInError);
        if (signInError) {
          console.error('[signup] signIn error:', signInError.status, signInError.message);
          setError('Account created! Please sign in.');
          router.replace('/login');
          return;
        }
        userId = signInData.user?.id;
      }

      if (userId) {
        console.log('[signup] upserting profile for user:', userId);
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: userId,
          email: email.trim(),
          updated_at: new Date().toISOString(),
        });
        if (profileError) console.error('[signup] profile upsert error:', profileError.code, profileError.message);
        else console.log('[signup] profile upserted successfully');
      }

      console.log('[signup] navigating to /subscription');
      router.replace('/subscription');
    } catch (err) {
      console.error('[signup] unexpected error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={s.container}>
          <StatusBar style="dark" />
          <View style={s.content}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.backButton}>← Back</Text>
            </TouchableOpacity>

            <Text style={s.title}>Create account</Text>
            <Text style={s.subtitle}>Sign up to get started</Text>

            <Text style={s.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={[s.input, focusedField === 'email' && s.inputFocused]}
            />

            <Text style={s.label}>Password</Text>
            <View style={s.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={[s.input, focusedField === 'password' && s.inputFocused, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                <Text style={s.showHideBtn}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Confirm Password</Text>
            <View style={s.passwordRow}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                style={[s.input, focusedField === 'confirmPassword' && s.inputFocused, { flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)}>
                <Text style={s.showHideBtn}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {error !== null && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity
              style={s.ctaButton}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#ffffff" />
                : <Text style={s.ctaButtonText}>Create Account</Text>
              }
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            <AppleSignInButton onPress={handleAppleSignIn} loading={loading} />

            <View style={s.footerRow}>
              <Text style={s.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={s.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const BG = '#f8fafc';
const TEXT = '#0f172a';
const MUTED = '#64748b';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { flex: 1, justifyContent: 'center', width: '100%', paddingHorizontal: 24, gap: 8 },
  backButton: { fontSize: 15, color: '#6366f1', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: TEXT, marginBottom: 4 },
  subtitle: { fontSize: 15, color: MUTED, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 4 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
    backgroundColor: '#ffffff',
  },
  inputFocused: { borderColor: '#6366f1' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 },
  showHideBtn: { fontSize: 14, color: '#6366f1', fontWeight: '600', paddingHorizontal: 4 },
  errorText: { fontSize: 13, color: '#ef4444', marginTop: 4 },
  ctaButton: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#64748b', marginHorizontal: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  footerText: { fontSize: 14, color: MUTED },
  footerLink: { fontSize: 14, fontWeight: '700', color: '#6366f1' },
});
