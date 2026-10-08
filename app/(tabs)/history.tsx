import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import {
  getAttendanceHistory,
  getTeacherEventSummaries,
  type AttendanceRecord,
  type TeacherEventSummary,
} from '@/lib/attendance';

export default function HistoryScreen() {
  const { session, profile } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<TeacherEventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!session) return;
    const load = async () => {
      try {
        if (profile?.role === 'student') {
          setRecords(await getAttendanceHistory(session.user.id));
        } else if (profile?.role === 'teacher') {
          setEvents(await getTeacherEventSummaries(session.user.id));
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not load history.');
      }
    };
    load();
  }, [profile?.role, session]));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {profile?.role === 'teacher' ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={events.length ? styles.list : styles.emptyList}
          ListEmptyComponent={<Text style={styles.subtitle}>Your created events will appear here.</Text>}
          renderItem={({ item }) => (
            <View style={styles.record}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Text style={styles.recordDetail}>Code: {item.code}</Text>
              <Text style={styles.recordDetail}>{item.attendeeCount} attendee{item.attendeeCount === 1 ? '' : 's'}</Text>
              <Text style={styles.recordDetail}>{new Date(item.startsAt).toLocaleString()}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={records.length ? styles.list : styles.emptyList}
          ListEmptyComponent={<Text style={styles.subtitle}>Your past attendance records will appear here.</Text>}
          renderItem={({ item }) => (
            <View style={styles.record}>
              <Text style={styles.recordTitle}>{item.eventTitle}</Text>
              <Text style={styles.recordDetail}>{new Date(item.scannedAt).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 24 },
    title: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
    subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    list: { paddingBottom: 24 },
    emptyList: { flexGrow: 1, justifyContent: 'center' },
    record: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    recordTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
    recordDetail: { fontSize: 13, color: colors.textSecondary },
    error: { color: '#B71C1C', marginBottom: 12 },
  });
}
