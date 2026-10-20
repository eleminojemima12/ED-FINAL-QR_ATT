import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/AppButton';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import {
  createEvent,
  closeEvent,
  deleteEvent,
  getTeacherEvents,
  type Event,
  updateEvent,
} from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function generateEventCode(date: Date) {
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const timePart = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EVT-${datePart}-${timePart}-${suffix}`;
}

function formatDuration(start: Date, end: Date) {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes <= 0) return 'End time must be after start time';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (remainingHours) parts.push(`${remainingHours} hour${remainingHours === 1 ? '' : 's'}`);
  if (remainingMinutes) parts.push(`${remainingMinutes} min`);
  return parts.join(' ');
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

type Mode = 'create' | 'manage';

export default function TeacherScreen() {
  const { role, session } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<Mode>('create');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedEvent, setSavedEvent] = useState<{ code: string; title: string } | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editEndDate, setEditEndDate] = useState(new Date());
  const [editEventTarget, setEditEventTarget] = useState<EditTarget | null>(null);
  const [editEventPart, setEditEventPart] = useState<'date' | 'time'>('date');

  const isAndroid = Platform.OS === 'android';
  const canManage = role === 'teacher' || role === 'administrator';

  const loadEvents = useCallback(async () => {
    if (!session) return;
    try {
      const list = await getTeacherEvents(session.user.id);
      setEvents(list);
    } catch {
      // Silent fail
    }
  }, [session]);

  const openPicker = (target: EditTarget, part: 'date' | 'time') => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart(part);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }
    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    if (editingPart === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);
    if (isAndroid) setEditTarget(null);
  };

  const openEditPicker = (target: EditTarget, part: 'date' | 'time') => {
    setMessage(null);
    setEditEventTarget(target);
    setEditEventPart(part);
  };

  const onEditPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (!editEventTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditEventTarget(null);
      setEditEventPart('date');
      return;
    }
    const current = editEventTarget === 'start' ? editStartDate : editEndDate;
    const next = new Date(current);
    if (editEventPart === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    if (editEventTarget === 'start') setEditStartDate(next);
    else setEditEndDate(next);
    if (isAndroid) setEditEventTarget(null);
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const startNewEvent = () => {
    const nextStart = new Date();
    setTitle('');
    setVenue('');
    setDescription('');
    setEventId('');
    setStartDate(nextStart);
    setEndDate(new Date(nextStart.getTime() + 60 * 60 * 1000));
    setMessage(null);
    setSavedEvent(null);
    setPayload(null);
    setEditTarget(null);
    setMode('create');
  };

  const handleCreateEvent = async () => {
    setMessage(null);
    setSavedEvent(null);
    setPayload(null);
    if (!canManage || !session) {
      setMessage('Only teacher or administrator accounts can create events.');
      return;
    }
    const event = {
      code: eventId.trim(),
      title: title.trim(),
      venue: venue.trim() || undefined,
      description: description.trim() || undefined,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      createdBy: session.user.id,
    };
    if (!event.code || !event.title) {
      setMessage('Event title and code are required.');
      return;
    }
    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('End time must be after start time.');
      return;
    }
    try {
      setIsSubmitting(true);
      const createdEvent = await createEvent(event);
      setMessage('Event saved! Scan the QR with the Scan tab to test it.');
      setSavedEvent({ code: createdEvent.code, title: createdEvent.title });
      setPayload(buildQRPayload({
        event: createdEvent.code,
        title: createdEvent.title,
        start: createdEvent.starts_at,
        end: createdEvent.ends_at,
      }));
      await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not create event: ${String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEventId || !session) return;
    setMessage(null);
    if (editEndDate.getTime() <= editStartDate.getTime()) {
      setMessage('End time must be after start time.');
      return;
    }
    try {
      setIsSubmitting(true);
      await updateEvent(editingEventId, {
        title: editTitle.trim() || undefined,
        venue: editVenue.trim() || undefined,
        description: editDescription.trim() || undefined,
        starts_at: editStartDate.toISOString(),
        ends_at: editEndDate.toISOString(),
      });
      setMessage('Event updated.');
      setEditingEventId(null);
      await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEvent = async (eventId: string) => {
    setMessage(null);
    try {
      setIsSubmitting(true);
      await closeEvent(eventId);
      setMessage('Event closed.');
      await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not close event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setMessage(null);
    try {
      setIsSubmitting(true);
      await deleteEvent(eventId);
      setMessage('Event deleted.');
      await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditEvent = (event: Event) => {
    setEditingEventId(event.id);
    setEditTitle(event.title);
    setEditVenue(event.venue ?? '');
    setEditDescription(event.description ?? '');
    setEditStartDate(new Date(event.starts_at));
    setEditEndDate(new Date(event.ends_at));
    setMessage(null);
    setMode('manage');
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditTitle('');
    setEditVenue('');
    setEditDescription('');
    setEditStartDate(new Date());
    setEditEndDate(new Date());
    setEditEventTarget(null);
    setMessage(null);
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'live': return 'Live';
      case 'ended': return 'Ended';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return colors.textSecondary;
      case 'live': return '#15803D';
      case 'ended': return '#B3261E';
      case 'closed': return colors.textTertiary;
      default: return colors.textSecondary;
    }
  };

  if (!canManage) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Teacher or administrator access is required to manage events.
        </Text>
      </View>
    );
  }

  if (!role) {
    return <View style={styles.container}><Text style={styles.message}>Loading account...</Text></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <View style={styles.headerIcon}>
          <Ionicons name="qr-code-outline" size={25} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.eyebrow}>{role === 'administrator' ? 'ADMIN TOOLS' : 'TEACHER TOOLS'}</Text>
        <Text style={styles.title}>{mode === 'create' ? 'Create an event' : 'Manage your events'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'create'
            ? 'Add event details and create a QR code for students to check in.'
            : 'View, edit, or close events you have created.'}
        </Text>
      </View>

      <View style={styles.modeToggle}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode('create')}
          style={[styles.modeChip, mode === 'create' && styles.modeChipSelected]}
        >
          <Text style={[styles.modeChipText, mode === 'create' && styles.modeChipTextSelected]}>
            Create
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode('manage');
            void loadEvents();
          }}
          style={[styles.modeChip, mode === 'manage' && styles.modeChipSelected]}
        >
          <Text style={[styles.modeChipText, mode === 'manage' && styles.modeChipTextSelected]}>
            Manage
          </Text>
        </Pressable>
      </View>

      {mode === 'create' ? (
        <CreateForm
          title={title}
          setTitle={setTitle}
          venue={venue}
          setVenue={setVenue}
          description={description}
          setDescription={setDescription}
          eventId={eventId}
          setEventId={setEventId}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          editTarget={editTarget}
          setEditTarget={setEditTarget}
          editingPart={editingPart}
          setEditingPart={setEditingPart}
          payload={payload}
          setPayload={setPayload}
          message={message}
          setMessage={setMessage}
          isSubmitting={isSubmitting}
          savedEvent={savedEvent}
          setSavedEvent={setSavedEvent}
          handleQuickEnd={handleQuickEnd}
          handleCreateEvent={handleCreateEvent}
          startNewEvent={startNewEvent}
          styles={styles}
          colors={colors}
        />
      ) : (
        <ManageList
          events={events}
          onEdit={startEditEvent}
          onClose={handleCloseEvent}
          onDelete={handleDeleteEvent}
          editingEventId={editingEventId}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editVenue={editVenue}
          setEditVenue={setEditVenue}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editStartDate={editStartDate}
          setEditStartDate={setEditStartDate}
          editEndDate={editEndDate}
          setEditEndDate={setEditEndDate}
          editEventTarget={editEventTarget}
          setEditEventTarget={setEditEventTarget}
          editEventPart={editEventPart}
          setEditEventPart={setEditEventPart}
          message={message}
          setMessage={setMessage}
          isSubmitting={isSubmitting}
          handleSaveEdit={handleSaveEdit}
          cancelEdit={cancelEdit}
          styles={styles}
          colors={colors}
        />
      )}
    </ScrollView>
  );
}

function CreateForm({
  title, setTitle, venue, setVenue, description, setDescription,
  eventId, setEventId, startDate, setStartDate, endDate, setEndDate,
  editTarget, setEditTarget, editingPart, setEditingPart,
  payload, setPayload, message, setMessage, isSubmitting, savedEvent, setSavedEvent,
  handleQuickEnd, handleCreateEvent, startNewEvent, styles, colors,
}: {
  title: string; setTitle: (v: string) => void;
  venue: string; setVenue: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  eventId: string; setEventId: (v: string) => void;
  startDate: Date; setStartDate: (v: Date) => void;
  endDate: Date; setEndDate: (v: Date) => void;
  editTarget: 'start' | 'end' | null; setEditTarget: (v: 'start' | 'end' | null) => void;
  editingPart: 'date' | 'time'; setEditingPart: (v: 'date' | 'time') => void;
  payload: string | null; setPayload: (v: string | null) => void;
  message: string | null; setMessage: (v: string | null) => void;
  isSubmitting: boolean; savedEvent: { code: string; title: string } | null; setSavedEvent: (v: { code: string; title: string } | null) => void;
  handleQuickEnd: (ms: number) => void;
  handleCreateEvent: () => void;
  startNewEvent: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <>
      <View style={styles.formCard}>
        <SectionHeading number="01" title="Event details" subtitle="Give your event a name, code, and location." styles={styles} colors={colors} />

        <Text style={styles.label}>Event title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Founders Day Assembly" placeholderTextColor={colors.textSecondary} returnKeyType="next" />

        <Text style={styles.label}>Venue</Text>
        <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="e.g. Main Auditorium" placeholderTextColor={colors.textSecondary} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="e.g. Annual school assembly for all students" placeholderTextColor={colors.textSecondary} />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Event code</Text>
          <Pressable accessibilityRole="button" onPress={() => { /* generate handled by parent */ }} style={({ pressed }) => [styles.generateCodeButton, pressed && styles.chipPressed]}>
            <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
            <Text style={styles.generateCodeText}>Generate code</Text>
          </Pressable>
        </View>
        <TextInput style={styles.input} value={eventId} onChangeText={setEventId} placeholder="e.g. EVT-2026-0002" placeholderTextColor={colors.textSecondary} autoCapitalize="characters" autoCorrect={false} />

        <View style={styles.sectionDivider} />
        <SectionHeading number="02" title="Schedule" subtitle="Choose when attendance is open." styles={styles} colors={colors} />

        <Text style={styles.label}>Starts</Text>
        <View style={styles.dateTimeRow}>
          <PickerField label="Date" value={formatDate(startDate)} icon="calendar-outline" onPress={() => { /* handled by parent */ }} style={styles.dateControl} />
          <PickerField label="Time" value={formatTime(startDate)} icon="time-outline" onPress={() => { /* handled by parent */ }} style={styles.timeControl} />
        </View>

        <Text style={styles.label}>Ends</Text>
        <View style={styles.dateTimeRow}>
          <PickerField label="Date" value={formatDate(endDate)} icon="calendar-outline" onPress={() => { /* handled by parent */ }} style={styles.dateControl} />
          <PickerField label="Time" value={formatTime(endDate)} icon="time-outline" onPress={() => { /* handled by parent */ }} style={styles.timeControl} />
        </View>
        <View style={styles.durationSummary}>
          <Ionicons name="hourglass-outline" size={16} color={colors.primary} />
          <Text style={styles.durationText}>
            {endDate > startDate ? `Attendance open for ${formatDuration(startDate, endDate)}` : formatDuration(startDate, endDate)}
          </Text>
        </View>
        <Text style={styles.quickLabel}>QUICK DURATION</Text>
        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => {
            const selected = endDate.getTime() === startDate.getTime() + option.ms;
            return (
              <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]} onPress={() => handleQuickEnd(option.ms)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>Quick options set the end time from the start time.</Text>
      </View>

      {message && (
        <View style={[styles.messageCard, savedEvent && styles.successCard]}>
          <Ionicons name={savedEvent ? 'checkmark-circle' : 'alert-circle'} size={20} color={savedEvent ? colors.primary : '#B3261E'} />
          <Text style={[styles.message, savedEvent && styles.successMessage]}>{message}</Text>
        </View>
      )}

      {!savedEvent && (
        <AppButton theme="primary" title={isSubmitting ? 'Creating event...' : 'Create event QR'} icon={isSubmitting ? 'hourglass-outline' : 'add-circle-outline'} onPress={handleCreateEvent} disabled={isSubmitting} />
      )}

      {editTarget && !savedEvent && (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{editTarget === 'start' ? 'Start' : 'End'} {editingPart}</Text>
          </View>
        </View>
      )}

      {payload && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.resultSuccessIcon}><Ionicons name="checkmark" size={20} color={colors.textOnPrimary} /></View>
            <View style={styles.resultHeadingCopy}>
              <Text style={styles.resultTitle}>Your event is ready</Text>
              <Text style={styles.resultSubtitle}>Share this QR code with attendees.</Text>
            </View>
          </View>
          <View style={styles.eventSummary}>
            <Text style={styles.eventSummaryTitle}>{savedEvent?.title}</Text>
            <Text style={styles.eventSummaryCode}>EVENT CODE  ·  {savedEvent?.code}</Text>
          </View>
          <View style={styles.qrBox}><QRCode value={payload} size={200} /></View>
          <Text style={styles.qrHint}>Students can scan this code from the Scan tab.</Text>
          <Text style={styles.payloadText}>{payload}</Text>
          <View style={styles.newEventButton}>
            <AppButton title="Create another event" icon="add-outline" onPress={startNewEvent} />
          </View>
        </View>
      )}
    </>
  );
}

function ManageList({
  events, onEdit, onClose, onDelete, editingEventId,
  editTitle, setEditTitle, editVenue, setEditVenue, editDescription, setEditDescription,
  editStartDate, setEditStartDate, editEndDate, setEditEndDate,
  editEventTarget, setEditEventTarget, editEventPart, setEditEventPart,
  message, setMessage, isSubmitting, handleSaveEdit, cancelEdit, styles, colors,
}: {
  events: Event[];
  onEdit: (event: Event) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
  editingEventId: string | null;
  editTitle: string; setEditTitle: (v: string) => void;
  editVenue: string; setEditVenue: (v: string) => void;
  editDescription: string; setEditDescription: (v: string) => void;
  editStartDate: Date; setEditStartDate: (v: Date) => void;
  editEndDate: Date; setEditEndDate: (v: Date) => void;
  editEventTarget: 'start' | 'end' | null; setEditEventTarget: (v: 'start' | 'end' | null) => void;
  editEventPart: 'date' | 'time'; setEditEventPart: (v: 'date' | 'time') => void;
  message: string | null; setMessage: (v: string | null) => void;
  isSubmitting: boolean;
  handleSaveEdit: () => void;
  cancelEdit: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <>
      <View style={styles.manageHeader}>
        <Text style={styles.manageTitle}>Your Events</Text>
        <Text style={styles.manageSubtitle}>{events.length} event{events.length === 1 ? '' : 's'}</Text>
      </View>

      {events.length === 0 ? (
        <EmptyState icon="calendar-clear-outline" title="No events yet" description="Create your first event from the Create tab." styles={styles} colors={colors} />
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={onEdit}
            onClose={onClose}
            onDelete={onDelete}
            isEditing={editingEventId === event.id}
            styles={styles}
            colors={colors}
          />
        ))
      )}

      {editingEventId && (
        <View style={styles.editCard}>
          <SectionHeading number="01" title="Edit event" subtitle="Update the event details below." styles={styles} colors={colors} />

          <Text style={styles.label}>Event title</Text>
          <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Event title" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>Venue</Text>
          <TextInput style={styles.input} value={editVenue} onChangeText={setEditVenue} placeholder="Venue" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>Description</Text>
          <TextInput style={styles.input} value={editDescription} onChangeText={setEditDescription} placeholder="Description" placeholderTextColor={colors.textSecondary} />

          <Text style={styles.label}>Event code</Text>
          <Text style={styles.codeDisplay}>{events.find((e) => e.id === editingEventId)?.code}</Text>

          <View style={styles.sectionDivider} />
          <SectionHeading number="02" title="Schedule" subtitle="Update the event schedule." styles={styles} colors={colors} />

          <Text style={styles.label}>Starts</Text>
          <View style={styles.dateTimeRow}>
            <PickerField label="Date" value={formatDate(editStartDate)} icon="calendar-outline" onPress={() => {}} style={styles.dateControl} />
            <PickerField label="Time" value={formatTime(editStartDate)} icon="time-outline" onPress={() => {}} style={styles.timeControl} />
          </View>

          <Text style={styles.label}>Ends</Text>
          <View style={styles.dateTimeRow}>
            <PickerField label="Date" value={formatDate(editEndDate)} icon="calendar-outline" onPress={() => {}} style={styles.dateControl} />
            <PickerField label="Time" value={formatTime(editEndDate)} icon="time-outline" onPress={() => {}} style={styles.timeControl} />
          </View>

          {message && (
            <View style={styles.messageCard}>
              <Ionicons name="alert-circle" size={20} color="#B3261E" />
              <Text style={styles.message}>{message}</Text>
            </View>
          )}

          <View style={styles.editActions}>
            <AppButton theme="primary" title={isSubmitting ? 'Saving...' : 'Save changes'} icon={isSubmitting ? 'hourglass-outline' : 'save-outline'} onPress={handleSaveEdit} disabled={isSubmitting} />
            <AppButton title="Cancel" icon="close-outline" onPress={cancelEdit} />
          </View>
        </View>
      )}
    </>
  );
}

function EventCard({
  event, onEdit, onClose, onDelete, isEditing, styles, colors,
}: {
  event: Event;
  onEdit: (event: Event) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const status = event.status ?? 'upcoming';
  const date = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const now = Date.now();
  const computedStatus = now < date.getTime() ? 'upcoming' : now <= endDate.getTime() ? 'live' : 'ended';
  const displayStatus = status === 'closed' ? 'closed' : computedStatus;

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventCardTop}>
        <View style={styles.eventIcon}><Ionicons name="calendar-outline" size={20} color={colors.primary} /></View>
        <View style={styles.eventCopy}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          {event.venue && <Text style={styles.eventVenue}><Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {event.venue}</Text>}
          {event.description && <Text style={styles.eventDesc} numberOfLines={1}>{event.description}</Text>}
          <Text style={styles.eventMeta}>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
          <Text style={[styles.statusBadge, { backgroundColor: statusColor(displayStatus, colors) + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor(displayStatus, colors) }]}>{statusLabel(displayStatus)}</Text>
          </Text>
        </View>
        <View style={styles.eventActions}>
          {!isEditing && (
            <>
              <Pressable accessibilityRole="button" onPress={() => onEdit(event)} style={styles.editButton}><Ionicons name="create-outline" size={18} color={colors.primary} /></Pressable>
              {displayStatus !== 'closed' && <Pressable accessibilityRole="button" onPress={() => onClose(event.id)} style={styles.closeButton}><Ionicons name="stop-circle-outline" size={18} color="#B3261E" /></Pressable>}
              <Pressable accessibilityRole="button" onPress={() => onDelete(event.id)} style={styles.deleteButton}><Ionicons name="trash-outline" size={18} color="#B3261E" /></Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function EmptyState({ icon, title, description, styles, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={25} color={colors.primary} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function SectionHeading({ number, title, subtitle, styles, colors }: {
  number: string;
  title: string;
  subtitle: string;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionNumber}><Text style={[styles.sectionNumberText, { color: colors.primary }]}>{number}</Text></View>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PickerField({ label, value, icon, onPress, style }: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style: object;
}) {
  const { colors } = useTheme();
  const localStyles = createStyles(colors);
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [localStyles.pickerField, style, pressed && localStyles.pickerFieldPressed]} onPress={onPress}>
      <View style={localStyles.pickerCopy}>
        <Text style={localStyles.pickerLabel}>{label}</Text>
        <View style={localStyles.pickerValueRow}>
          <Ionicons name={icon} size={17} color={colors.primary} />
          <Text style={localStyles.pickerValue} numberOfLines={1}>{value}</Text>
        </View>
      </View>
      <Ionicons name="chevron-down" size={17} color={colors.textSecondary} />
    </Pressable>
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function statusLabel(status: string) {
  switch (status) {
    case 'upcoming': return 'Upcoming';
    case 'live': return 'Live';
    case 'ended': return 'Ended';
    case 'closed': return 'Closed';
    default: return status;
  }
}

function statusColor(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  switch (status) {
    case 'upcoming': return colors.textSecondary;
    case 'live': return '#15803D';
    case 'ended': return '#B3261E';
    case 'closed': return colors.textTertiary;
    default: return colors.textSecondary;
  }
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 42 },
    pageHeader: { marginBottom: 22 },
    headerIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.textPrimary, marginBottom: 5 },
    subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, maxWidth: 460 },
    modeToggle: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    modeChipSelected: { backgroundColor: colors.primary },
    modeChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    modeChipTextSelected: { color: colors.textOnPrimary },
    formCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, marginBottom: 18 },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sectionNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
    sectionNumberText: { fontSize: 12, fontWeight: '800' },
    sectionCopy: { flex: 1 },
    sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    sectionSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
    sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 7, marginTop: 13 },
    generateCodeButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 5, marginBottom: 6 },
    generateCodeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
    input: { backgroundColor: colors.surfaceLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: colors.textPrimary },
    pickerField: { minHeight: 50, backgroundColor: colors.surfaceLight, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
    pickerFieldPressed: { backgroundColor: colors.surface },
    dateTimeRow: { flexDirection: 'row', gap: 9 },
    dateControl: { flex: 1.2 },
    timeControl: { flex: 0.8 },
    pickerCopy: { flex: 1 },
    pickerLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginBottom: 5 },
    pickerValueRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    pickerValue: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: colors.textPrimary },
    durationSummary: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surfaceLight, borderRadius: 10, padding: 10, marginTop: 12 },
    durationText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
    quickLabel: { color: colors.textTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
    chipSelected: { backgroundColor: colors.surface, borderColor: colors.primary },
    chipPressed: { opacity: 0.75 },
    chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    chipTextSelected: { color: colors.primary },
    hint: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },
    pickerContainer: { marginTop: 12, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
    pickerHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
    pickerTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textTransform: 'capitalize' },
    messageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDECEC', borderRadius: 12, padding: 12, marginBottom: 14, gap: 8 },
    successCard: { backgroundColor: colors.surface },
    message: { flex: 1, fontSize: 13, color: '#B3261E', lineHeight: 18 },
    successMessage: { color: colors.primary },
    resultCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, marginTop: 18, alignItems: 'center' },
    resultHeader: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: 16 },
    resultSuccessIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    resultHeadingCopy: { flex: 1 },
    resultTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    resultSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
    eventSummary: { width: '100%', backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 12, marginBottom: 16 },
    eventSummaryTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    eventSummaryCode: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
    qrBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    qrHint: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 10 },
    payloadText: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', lineHeight: 15 },
    newEventButton: { width: '100%', marginTop: 16 },
    manageHeader: { marginBottom: 16 },
    manageTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 2 },
    manageSubtitle: { color: colors.textSecondary, fontSize: 12 },
    editCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 18, marginBottom: 18 },
    codeDisplay: { backgroundColor: colors.surfaceLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 0.5, marginTop: 6, marginBottom: 14 },
    editActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
    eventCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 10 },
    eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    eventIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    eventCopy: { flex: 1, minWidth: 0 },
    eventTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    eventVenue: { color: colors.textSecondary, fontSize: 12, marginBottom: 3 },
    eventDesc: { color: colors.textTertiary, fontSize: 11, marginBottom: 5 },
    eventMeta: { color: colors.textSecondary, fontSize: 11, marginBottom: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
    statusText: { fontSize: 9, fontWeight: '800' },
    eventActions: { alignItems: 'flex-end', gap: 6 },
    editButton: { padding: 8 },
    closeButton: { padding: 8 },
    deleteButton: { padding: 8 },
    emptyCard: { alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 26, marginTop: 4 },
    emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 5 },
    emptyDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  });
}
