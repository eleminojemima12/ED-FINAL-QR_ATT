# Phase 12 — Administrator Role

> This is a **student lab activity**. Until now the app had two roles: **Student** and **Teacher**. This phase adds a third role — **Administrator** — with full system oversight: manage users, manage events, view overall attendance, correct attendance records, and view system reports.

---

## HOW TO USE THIS DOCUMENT (Read Me First)

In this phase you will:
1. **LEARN** — what the Administrator role can do
2. **CODE** — database enum + RLS policies, TypeScript role type, auth handling, admin dashboard screen
3. **VERIFY** — typecheck + test as an Administrator

**Time needed:** ~30 minutes  
**You will need:** Phases 2-6 completed (Supabase auth, profiles, roles, events, attendance) and `supabase/schema.sql` applied to your project.

---

## USER MANAGEMENT — REQUIREMENTS COVERAGE

| Requirement | Implementation | Where |
|---|---|---|
| **Student profile** | Every student account has a `profiles` row with `role = 'student'`. The Profile tab shows name, email, account ID, role badge, and student-specific capabilities (scan QR codes, view own history, edit name). | `app/(tabs)/profile.tsx`, `lib/profiles.ts`, `supabase/schema.sql` |
| **Teacher profile** | Every teacher account has a `profiles` row with `role = 'teacher'`. The Profile tab shows name, email, account ID, role badge, and teacher-specific capabilities (create events, view own event attendance). | `app/(tabs)/profile.tsx`, `lib/profiles.ts`, `supabase/schema.sql` |
| **Administrator profile** | Administrator access is assigned by an existing administrator or directly in Supabase. Public registration cannot grant administrator access. The Profile tab shows the role badge and administrator capabilities. | `app/(tabs)/profile.tsx`, `app/(tabs)/admin.tsx`, `lib/profiles.ts`, `supabase/schema.sql` |
| **Role-based access** | Row Level Security (RLS) policies on `profiles`, `events`, and `attendance` tables enforce what each role can read/write at the database level. UI screens also check `role` before rendering role-specific actions. | `supabase/schema.sql`, `app/(tabs)/admin.tsx`, `app/teacher.tsx`, `app/(tabs)/scan.tsx`, `app/(tabs)/history.tsx` |

---

## 1. WHAT ARE WE DOING AND WHY?

### The Problem

The app distinguishes **Students** (scan QR codes, view their own history) and **Teachers** (create events, view attendance for their own events). There is no account that can:

- View or change **any** user's role
- Create, edit, or delete **any** event (not just their own)
- View **all** attendance across the system
- Correct or delete attendance records
- See system-wide statistics

### The Goal

Add an **Administrator** role that can:

| Capability | How it's delivered |
|---|---|
| **Manage users** | Admin dashboard → Users tab: view every account, change any user's role (Student / Teacher / Administrator) |
| **Manage events** | Admin dashboard → Events tab: view every event, delete any event. Administrators can also create events from the Teacher tab |
| **View overall attendance** | Admin dashboard → Overview + Attendance tabs; History tab shows all system events with attendee counts |
| **Manage or correct attendance records** | Admin dashboard → Attendance tab: correct a record's event/student/status, or delete it |
| **View system records/reports** | Admin dashboard → Overview: total events, check-ins, students, teachers, administrators |

### The Analogy: The School Office

- A **Student** is like a pupil with their own notebook (their scans).
- A **Teacher** is like a lecturer with their own register (their events).
- An **Administrator** is like the school office: they can see every pupil's record, every lecturer's class list, and reassign who teaches what.

---

## ATTENDANCE RECORDS — REQUIREMENTS COVERAGE

| Requirement | Implementation | Where |
|---|---|---|
| **Student** | Each attendance record links to a student via `student_id → profiles.id`. The student's name and ID are displayed on every record. | `supabase/schema.sql` (`attendance.student_id`), `lib/attendance.ts`, `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx` |
| **Event** | Each attendance record links to an event via `event_id → events.id`. The event title and code are displayed on every record. | `supabase/schema.sql` (`attendance.event_id`), `lib/attendance.ts`, `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx` |
| **Date** | `scanned_at` timestamp stores when the attendance was recorded. Displayed as a date badge on every record card. | `supabase/schema.sql` (`attendance.scanned_at`), `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx` |
| **Time** | `scanned_at` timestamp stores the exact time. Displayed alongside the date on every record card. | `supabase/schema.sql` (`attendance.scanned_at`), `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx` |
| **Attendance status** | `attendance_status` column stores one of: `present` (default when scanning), `late`, or `absent`. Administrators can correct the status via the Admin → Attendance tab. Students see their status on their History tab. | `supabase/schema.sql` (`attendance.attendance_status`), `lib/attendance.ts`, `app/(tabs)/admin.tsx`, `app/(tabs)/history.tsx` |

