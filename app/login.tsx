import { Link, router } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useTheme } from '@/components/ThemeProvider';
import { signIn } from '@/lib/auth';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setMessage('Email and password are required.');
      return;
    }
    if (!normalizedEmail.includes('@')) {
      setMessage('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await signIn(normalizedEmail, password);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Ionicons name="qr-code" size={30} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.eyebrow}>QR ATTENDANCE</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to record and manage school event attendance.</Text>
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Email address</Text>
          <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textTertiary} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor={colors.textTertiary} secureTextEntry value={password} onChangeText={setPassword} />
          {message && <Text style={styles.message}>{message}</Text>}
          <AppButton theme="primary" title={busy ? 'Signing in...' : 'Sign in'} icon="log-in-outline" onPress={handleLogin} disabled={busy} />
        </View>
        <Link href="/register" style={styles.link}>Create an account</Link>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
    content: { padding: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
    brandMark: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: colors.shadow, shadowOpacity: 0.22, shadowRadius: 12, elevation: 5 },
    eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginBottom: 8 },
    title: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 22 },
    formCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 18, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
    fieldLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
    input: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, borderRadius: 13, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 15 },
    message: { color: '#B3265E', marginBottom: 12 },
    link: { color: colors.primary, fontWeight: '700', textAlign: 'center', marginTop: 18 },
  });
}