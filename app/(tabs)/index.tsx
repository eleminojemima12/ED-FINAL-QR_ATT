import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import Header from '@/components/Header';

export default function Index() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Header title="QR Attendance" />
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.mainTitle}>School Event Attendance</Text>
        <Text style={styles.subtitle}>
          Scan QR Codes to record attendance during school activities.
        </Text>
      </View>

      <View style={styles.footerContainer}>
        <AppButton
          theme="primary"
          title="Scan QR Code"
          icon="qr-code-outline"
          onPress={() => router.push('/scan')}
        />
        <AppButton
          title="Attendance History"
          icon="time-outline"
          onPress={() => router.push('/history')}
        />
        <AppButton
          title="Profile"
          icon="person-outline"
          onPress={() => router.push('/profile')}
        />
        {profile?.role === 'teacher' && (
          <AppButton
            theme="primary"
            title="Create Event QR"
            icon="school-outline"
            onPress={() => router.push('/teacher')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, alignItems: 'center' },
    headerContainer: { flex: 1, justifyContent: 'center' },
    bodyContainer: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 16 },
    mainTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    footerContainer: { flex: 1 / 3, alignItems: 'center', paddingHorizontal: 24, width: '100%' },
  });
}