### Attendance Status Values

| Status | When assigned | Color |
|---|---|---|
| **Present** | Default when a student scans a valid QR code during the event window | Green |
| **Late** | Set by an administrator when correcting a record | Orange |
| **Absent** | Set by an administrator when correcting a record | Red |

---


- A **Student** is like a pupil with their own notebook (their scans).
- A **Teacher** is like a lecturer with their own register (their events).
- An **Administrator** is like the school office: they can see every pupil's record, every lecturer's class list, and reassign who teaches what.

---

## 2. THE PLAN — CODE CHANGES

| # | File | Action | What changes |
|---|---|---|---|
| 1 | `supabase/schema.sql` | Modified | `administrator` added to `user_role` enum; RLS policies for admins on `profiles`, `events`, `attendance` |
| 2 | `lib/profiles.ts` | Modified | `UserRole` includes `'administrator'`; new `getAllProfiles()` and `updateProfileRole()` |
| 3 | `lib/auth.ts` | Modified | Public sign-up is limited to Student / Teacher; administrator access is assigned separately |
| 4 | `components/AuthProvider.tsx` | Modified | Context role type + metadata handling includes `'administrator'` |
| 5 | `lib/events.ts` | Modified | New `getAllEvents()`, `updateEvent()`, `deleteEvent()` |
| 6 | `lib/attendance.ts` | Modified | New admin types + `getAllAttendance()`, `updateAttendanceRecord()`, `deleteAttendanceRecord()`, `getAllEventSummaries()`, `getAttendanceStats()` |
| 7 | `app/register.tsx` | Modified | Public signup role picker offers **Student** and **Teacher** only |
| 8 | `app/(tabs)/_layout.tsx` | Modified | **Admin** tab shown when role is `administrator` |
| 9 | `app/(tabs)/admin.tsx` | **Created** | Administrator dashboard (Overview / Users / Events / Attendance) |
| 10 | `app/(tabs)/history.tsx` | Modified | Administrator sees overall attendance (all events + counts) |
| 11 | `app/teacher.tsx` | Modified | Administrators can create events from the Teacher tab |
| 12 | `app/(tabs)/profile.tsx` | Modified | Profile badge shows **Administrator** |
| 13 | `app/(tabs)/index.tsx` | Modified | Home quick action shows **Admin panel** for administrators |

---

## 3. DATABASE — `supabase/schema.sql`

### 3a. Add `administrator` to the role enum

```sql
create type public.user_role as enum ('student', 'teacher', 'administrator');
```

> If the type already exists in your project, the `do $$ ... exception when duplicate_object then null $$;` block makes this safe to re-run. Existing rows keep their current role.

### 3b. Administrator RLS policies

New policies (added after the student/teacher policies). Each guards on `role = 'administrator'`:

- **profiles:** administrators can `select` all profiles and `update` any profile's role
- **events:** administrators can `insert`, `update`, `delete` any event
- **attendance:** administrators can `select`, `insert`, `update`, `delete` any attendance record

Apply the updated schema in **Supabase Dashboard → SQL Editor**, then click **Run**.

---

## 4. ADMIN DASHBOARD — `app/(tabs)/admin.tsx`

A new tab (`Admin`) appears only for users whose profile role is `administrator`. It has four sections:

### Overview
System statistics: total events, total check-ins, students, teachers, and administrators. Plus quick-action cards to jump to Users, Events, or Attendance.

### Users
Lists every account with their current role badge. Tap **Change role** to pick a new role (Student / Teacher / Administrator) and **Save**. You cannot change your own role (prevents accidental lockout).

### Events
Lists every event in the system (code, title, date/time). Tap the trash icon to delete an event (its attendance records are removed too).

### Attendance
Lists every attendance record (event, student, time). Tap **Correct** to fix the linked event or student ID, or **Delete** to remove the record.

---

## 5. WHERE ELSE THE ADMINISTRATOR APPEARS

| Screen | Administrator behaviour |
|---|---|
| **Register** | Public signup cannot grant the Administrator role |
| **Home (tabs index)** | Quick action shows **Admin panel** → opens the Admin tab |
| **Teacher tab** | Administrators can create events (same as teachers) |
| **History tab** | Administrators see **Overall attendance** — all system events with attendee counts and upcoming/live/ended filters |
| **Profile tab** | Badge shows **Administrator** |
| **Scan tab** | Unchanged — only students record attendance (administrators correct records via the Admin dashboard instead) |

