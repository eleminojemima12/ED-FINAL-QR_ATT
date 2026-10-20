import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import {
  getAllProfiles,
  type Profile,
  type UserRole,
  updateProfileRole,
} from '@/lib/profiles';
import {
  getAllEvents,
  deleteEvent,
  updateEvent,
  type Event,
} from '@/lib/events';
import {
  getAllAttendance,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceStats,
  type AttendanceRecordAdmin,
  type AttendanceStats,
} from '@/lib/attendance';

type Tab = 'overview' | 'users' | 'events' | 'attendance';

function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function AdminScreen() {
  const { profile, role } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordAdmin[]>([]);

  // User management state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [savingEventId, setSavingEventId] = useState<string | null>(null);

  // Attendance correction state
  const [correctingRecordId, setCorrectingRecordId] = useState<string | null>(null);
  const [correctEventId, setCorrectEventId] = useState('');
  const [correctStudentId, setCorrectStudentId] = useState('');
  const [correctStatus, setCorrectStatus] = useState('present');

  const isAdmin = role === 'administrator';

  const loadData = useCallback(async (showRefresh = false) => {
    if (!isAdmin) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [s, p, e, a] = await Promise.all([
        getAttendanceStats(),
        getAllProfiles(),
        getAllEvents(),
        getAllAttendance(),
      ]);
      setStats(s);
      setProfiles(p);
      setEvents(e);
      setAttendance(a);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        if (!isAdmin) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
          const [s, p, e, a] = await Promise.all([
            getAttendanceStats(),
            getAllProfiles(),
            getAllEvents(),
            getAllAttendance(),
          ]);
          if (active) {
            setStats(s);
            setProfiles(p);
            setEvents(e);
            setAttendance(a);
          }
        } catch (reason) {
          if (active) setError(reason instanceof Error ? reason.message : 'Could not load admin data.');
        } finally {
          if (active) setLoading(false);
        }
      };
      void load();
      return () => { active = false; };
    }, [isAdmin])
  );

  const changeUserRole = async (userId: string, nextRole: UserRole) => {
    if (userId === profile?.id) {
      setMessage('You cannot change your own role.');
      return;
    }
    try {
      await updateProfileRole(userId, nextRole);
      setEditingUserId(null);
      setMessage('User role updated.');
      await loadData(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update role.');
    }
  };

  const removeEvent = async (eventId: string) => {
    const confirmed = await confirmAction(
      'Delete event',
      'This will also remove all attendance records for this event.'
    );
    if (!confirmed) return;
    try {
      await deleteEvent(eventId);
      setMessage('Event deleted.');
      await loadData(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete event.');
    }
  };

  const saveEventChanges = async (eventId: string, title: string, code: string) => {
    if (!title.trim() || !code.trim()) {
      setMessage('Event title and code are required.');
      return false;
    }
    try {
      setSavingEventId(eventId);
      await updateEvent(eventId, { title: title.trim(), code: code.trim() });
      setMessage('Event updated.');
      await loadData(true);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update event.');
      return false;
    } finally {
      setSavingEventId(null);
    }
  };

  const correctAttendance = async () => {
    if (!correctingRecordId) return;
    try {
      await updateAttendanceRecord(correctingRecordId, {
        event_id: correctEventId.trim() || undefined,
        student_id: correctStudentId.trim() || undefined,
        attendance_status: correctStatus,
      });
      setCorrectingRecordId(null);
      setCorrectEventId('');
      setCorrectStudentId('');
      setCorrectStatus('present');
      setMessage('Attendance record corrected.');
      await loadData(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not correct record.');
    }
  };

  const deleteAttendance = async (recordId: string) => {
    const confirmed = await confirmAction(
      'Delete record',
      'This will remove this attendance record.'
    );
    if (!confirmed) return;
    try {
      await deleteAttendanceRecord(recordId);
      setMessage('Attendance record deleted.');
      await loadData(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete record.');
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Administrator access is required.</Text>
      </View>
    );
  }

  const tabs: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'overview', label: 'Overview', icon: 'document-text-outline' },
    { id: 'users', label: 'Users', icon: 'people-outline' },
    { id: 'events', label: 'Events', icon: 'calendar-outline' },
    { id: 'attendance', label: 'Attendance', icon: 'checkmark-done-outline' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadData(true)}
          tintColor={colors.primary}
        />
      }
    >
      {loading && (
        <View style={styles.emptyCard}>
          <Ionicons name="time-outline" size={25} color={colors.primary} />
          <Text style={styles.emptyTitle}>Loading admin data</Text>
        </View>
      )}

      {!loading && (
        <>
          <View style={styles.adminNav}>
            <View style={styles.adminTabs} accessibilityRole="tablist">
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab.id }}
                onPress={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                  setError(null);
                }}
                style={({ pressed }) => [
                  styles.adminTab,
                  activeTab === tab.id && styles.adminTabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.id ? colors.textOnPrimary : colors.textSecondary}
                />
                <Text style={[
                  styles.adminTabText,
                  activeTab === tab.id && styles.adminTabTextSelected,
                ]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
            </View>
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={19} color="#B3261E" />
              <Text style={styles.error}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadData(true)}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {message && (
            <View style={styles.messageCard}>
              <Ionicons name="checkmark-circle" size={19} color={colors.primary} />
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}

          {/* Overview */}
          {activeTab === 'overview' && (
            <>
              <View style={styles.overviewHero}>
                <View style={styles.overviewHeroCopy}>
                  <Text style={styles.overviewEyebrow}>ADMIN DASHBOARD</Text>
                  <Text style={styles.overviewTitle}>
                    Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ' back'}
                  </Text>
                  <Text style={styles.overviewSubtitle}>
                    Your at-a-glance view of users, events, and attendance.
                  </Text>
                </View>
                <View style={styles.overviewHeroIcon}>
                  <Ionicons name="shield-checkmark" size={26} color={colors.textOnPrimary} />
                </View>
              </View>

              {stats && (
                <>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>System totals</Text>
                      <Text style={styles.sectionSubtitle}>All-time counts</Text>
                    </View>
                    <Ionicons name="stats-chart-outline" size={19} color={colors.primary} />
                  </View>
                  <View style={styles.statsGrid}>
                    <StatCard
                      label="Events"
                      value={stats.totalEvents}
                      icon="calendar-outline"
                      styles={styles}
                      colors={colors}
                    />
                    <StatCard
                      label="Check-ins"
                      value={stats.totalAttendance}
                      icon="checkmark-done-outline"
                      styles={styles}
                      colors={colors}
                    />
                    <StatCard
                      label="Students"
                      value={stats.totalStudents}
                      icon="person-outline"
                      styles={styles}
                      colors={colors}
                    />
                    <StatCard
                      label="Teachers"
                      value={stats.totalTeachers}
                      icon="school-outline"
                      styles={styles}
                      colors={colors}
                    />
                    <StatCard
                      label="Administrators"
                      value={stats.totalAdministrators}
                      icon="shield-checkmark-outline"
                      styles={styles}
                      colors={colors}
                    />
                  </View>
                </>
              )}

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Quick actions</Text>
                  <Text style={styles.sectionSubtitle}>Choose an area to manage.</Text>
                </View>
                <Ionicons name="flash-outline" size={19} color={colors.primary} />
              </View>
              <View style={styles.quickActions}>
                <QuickAction
                  icon="people-outline"
                  title="Manage users"
                  description="View accounts and update access roles"
                  onPress={() => setActiveTab('users')}
                  styles={styles}
                  colors={colors}
                />
                <QuickAction
                  icon="calendar-outline"
                  title="Manage events"
                  description="Review, edit, or remove events"
                  onPress={() => setActiveTab('events')}
                  styles={styles}
                  colors={colors}
                />
                <QuickAction
                  icon="checkmark-done-outline"
                  title="Manage attendance"
                  description="Correct attendance or remove records"
                  onPress={() => setActiveTab('attendance')}
                  styles={styles}
                  colors={colors}
                />
              </View>
            </>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <>
              <View style={styles.pageHeader}>
                <Text style={styles.eyebrow}>ADMIN PANEL</Text>
                <Text style={styles.title}>Manage users</Text>
                <Text style={styles.subtitle}>
                  View every account and change a user's role (Student / Teacher / Administrator).
                </Text>
              </View>

              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.sectionTitle}>All accounts ({profiles.length})</Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap a role badge to change it. You cannot change your own role.
                  </Text>
                </View>
              </View>

              {profiles.length === 0 ? (
                <EmptyState
                  icon="people-outline"
                  title="No users found"
                  styles={styles}
                  colors={colors}
                />
              ) : (
                profiles.map((p) => (
                  <UserRow
                    key={p.id}
                    profile={p}
                    isSelf={p.id === profile?.id}
                    onChangeRole={(nextRole) => changeUserRole(p.id, nextRole)}
                    editingUserId={editingUserId}
                    setEditingUserId={setEditingUserId}
                    newRole={newRole}
                    setNewRole={setNewRole}
                    styles={styles}
                    colors={colors}
                  />
                ))
              )}
            </>
          )}

          {/* Events */}
          {activeTab === 'events' && (
            <>
              <View style={styles.pageHeader}>
                <Text style={styles.eyebrow}>ADMIN PANEL</Text>
                <Text style={styles.title}>Manage events</Text>
                <Text style={styles.subtitle}>
                  View every event in the system. Edit details or delete an event (and its attendance).
                </Text>
              </View>

              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.sectionTitle}>All events ({events.length})</Text>
                  <Text style={styles.sectionSubtitle}>
                    Deleting an event removes all attendance records for it.
                  </Text>
                </View>
              </View>

              {events.length === 0 ? (
                <EmptyState icon="calendar-clear-outline" title="No events found" styles={styles} colors={colors} />
              ) : (
                events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onDelete={removeEvent}
                    onSave={saveEventChanges}
                    saving={savingEventId === event.id}
                    styles={styles}
                    colors={colors}
                  />
                ))
              )}
            </>
          )}

          {/* Attendance */}
          {activeTab === 'attendance' && (
            <>
              <View style={styles.pageHeader}>
                <Text style={styles.eyebrow}>ADMIN PANEL</Text>
                <Text style={styles.title}>Manage attendance</Text>
                <Text style={styles.subtitle}>
                  View every attendance record. Correct event/student links or delete records.
                </Text>
              </View>

              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.sectionTitle}>All records ({attendance.length})</Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap "Correct" to fix a record, or "Delete" to remove it.
                  </Text>
                </View>
              </View>

              {attendance.length === 0 ? (
                <EmptyState icon="qr-code-outline" title="No attendance records" styles={styles} colors={colors} />
              ) : (
                attendance.map((record) => (
                  <AttendanceRow
                    key={record.id}
                    record={record}
                    onCorrect={() => {
                      setCorrectingRecordId(record.id);
                      setCorrectEventId(record.eventId);
                      setCorrectStudentId(record.studentId);
                      setCorrectStatus(record.attendanceStatus);
                    }}
                    onDelete={deleteAttendance}
                    correctingRecordId={correctingRecordId}
                    setCorrectingRecordId={setCorrectingRecordId}
                    correctEventId={correctEventId}
                    setCorrectEventId={setCorrectEventId}
                    correctStudentId={correctStudentId}
                    setCorrectStudentId={setCorrectStudentId}
                    correctStatus={correctStatus}
                    setCorrectStatus={setCorrectStatus}
                    saveCorrection={correctAttendance}
                    styles={styles}
                    colors={colors}
                  />
                ))
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, icon, styles, colors }: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, title, description, onPress, styles, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint="Opens this admin management area"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={styles.quickActionCopy}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <View style={styles.quickActionArrow}>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

function UserRow({
  profile,
  isSelf,
  onChangeRole,
  editingUserId,
  setEditingUserId,
  newRole,
  setNewRole,
  styles,
  colors,
}: {
  profile: Profile;
  isSelf: boolean;
  onChangeRole: (nextRole: UserRole) => void;
  editingUserId: string | null;
  setEditingUserId: (id: string | null) => void;
  newRole: UserRole;
  setNewRole: (role: UserRole) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const isEditing = editingUserId === profile.id;
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  return (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {(profile.full_name?.trim().charAt(0) || 'U').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userCopy}>
          <Text style={styles.userName}>{profile.full_name || 'Unnamed user'}</Text>
          <Text style={styles.userEmail}>ID · {profile.id}</Text>
          <View style={styles.roleBadgeRow}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        {isEditing ? (
          <View style={styles.roleEditRow}>
            {(['student', 'teacher', 'administrator'] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: newRole === option }}
                onPress={() => setNewRole(option)}
                style={[
                  styles.roleChip,
                  newRole === option && styles.roleChipSelected,
                ]}
              >
                <Text style={[styles.roleChipText, newRole === option && styles.roleChipTextSelected]}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => onChangeRole(newRole)}
              style={styles.saveRoleButton}
            >
              <Text style={styles.saveRoleButtonText}>Save</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditingUserId(null)}
              style={styles.cancelRoleButton}
            >
              <Text style={styles.cancelRoleButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={isSelf}
            onPress={() => {
              if (isSelf) return;
              setEditingUserId(profile.id);
              setNewRole(profile.role as UserRole);
            }}
            style={[
              styles.changeRoleButton,
              isSelf && styles.changeRoleButtonDisabled,
            ]}
          >
            <Text style={[styles.changeRoleButtonText, isSelf && styles.changeRoleButtonTextDisabled]}>
              {isSelf ? 'Your role' : 'Change role'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EventRow({
  event,
  onDelete,
  onSave,
  saving,
  styles,
  colors,
}: {
  event: Event;
  onDelete: (id: string) => void;
  onSave: (id: string, title: string, code: string) => Promise<boolean>;
  saving: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [code, setCode] = useState(event.code);

  return (
    <View style={[styles.eventRow, editing && styles.eventRowEditing]}>
      {editing ? (
        <View style={styles.eventEditContent}>
          <TextInput
            accessibilityLabel="Event title"
            style={styles.eventEditInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            accessibilityLabel="Event code"
            style={styles.eventEditInput}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Event code"
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.eventEditActions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={async () => {
                if (await onSave(event.id, title, code)) setEditing(false);
              }}
              style={styles.saveRoleButton}
            >
              <Text style={styles.saveRoleButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => {
                setTitle(event.title);
                setCode(event.code);
                setEditing(false);
              }}
              style={styles.cancelRoleButton}
            >
              <Text style={styles.cancelRoleButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.eventInfo}>
            <View style={styles.eventIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
              <Text style={styles.eventCode}>CODE  ·  {event.code}</Text>
              <Text style={styles.eventMeta}>
                {new Date(event.starts_at).toLocaleDateString()} ·{' '}
                {new Date(event.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.eventActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${event.title}`}
              onPress={() => setEditing(true)}
              style={styles.editEventButton}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${event.title}`}
              onPress={() => onDelete(event.id)}
              style={styles.deleteEventButton}
            >
              <Ionicons name="trash-outline" size={18} color="#B3261E" />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function AttendanceRow({
  record,
  onCorrect,
  onDelete,
  correctingRecordId,
  setCorrectingRecordId,
  correctEventId,
  setCorrectEventId,
  correctStudentId,
  setCorrectStudentId,
  correctStatus,
  setCorrectStatus,
  saveCorrection,
  styles,
  colors,
}: {
  record: AttendanceRecordAdmin;
  onCorrect: () => void;
  onDelete: (id: string) => void;
  correctingRecordId: string | null;
  setCorrectingRecordId: (id: string | null) => void;
  correctEventId: string;
  setCorrectEventId: (id: string) => void;
  correctStudentId: string;
  setCorrectStudentId: (id: string) => void;
  correctStatus: string;
  setCorrectStatus: (status: string) => void;
  saveCorrection: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const isCorrecting = correctingRecordId === record.id;
  const date = new Date(record.scannedAt);

  const statusColor = (status: string) => {
    switch (status) {
      case 'present': return '#15803D';
      case 'late': return '#B45309';
      case 'absent': return '#B3261E';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.attendanceRow}>
      <View style={styles.attendanceInfo}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
          <Text style={styles.dateDay}>{date.getDate()}</Text>
        </View>
        <View style={styles.attendanceCopy}>
          <Text style={styles.attendanceTitle} numberOfLines={2}>{record.eventTitle}</Text>
          <Text style={styles.attendanceMeta}>
            {record.studentName} · {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[styles.statusValue, { color: statusColor(record.attendanceStatus) }]}>
              {record.attendanceStatus.charAt(0).toUpperCase() + record.attendanceStatus.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.attendanceActions}>
        {isCorrecting ? (
          <View style={styles.correctRow}>
            <TextInput
              style={styles.correctInput}
              value={correctEventId}
              onChangeText={setCorrectEventId}
              placeholder="Event ID"
              placeholderTextColor={colors.textTertiary}
            />
            <TextInput
              style={styles.correctInput}
              value={correctStudentId}
              onChangeText={setCorrectStudentId}
              placeholder="Student ID"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={styles.statusSelectRow}>
              <Text style={styles.statusLabel}>Status</Text>
              {(['present', 'late', 'absent'] as const).map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: correctStatus === option }}
                  onPress={() => setCorrectStatus(option)}
                  style={[
                    styles.statusChip,
                    correctStatus === option && styles.statusChipSelected,
                  ]}
                >
                  <Text style={[styles.statusChipText, correctStatus === option && styles.statusChipTextSelected]}>
                    {option[0].toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={saveCorrection} style={styles.saveCorrectionButton}>
              <Text style={styles.saveCorrectionButtonText}>Save</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setCorrectingRecordId(null)} style={styles.cancelCorrectionButton}>
              <Text style={styles.cancelCorrectionButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable accessibilityRole="button" onPress={onCorrect} style={styles.correctButton}>
              <Text style={styles.correctButtonText}>Correct</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onDelete(record.id)} style={styles.deleteRecordButton}>
              <Ionicons name="trash-outline" size={18} color="#B3261E" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function EmptyState({ icon, title, styles, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={25} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>Nothing to show here yet.</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22, paddingBottom: 36 },
    pageHeader: { marginBottom: 22 },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
    title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 5 },
    subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
    overviewHero: { backgroundColor: colors.primary, borderRadius: 22, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
    overviewHeroCopy: { flex: 1 },
    overviewEyebrow: { color: colors.textOnPrimary, opacity: 0.78, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
    overviewTitle: { color: colors.textOnPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginBottom: 5 },
    overviewSubtitle: { color: colors.textOnPrimary, opacity: 0.86, fontSize: 13, lineHeight: 19 },
    overviewHeroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    messageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 14, gap: 8 },
    messageText: { flex: 1, fontSize: 13, color: '#1B5E20', lineHeight: 18 },
    errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDECEC', padding: 12, borderRadius: 12, marginBottom: 12 },
    error: { color: '#B3261E', fontSize: 12, flex: 1 },
    retryButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFFFFF', borderRadius: 8 },
    retryText: { color: '#B3261E', fontSize: 11, fontWeight: '700' },
    emptyCard: { alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 26, marginTop: 4 },
    emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 5 },
    emptyDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 },
    statCard: { flex: 1, minWidth: 136, minHeight: 116, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
    statIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    statCopy: { flex: 1 },
    statValue: { color: colors.textPrimary, fontSize: 23, fontWeight: '800' },
    statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 3 },
    sectionCaption: { color: colors.textSecondary, fontSize: 12, marginBottom: 12 },
    sectionSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
    listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    adminNav: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 5, marginBottom: 20 },
    adminTabs: { flexDirection: 'row', gap: 4 },
    adminTab: { flex: 1, minWidth: 0, minHeight: 62, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 13, paddingHorizontal: 3, paddingVertical: 8 },
    adminTabSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    adminTabText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', textAlign: 'center' },
    adminTabTextSelected: { color: colors.textOnPrimary },
    quickActions: { gap: 10, marginBottom: 24 },
    quickAction: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15, paddingVertical: 12 },
    quickActionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    quickActionCopy: { flex: 1, gap: 3 },
    quickActionTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    quickActionDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
    quickActionArrow: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.78 },
    userRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    userAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
    userAvatarText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
    userCopy: { flex: 1 },
    userName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    userEmail: { color: colors.textSecondary, fontSize: 11 },
    roleBadgeRow: { marginTop: 4 },
    roleBadgeText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
    userActions: { alignItems: 'flex-end', minWidth: 150 },
    changeRoleButton: { borderRadius: 10, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
    changeRoleButtonDisabled: { borderColor: colors.border, opacity: 0.5 },
    changeRoleButtonText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
    changeRoleButtonTextDisabled: { color: colors.textTertiary },
    roleEditRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
    roleChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 9, paddingVertical: 5 },
    roleChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleChipText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
    roleChipTextSelected: { color: colors.textOnPrimary },
    saveRoleButton: { borderRadius: 9, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 5 },
    saveRoleButtonText: { color: colors.textOnPrimary, fontSize: 10, fontWeight: '700' },
    cancelRoleButton: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 },
    cancelRoleButtonText: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
    eventRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eventRowEditing: { alignItems: 'stretch' },
    eventInfo: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
    eventIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    eventCopy: { flex: 1, minWidth: 0 },
    eventTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
    eventCode: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.7, marginBottom: 3 },
    eventMeta: { color: colors.textSecondary, fontSize: 10 },
    eventActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    editEventButton: { padding: 8 },
    deleteEventButton: { padding: 8 },
    eventEditContent: { flex: 1, gap: 8 },
    eventEditInput: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, borderRadius: 10, color: colors.textPrimary, paddingHorizontal: 11, paddingVertical: 9, fontSize: 13 },
    eventEditActions: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-end' },
    attendanceRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    attendanceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    dateBadge: { width: 48, height: 52, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    dateMonth: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    dateDay: { color: colors.textPrimary, fontSize: 21, fontWeight: '800', marginTop: 1 },
    attendanceCopy: { flex: 1, minWidth: 0 },
    attendanceTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    attendanceMeta: { color: colors.textSecondary, fontSize: 11 },
    attendanceActions: { alignItems: 'flex-end', minWidth: 150 },
    correctButton: { borderRadius: 9, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6 },
    correctButtonText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
    deleteRecordButton: { padding: 8 },
    correctRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
    correctInput: { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, borderRadius: 10, color: colors.textPrimary, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, minWidth: 90 },
    saveCorrectionButton: { borderRadius: 9, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6 },
    saveCorrectionButtonText: { color: colors.textOnPrimary, fontSize: 10, fontWeight: '700' },
    cancelCorrectionButton: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
    cancelCorrectionButtonText: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
    statusValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
    statusSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
    statusChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 9, paddingVertical: 5 },
    statusChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    statusChipText: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
    statusChipTextSelected: { color: colors.textOnPrimary },
  });
}
