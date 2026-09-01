import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, signUp } from '../lib/auth';
import { colors } from '../lib/theme';

export default function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    const err =
      mode === 'signup' ? await signUp(email, password, name) : await signIn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.');
      setMode('signin');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Image source={require('../assets/lani-icon.png')} style={styles.logo} />
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={colors.ink40}
                style={styles.input}
              />
            )}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.ink40}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.ink40}
              secureTextEntry
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              onPress={handleSubmit}
              disabled={busy}
              style={[styles.button, busy && styles.buttonDisabled]}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>{mode === 'signin' ? 'Sign in' : 'Sign up'}</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              setError(null);
              setMode(mode === 'signin' ? 'signup' : 'signin');
            }}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    gap: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  header: { alignItems: 'center', gap: 8 },
  logo: { width: 56, height: 56 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  form: { gap: 12 },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.ink15,
    borderRadius: 8,
    fontSize: 14,
    color: colors.ink,
  },
  error: { fontSize: 14, color: '#dc2626' },
  button: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  switchButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink15,
    alignItems: 'center',
  },
  switchText: { fontSize: 14, fontWeight: '500', color: colors.ink },
});
