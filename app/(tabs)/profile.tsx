import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { THEME_PALETTES } from '@/constants/colors';
import { signOut } from '@/lib/auth';
import { updateProfile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { profile, session, refreshProfile } = useAuth();
  const { theme, palette, colors, setTheme, setPalette, storageError } = useTheme();
  const styles = createStyles(colors);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const saveProfile = async () => {
    if (!profile || !fullName.trim()) return;
    try {
      await updateProfile(profile.id, fullName);
      await refreshProfile();
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update profile.');
    }
  };

  const changeTheme = async (enabled: boolean) => {
    try {
      await setTheme(enabled ? 'dark' : 'light');
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save theme preference.');
    }
  };

  const changePalette = async (nextPalette: typeof palette) => {
    try {
      await setPalette(nextPalette);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save color theme.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.role}>{profile?.role === 'teacher' ? 'Teacher' : 'Student'}</Text>
        <Text style={styles.detail}>{session?.user.email}</Text>
        <Text style={styles.detail}>User ID: {session?.user.id}</Text>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.themeRow}>
          <View style={styles.themeText}>
            <Text style={styles.label}>Dark theme</Text>
            <Text style={styles.detail}>Use a darker color scheme throughout the app.</Text>
          </View>
          <Switch
            accessibilityLabel="Dark theme"
            value={theme === 'dark'}
            onValueChange={changeTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
        <Text style={styles.label}>Color theme</Text>
        <View style={styles.paletteRow}>
          {THEME_PALETTES.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: palette === option.id }}
              accessibilityLabel={`${option.label} color theme`}
              onPress={() => changePalette(option.id)}
              style={[
                styles.paletteOption,
                palette === option.id && styles.paletteOptionSelected,
              ]}
            >
              <View style={[styles.paletteSwatch, { backgroundColor: option.swatch }]}>
                {palette === option.id && <Ionicons name="checkmark" size={17} color="#FFFFFF" />}
              </View>
              <Text style={styles.paletteLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {storageError && <Text style={styles.storageError}>Theme preference: {storageError}</Text>}
        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
        {message && <Text style={styles.message}>{message}</Text>}
        <AppButton theme="primary" title="Save profile" icon="save-outline" onPress={saveProfile} />
        <AppButton title="Sign out" icon="log-out-outline" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, flexGrow: 1 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
    title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 4 },
    role: { color: colors.textSecondary, fontSize: 15, marginBottom: 20 },
    detail: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
    sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 12 },
    themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
    themeText: { flex: 1, paddingRight: 12 },
    paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 20 },
    paletteOption: { alignItems: 'center', justifyContent: 'center', minWidth: 70, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 12 },
    paletteOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
    paletteSwatch: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    paletteLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
    label: { color: colors.textPrimary, fontWeight: '600', marginBottom: 8 },
    input: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12 },
    message: { color: colors.primary, marginBottom: 12 },
    storageError: { color: '#B71C1C', marginBottom: 12 },
  });
}