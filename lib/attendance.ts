import { supabase } from '@/lib/supabase';
import { getEventByCode } from '@/lib/events';
import { parseQRPayload } from '@/lib/qr';

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
  attendanceStatus: string;
};

export async function registerAttendance(rawPayload: string, studentId: string): Promise<RegisterResult> {
  let payload;
  try {
    payload = parseQRPayload(rawPayload);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Invalid QR code.' };
  }

  const event = await getEventByCode(payload.event);
  if (!event) return { success: false, message: 'Event not found.' };

  const now = Date.now();
  if (now < new Date(event.starts_at).getTime()) {
    return { success: false, message: 'Event has not started yet.', eventTitle: event.title };
  }
  if (now > new Date(event.ends_at).getTime()) {
    return { success: false, message: 'Event has already ended.', eventTitle: event.title };
  }

  const { error } = await supabase.from('attendance').insert({
    event_id: event.id,
    student_id: studentId,
    attendance_status: 'present',
  });
  if (error?.code === '23505') {
    return { success: false, message: 'Already registered for this event.', eventTitle: event.title };
  }
  if (error) return { success: false, message: error.message, eventTitle: event.title };
  return { success: true, message: 'Attendance recorded!', eventTitle: event.title };
}

export async function getAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, attendance_status, events!inner(id, title)')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    eventId: row.events.id,
    eventTitle: row.events.title,
    scannedAt: row.scanned_at,
    attendanceStatus: row.attendance_status,
  }));
}

export async function getEventAttendance(eventId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, attendance_status, profiles!inner(id, full_name)')
    .eq('event_id', eventId)
    .order('scanned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    studentId: row.profiles.id,
    studentName: row.profiles.full_name,
    scannedAt: row.scanned_at,
    attendanceStatus: row.attendance_status,
  }));
}

export type AttendanceRecordAdmin = {
  id: string;
  eventId: string;
  eventTitle: string;
  studentId: string;
  studentName: string;
  scannedAt: string;
  attendanceStatus: string;
};

export type AttendanceStats = {
  totalEvents: number;
  totalAttendance: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdministrators: number;
};

export async function getAllAttendance(): Promise<AttendanceRecordAdmin[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, attendance_status, event_id, student_id, events!inner(id, title), profiles!inner(id, full_name)')
    .order('scanned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    eventId: row.events.id,
    eventTitle: row.events.title,
    studentId: row.profiles.id,
    studentName: row.profiles.full_name,
    scannedAt: row.scanned_at,
    attendanceStatus: row.attendance_status,
  }));
}

export async function updateAttendanceRecord(id: string, updates: { event_id?: string; student_id?: string; attendance_status?: string }): Promise<void> {
  const { error } = await supabase
    .from('attendance')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAttendanceRecord(id: string): Promise<void> {
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) throw error;
}

export type AllEventSummary = {
  id: string;
  code: string;
  title: string;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  attendeeCount: number;
};

export async function getAllEventSummaries(): Promise<AllEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, code, title, starts_at, ends_at, created_by')
    .order('starts_at', { ascending: false });
  if (eventError) throw eventError;
  if (!events || events.length === 0) return [];

  const eventIds = events.map((e: any) => e.id);
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);
  if (attError) throw attError;

  const counts: Record<string, number> = {};
  (attendance ?? []).forEach((row: any) => {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  });

  return events.map((e: any) => ({
    id: e.id,
    code: e.code,
    title: e.title,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    createdBy: e.created_by,
    attendeeCount: counts[e.id] ?? 0,
  }));
}

export async function getAttendanceStats(): Promise<AttendanceStats> {
  const results = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('attendance').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'administrator'),
  ]);
  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  const [
    { count: eventsCount },
    { count: attendanceCount },
    { count: studentsCount },
    { count: teachersCount },
    { count: adminsCount },
  ] = results;
  return {
    totalEvents: eventsCount ?? 0,
    totalAttendance: attendanceCount ?? 0,
    totalStudents: studentsCount ?? 0,
    totalTeachers: teachersCount ?? 0,
    totalAdministrators: adminsCount ?? 0,
  };
}

export type TeacherEventSummary = {
  id: string;
  code: string;
  title: string;
  startsAt: string;
  endsAt: string;
  attendeeCount: number;
};

export async function getTeacherEventSummaries(teacherId: string): Promise<TeacherEventSummary[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, code, title, starts_at, ends_at, attendance(count)')
    .eq('created_by', teacherId)
    .order('starts_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    attendeeCount: row.attendance?.[0]?.count ?? 0,
  }));
}