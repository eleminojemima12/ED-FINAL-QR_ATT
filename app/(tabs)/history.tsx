import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import {
  getAttendanceHistory,
  getTeacherEventSummaries,
  getAllEventSummaries,
  type AttendanceRecord,
  type TeacherEventSummary,
  type AllEventSummary,
} from '@/lib/attendance';

type Filter = 'all' | 'upcoming' | 'live' | 'ended' | 'this-month';

export default function HistoryScreen() {
  const { session, profile } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<TeacherEventSummary[]>([]);
  const [allEvents, setAllEvents] = useState<AllEventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const isTeacher = profile?.role === 'teacher';
  const isAdministrator = profile?.role === 'administrator';

  const loadHistory = useCallback(async (showRefresh = false) => {
    if (!session || !profile) {
      setLoading(false);
      return;
    }
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      if (profile.role === 'student') {
        setRecords(await getAttendanceHistory(session.user.id));
      } else if (profile.role === 'administrator') {
        setAllEvents(await getAllEventSummaries());
      } else {
        setEvents(await getTeacherEventSummaries(session.user.id));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, session]);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      if (!session || !profile) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (profile.role === 'student') {
          const history = await getAttendanceHistory(session.user.id);
          if (active) setRecords(history);
        } else if (profile.role === 'administrator') {
          const summaries = await getAllEventSummaries();
          if (active) setAllEvents(summaries);
        } else {
          const summaries = await getTeacherEventSummaries(session.user.id);
          if (active) setEvents(summaries);
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load history.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [profile, session]));

  const now = Date.now();
  const statusFor = (event: TeacherEventSummary): Exclude<Filter, 'all' | 'this-month'> => {
    if (now < new Date(event.startsAt).getTime()) return 'upcoming';
    if (now <= new Date(event.endsAt).getTime()) return 'live';
    return 'ended';
  };

  const visibleEvents = useMemo(() => {
    const source = isAdministrator ? allEvents : events;
    if ((!isTeacher && !isAdministrator) || filter === 'all' || filter === 'this-month') return source;
    return source.filter((event) => statusFor(event) === filter);
  }, [events, allEvents, filter, isTeacher, isAdministrator, now]);

  const visibleRecords = useMemo(() => {
    if ((isTeacher || isAdministrator) || filter !== 'this-month') return records;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return records.filter((record) => new Date(record.scannedAt) >= startOfMonth);
  }, [filter, isTeacher, isAdministrator, records]);

  const filterOptions: { id: Filter; label: string }[] = (isTeacher || isAdministrator)
    ? [
        { id: 'all', label: 'All' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'live', label: 'Live' },
        { id: 'ended', label: 'Ended' },
      ]
    : [
        { id: 'all', label: 'All records' },
        { id: 'this-month', label: 'This month' },
      ];

  const count = (isTeacher || isAdministrator) ? visibleEvents.length : visibleRecords.length;

  const header = (
    <View>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{isAdministrator ? 'SYSTEM OVERVIEW' : isTeacher ? 'TEACHER TOOLS' : 'YOUR ACTIVITY'}</Text>
        <Text style={styles.title}>{isAdministrator ? 'Overall attendance' : isTeacher ? 'Event history' : 'Attendance history'}</Text>
        <Text style={styles.subtitle}>
          {isAdministrator
            ? 'View every event and attendance record across the system.'
            : isTeacher
            ? 'Keep track of the events you have created.'
            : 'Your checked-in school events, all in one place.'}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name={isAdministrator ? 'document-text-outline' : isTeacher ? 'calendar-outline' : 'checkmark-done-outline'} size={22} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryCount}>{isAdministrator ? allEvents.length : isTeacher ? events.length : records.length}</Text>
          <Text style={styles.summaryLabel}>{isAdministrator ? 'system events' : isTeacher ? 'events created' : 'events attended'}</Text>
        </View>
        <View style={styles.summaryAccent}>
          <Ionicons name="sparkles-outline" size={19} color={colors.accent} />
        </View>
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.sectionTitle}>{isAdministrator ? 'All system events' : isTeacher ? 'Your events' : 'Your check-ins'}</Text>
          <Text style={styles.sectionSubtitle}>
            {loading ? 'Updating your history…' : `${count} ${count === 1 ? 'result' : 'results'}`}
          </Text>
        </View>
        <View style={styles.listIcon}>
          <Ionicons name="list-outline" size={18} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filterOptions.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === option.id }}
            onPress={() => setFilter(option.id)}
            style={({ pressed }) => [
              styles.filterChip,
              filter === option.id && styles.filterChipSelected,
              pressed && styles.filterChipPressed,
            ]}
          >
            <Text style={[styles.filterText, filter === option.id && styles.filterTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={19} color="#B3261E" />
          <Text style={styles.error}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadHistory()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadHistory(true)}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {header}
      {loading ? (
        <View style={styles.emptyCard}>
          <Ionicons name="time-outline" size={25} color={colors.primary} />
          <Text style={styles.emptyTitle}>Loading history</Text>
          <Text style={styles.emptyDescription}>Your records will be here in a moment.</Text>
        </View>
      ) : isAdministrator ? (
        visibleEvents.length ? visibleEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            status={statusFor(event)}
            styles={styles}
            colors={colors}
          />
        )) : <EmptyState
          icon="calendar-clear-outline"
          title={filter === 'all' ? 'No events yet' : `No ${filter} events`}
          description="No events have been created in the system yet."
          styles={styles}
          colors={colors}
        />
      ) : isTeacher ? (
        visibleEvents.length ? visibleEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            status={statusFor(event)}
            styles={styles}
            colors={colors}
          />
        )) : <EmptyState
          icon="calendar-clear-outline"
          title={filter === 'all' ? 'No events yet' : `No ${filter} events`}
          description={filter === 'all'
            ? 'Events you create will show up here.'
            : 'Try another filter or create an event to get started.'}
          styles={styles}
          colors={colors}
        />
      ) : visibleRecords.length ? visibleRecords.map((record) => (
        <AttendanceCard key={record.id} record={record} styles={styles} colors={colors} />
      )) : <EmptyState
        icon="qr-code-outline"
        title={filter === 'all' ? 'No check-ins yet' : 'No check-ins this month'}
        description="When you scan an event QR code, your attendance record will appear here."
        styles={styles}
        colors={colors}
      />}
    </ScrollView>
  );
}

