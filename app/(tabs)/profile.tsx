import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { THEME_PALETTES } from '@/constants/colors';
import { signOut } from '@/lib/auth';
import { updateProfile, type UserRole } from '@/lib/profiles';

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Your profile</Text>
          <Text style={styles.subtitle}>Manage your account and personalize your app.</Text>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name || session?.user.email || 'U').trim().charAt(0).toUpperCase()}
              </Text>
          </View>
          <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{profile?.full_name || 'Welcome'}</Text>
              <Text style={styles.accountEmailHero}>{session?.user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{profile?.role === 'administrator' ? 'Administrator' : profile?.role === 'teacher' ? 'Teacher' : 'Student'}</Text>
              </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
              <Ionicons name="color-palette-outline" size={19} color={colors.primary} />
          </View>
          <View>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <Text style={styles.sectionSubtitle}>Make the app feel like yours.</Text>
          </View>
        </View>
        <View style={styles.settingsCard}>
          <View style={styles.themeRow}>
              <View style={styles.settingIcon}>
                <Ionicons name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.primary} />
              </View>
              <View style={styles.themeText}>
                <Text style={styles.label}>Dark theme</Text>
                <Text style={styles.settingDescription}>A comfortable look in low light.</Text>
              </View>
              <Switch
                accessibilityLabel="Dark theme"
                value={theme === 'dark'}
                onValueChange={changeTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
          </View>

          <View style={styles.divider} />

          <Text style={styles.label}>Color theme</Text>
          <View style={styles.paletteRow}>
              {THEME_PALETTES.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: palette === option.id }}
                  accessibilityLabel={`${option.label} color theme`}
                  onPress={() => changePalette(option.id)}
                  style={({ pressed }) => [
                    styles.paletteOption,
                    palette === option.id && styles.paletteOptionSelected,
                    pressed && styles.paletteOptionPressed,
                  ]}
                >
                  <View style={[styles.paletteSwatch, { backgroundColor: option.swatch }]}>
                    {palette === option.id && <Ionicons name="checkmark" size={17} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.paletteLabel}>{option.label}</Text>
                </Pressable>
              ))}
          </View>
        </View>

        {storageError && <Text style={styles.storageError}>Theme preference: {storageError}</Text>}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
              <Ionicons name="person-outline" size={19} color={colors.primary} />
          </View>
          <View>
              <Text style={styles.sectionTitle}>Personal details</Text>
              <Text style={styles.sectionSubtitle}>Keep your profile information up to date.</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
              <Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} />
          </View>
          <View>
              <Text style={styles.sectionTitle}>Your role &amp; capabilities</Text>
              <Text style={styles.sectionSubtitle}>What you can do in the app.</Text>
          </View>
        </View>
        <View style={styles.settingsCard}>
          <RoleCapabilities role={profile?.role ?? 'student'} styles={styles} colors={colors} />
        </View>
        <View style={styles.settingsCard}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
          />
          <Text style={styles.accountEmail}>Account ID: {session?.user.id}</Text>
        </View>

        {message && <Text style={styles.message}>{message}</Text>}
        <View style={styles.actions}>
          <AppButton theme="primary" title="Save profile" icon="save-outline" onPress={saveProfile} />
          <AppButton title="Sign out" icon="log-out-outline" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleCapabilities({ role, styles, colors }: {
  role: UserRole;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const capabilities: { title: string; items: string[] }[] =
    role === 'administrator'
      ? [
          {
            title: 'Administrator',
            items: [
              'Manage all user accounts and roles',
              'Create, edit, and delete any event',
              'View overall attendance across the system',
              'Correct or delete any attendance record',
              'View system statistics and reports',
            ],
          },
        ]
      : role === 'teacher'
      ? [
          {
            title: 'Teacher',
            items: [
              'Create events and QR codes',
              'View attendance for your own events',
              'Scan QR codes is for students only',
            ],
          },
        ]
      : [
          {
            title: 'Student',
            items: [
              'Scan QR codes to record attendance',
              'View your own attendance history',
              'Edit your profile name',
            ],
          },
        ];

  return (
    <View>
      {capabilities.map((cap) => (
        <View key={cap.title} style={styles.roleCapCard}>
          <Text style={styles.roleCapTitle}>{cap.title}</Text>
          {cap.items.map((item, i) => (
            <View key={i} style={styles.roleCapItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
              <Text style={styles.roleCapText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 22, paddingBottom: 36, flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
    pageHeader: { marginBottom: 22 },
    eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 7 },
    title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginBottom: 5 },
    subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
    accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, padding: 20, marginBottom: 28 },
    avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    avatarText: { color: colors.primary, fontSize: 25, fontWeight: '800' },
    accountInfo: { flex: 1 },
    accountName: { color: colors.textOnPrimary, fontSize: 18, fontWeight: '700', marginBottom: 3 },
    accountEmail: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
    accountEmailHero: { color: colors.textOnPrimary, opacity: 0.8, fontSize: 12, marginBottom: 4 },
    roleBadge: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginTop: 4 },
    roleBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 11 },
    sectionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
    sectionSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    settingsCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 17, marginBottom: 26 },
    themeRow: { flexDirection: 'row', alignItems: 'center' },
    settingIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight, marginRight: 12 },
    themeText: { flex: 1, paddingRight: 10 },
    settingDescription: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 17 },
    paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    paletteOption: { flex: 1, minWidth: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 11, paddingHorizontal: 8 },
    paletteOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
    paletteOptionPressed: { opacity: 0.75 },
    paletteSwatch: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    paletteLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
    label: { color: colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 8 },
    input: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, borderRadius: 12, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10, fontSize: 15 },
    message: { color: colors.primary, marginBottom: 12 },
    storageError: { color: '#B71C1C', marginBottom: 20 },
    roleCapCard: { backgroundColor: colors.surfaceLight, borderRadius: 14, padding: 14, marginBottom: 10 },
    roleCapTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 8 },
    roleCapItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 },
    roleCapText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
    actions: { marginTop: 'auto' },
  });
}