---

## 6. STEP-BY-STEP EXECUTION GUIDE

### Step 1 — Update the database
Open **Supabase Dashboard → SQL Editor**, paste the full contents of `supabase/schema.sql`, and click **Run**.

### Step 2 — Type check
```bash
npx tsc --noEmit
```
**Expected:** no errors.

### Step 3 — Start the app
```bash
npx expo start
```

### Step 4 — Assign the first Administrator
Public signup must not grant administrator privileges. Create a trusted account as a student or teacher, then promote it from **Supabase Dashboard → SQL Editor** while signed in as the project owner. The role-protection trigger rejects ordinary profile role updates, so use this one-time bootstrap block. Replace the example email with the exact email of the account you created:

```sql
do $$
declare
  target_email text := 'your-email@example.com';
  updated_count integer;
begin
  execute 'alter table public.profiles disable trigger protect_profile_role';

  update public.profiles as profile
  set role = 'administrator', updated_at = now()
  from auth.users as account
  where profile.id = account.id
    and lower(account.email) = lower(target_email);

  get diagnostics updated_count = row_count;
  if updated_count <> 1 then
    raise exception 'Expected to promote exactly one account; updated % rows.', updated_count;
  end if;

  execute 'alter table public.profiles enable trigger protect_profile_role';
end $$;
```

This owner-only block temporarily disables the role-protection trigger and restores it before the transaction completes. If it raises an error, the transaction rolls back. Do not run it from the app or expose a service-role key. Sign out and back in after promotion. The Profile tab should show **Administrator**, and the **Admin** tab should be available. Additional administrators can be assigned from Admin → Users.

### Step 5 — Verify in Supabase
1. Open **Supabase Dashboard → Table Editor → `profiles`**.
2. Your new row has `role = 'administrator'`.

### Step 6 — Test admin powers
1. Register a second account as a **Student**.
2. Log in as the **Administrator**.
3. Open the **Admin → Users** tab → you see the student account; tap **Change role** → **Teacher** → **Save**.
4. Open **Admin → Events** → you see every event; tap trash to delete one.
5. Open **Admin → Attendance** → you see every record; tap **Correct** to change a student/event, or **Delete** to remove it.

### Step 7 — Tick off the checklist

| # | Task | Done? |
|---|---|---|
| 1 | `npx tsc --noEmit` passes | ☐ |
| 2 | `user_role` enum includes `administrator` | ☐ |
| 3 | Admin RLS policies exist for profiles/events/attendance | ☐ |
| 4 | Public register screen offers Student / Teacher only | ☐ |
| 5 | Admin tab appears only for administrators | ☐ |
| 6 | Admin → Users shows all accounts and can change roles | ☐ |
| 7 | Admin → Events shows all events and can delete | ☐ |
| 8 | Admin → Attendance shows all records and can correct/delete | ☐ |
| 9 | Admin → Overview shows system statistics | ☐ |
| 10 | History tab shows overall attendance for administrators | ☐ |
| 11 | Administrator can create events from the Teacher tab | ☐ |
| 12 | Profile badge shows Administrator | ☐ |

---

## 7. SECURITY NOTES

- **Row Level Security** enforces every administrator action on the server, not just in the UI. A non-administrator cannot read/modify another user's profile, event, or attendance record via the Supabase API.
- An administrator **cannot change their own role** from the dashboard, preventing accidental self-lockout. Change another administrator's role using a different administrator account.
- Assign the administrator role only to trusted accounts. Public registration and user-controlled auth metadata cannot grant administrator access.

---

## 8. CHECK YOUR UNDERSTANDING (Quiz)

1. Which database type must include `'administrator'` before the app can assign that role?
2. Which RLS policy lets an administrator view every attendance record?
3. Why can't an administrator change their own role from the dashboard?
4. Where does an administrator correct an attendance record?
5. What statistics appear on the Admin Overview screen?

*(Answers at the bottom — try them first!)*

---

### Answers

1. The `public.user_role` enum in `supabase/schema.sql`.
2. "Administrators can view all attendance" — the policy calls `public.current_user_has_role('administrator')` on `public.attendance`.
3. To prevent an administrator from accidentally revoking their own system access and locking everyone out.
4. Admin dashboard → Attendance tab → tap **Correct** on a record.
5. Total events, total check-ins, students, teachers, administrators.

---

*This phase adds the Administrator role to the QR Attendance app.*
