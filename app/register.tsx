import { Link, router } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useTheme } from '@/components/ThemeProvider';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim();
    if (!fullName.trim()) return setMessage('Full name is required.');
    if (!normalizedEmail.includes('@')) return setMessage('Enter a valid email address.');
    if (password.length < 6) return setMessage('Password must be at least 6 characters.');
    setBusy(true);
    setMessage(null);
    const { data, error } = await signUp(normalizedEmail, password, fullName.trim(), role);
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) return setMessage('Account created. Check your email to confirm, then sign in.');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Ionicons name="sparkles-outline" size={30} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.eyebrow}>JOIN QR ATTENDANCE</Text>
        <Text style={styles.title}>Create account</Text>
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Full name</Text>
          <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.textTertiary} value={fullName} onChangeText={setFullName} />
          <Text style={styles.fieldLabel}>Email address</Text>
          <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textTertiary} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor={colors.textTertiary} secureTextEntry value={password} onChangeText={setPassword} />
          <Text style={styles.label}>I am signing up as</Text>
          <View style={styles.roleRow}>
            {(['student', 'teacher'] as const).map((option) => (
              <Pressable key={option} style={[styles.role, role === option && styles.roleSelected]} onPress={() => setRole(option)}>
                <Ionicons name={option === 'student' ? 'person-outline' : 'school-outline'} size={19} color={role === option ? colors.textOnPrimary : colors.primary} />
                <Text style={[styles.roleText, role === option && styles.roleTextSelected]}>{option[0].toUpperCase() + option.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
          {message && <Text style={styles.message}>{message}</Text>}
          <AppButton theme="primary" title={busy ? 'Creating...' : 'Create account'} icon="person-add-outline" onPress={handleRegister} disabled={busy} />
        </View>
        <Link href="/login" style={styles.link}>Already have an account?</Link>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
    content: { padding: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
    brandMark: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: colors.shadow, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
    eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginBottom: 8 },
    title: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginBottom: 22 },
    formCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 18, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
    fieldLabel: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 7 },
    input: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, borderRadius: 13, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 15 },
    label: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 8 },
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    role: { flex: 1, minHeight: 54, borderColor: colors.border, borderWidth: 1, borderRadius: 13, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
    roleSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleText: { color: colors.textPrimary, fontWeight: '700' },
    roleTextSelected: { color: colors.textOnPrimary },
    message: { color: '#B3265E', marginBottom: 12 },
    link: { color: colors.primary, fontWeight: '700', textAlign: 'center', marginTop: 18 },
  });
}