type CardProps = {
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
};

function EventCard({ event, status, styles, colors }: CardProps & {
  event: TeacherEventSummary;
  status: Exclude<Filter, 'all' | 'this-month'>;
}) {
  const statusLabel = status === 'live' ? 'Live now' : status[0].toUpperCase() + status.slice(1);
  const statusIcon = status === 'live' ? 'radio-button-on' : status === 'upcoming' ? 'time-outline' : 'checkmark-circle-outline';
  const attendeeLabel = `${event.attendeeCount} ${event.attendeeCount === 1 ? 'attendee' : 'attendees'}`;

  return (
    <View style={styles.eventCard}>
      <View style={styles.cardTop}>
        <View style={styles.eventIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.cardCode}>CODE  ·  {event.code}</Text>
        </View>
        <View style={[styles.statusBadge, status === 'live' && styles.liveBadge]}>
          <Ionicons name={statusIcon} size={12} color={status === 'live' ? '#15803D' : colors.textSecondary} />
          <Text style={[styles.statusText, status === 'live' && styles.liveText]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.eventFooter}>
        <View style={styles.metadata}>
          <Ionicons name="calendar-clear-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metadataText}>{formatDate(event.startsAt)}</Text>
        </View>
        <View style={styles.metadata}>
          <Ionicons name="people-outline" size={14} color={colors.primary} />
          <Text style={styles.attendeeText}>{attendeeLabel}</Text>
        </View>
      </View>
      <View style={styles.eventTimes}>
        <Text style={styles.metadataText}>Starts {formatTime(event.startsAt)}</Text>
        <Text style={styles.metadataText}>Ends {formatTime(event.endsAt)}</Text>
      </View>
    </View>
  );
}

function AttendanceCard({ record, styles, colors }: CardProps & { record: AttendanceRecord }) {
  const date = new Date(record.scannedAt);

  const statusColor = (status: string) => {
    switch (status) {
      case 'present': return '#15803D';
      case 'late': return '#B45309';
      case 'absent': return '#B3261E';
      default: return colors.textSecondary;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'late': return 'Late';
      case 'absent': return 'Absent';
      default: return status;
    }
  };

  return (
    <View style={styles.attendanceCard}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateMonth}>
          {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={styles.dateDay}>{date.getDate()}</Text>
      </View>
      <View style={styles.attendanceInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{record.eventTitle}</Text>
        <Text style={styles.metadataText}>
          {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <View style={styles.checkedIn}>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          <Text style={styles.checkedInText}>
            Attendance recorded · {formatTime(record.scannedAt)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: statusColor(record.attendanceStatus) }]}>
            {statusLabel(record.attendanceStatus)}
          </Text>
        </View>
      </View>
      <Ionicons name="checkmark-circle" size={21} color={colors.primary} />
    </View>
  );
}

function EmptyState({ icon, title, description, styles, colors }: CardProps & {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={25} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, paddingBottom: 36 },
    header: { marginBottom: 20 },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
    title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
    summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, padding: 16, marginBottom: 25 },
    summaryIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    summaryCopy: { flex: 1 },
    summaryCount: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
    summaryLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
    summaryAccent: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
    sectionSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
    listIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    filters: { gap: 8, paddingBottom: 15 },
    filterChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 13, paddingVertical: 8 },
    filterChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipPressed: { opacity: 0.75 },
    filterText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
    filterTextSelected: { color: colors.textOnPrimary },
    eventCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 15, marginBottom: 11 },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    eventIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
    eventInfo: { flex: 1, minWidth: 0 },
    cardTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
    cardCode: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, marginLeft: 7 },
    liveBadge: { backgroundColor: '#DCFCE7' },
    statusText: { color: colors.textSecondary, fontSize: 9, fontWeight: '700' },
    liveText: { color: '#15803D' },
    cardDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    eventFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    metadata: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
    metadataText: { color: colors.textSecondary, fontSize: 10 },
    attendeeText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
    eventTimes: { flexDirection: 'row', gap: 14, marginTop: 7 },
    attendanceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 11 },
    dateBadge: { width: 48, height: 52, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    dateMonth: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    dateDay: { color: colors.textPrimary, fontSize: 21, fontWeight: '800', marginTop: 1 },
    attendanceInfo: { flex: 1, minWidth: 0, marginRight: 9 },
    checkedIn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    checkedInText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    statusLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
    statusValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDECEC', padding: 12, borderRadius: 12, marginBottom: 12 },
    error: { color: '#B3261E', fontSize: 12, flex: 1 },
    retryButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF', borderRadius: 8 },
    retryText: { color: '#B3261E', fontSize: 11, fontWeight: '700' },
    emptyCard: { alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 26, marginTop: 4 },
    emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 5 },
    emptyDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  });
}
