import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';

export default function Index() {
  const { profile, session } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingEyebrow}>QR ATTENDANCE</Text>
            <Text style={styles.greetingTitle}>Hello, {firstName}</Text>
            <Text style={styles.greetingSubtitle}>Ready for your next school event?</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
          >
            <Ionicons name="person-outline" size={21} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <View style={styles.heroPill}>
              <View style={styles.liveDot} />
              <Text style={styles.heroPillText}>ATTENDANCE MADE EASY</Text>
            </View>
            <Text style={styles.heroTitle}>Show up.{'\n'}Scan in.</Text>
            <Text style={styles.heroDescription}>
              Scan an event QR code to record your attendance in seconds.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/scan')}
              style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
            >
              <Text style={styles.heroButtonText}>Scan QR code</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.heroArtwork}>
            <View style={styles.artworkCircle}>
              <Ionicons name="qr-code" size={70} color={colors.textOnPrimary} />
            </View>
            <View style={styles.artworkSparkle}>
              <Ionicons name="sparkles" size={17} color={colors.textOnPrimary} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <Text style={styles.sectionCaption}>Everything you need, in one place.</Text>
        </View>
        <View style={styles.quickActions}>
          <QuickAction
            icon="time-outline"
            title="Attendance history"
            description="Review past check-ins"
            onPress={() => router.push('/history')}
            styles={styles}
            colors={colors}
          />
          {profile?.role === 'administrator' ? (
            <QuickAction
              icon="shield-checkmark-outline"
              title="Admin panel"
              description="Manage users, events & attendance"
              onPress={() => router.push('/admin')}
              styles={styles}
              colors={colors}
            />
          ) : profile?.role === 'teacher' ? (
            <QuickAction
              icon="add-circle-outline"
              title="Create an event"
              description="Set up an event QR"
              onPress={() => router.push('/teacher')}
              styles={styles}
              colors={colors}
            />
          ) : (
            <QuickAction
              icon="person-outline"
              title="Your profile"
              description={session?.user.email ?? 'Manage your account'}
              onPress={() => router.push('/profile')}
              styles={styles}
              colors={colors}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
};

function QuickAction({ icon, title, description, onPress, styles, colors }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDescription} numberOfLines={1}>{description}</Text>
      <View style={styles.quickActionArrow}>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, paddingBottom: 36 },
    greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
    greetingEyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
    greetingTitle: { color: colors.textPrimary, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
    greetingSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
    profileButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    heroCard: { flexDirection: 'row', minHeight: 230, overflow: 'hidden', borderRadius: 24, padding: 21, backgroundColor: colors.primary, marginBottom: 28 },
    heroCopy: { flex: 1, zIndex: 1 },
    heroPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 14 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: 6 },
    heroPillText: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
    heroTitle: { color: colors.textOnPrimary, fontSize: 28, fontWeight: '800', lineHeight: 32, letterSpacing: -0.4 },
    heroDescription: { maxWidth: 260, color: colors.textOnPrimary, opacity: 0.82, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 15 },
    heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12 },
    heroButtonText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
    heroArtwork: { width: 112, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    artworkCircle: { width: 104, height: 104, borderRadius: 34, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
    artworkSparkle: { position: 'absolute', top: 7, right: 1, width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    sectionHeading: { marginBottom: 13 },
    sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
    sectionCaption: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
    quickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    quickAction: { flex: 1, minWidth: 0, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14 },
    quickActionIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
    quickActionTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    quickActionDescription: { color: colors.textSecondary, fontSize: 11 },
    quickActionArrow: { position: 'absolute', right: 13, top: 23 },
    pressed: { opacity: 0.78 },
  });
}
