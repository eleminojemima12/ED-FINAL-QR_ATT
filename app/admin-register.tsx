import { Link, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useTheme } from '@/components/ThemeProvider';

const promotionSql = `do $$
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
end $$;`;

export default function AdminRegisterScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.brandMark}>
          <Ionicons name="shield-checkmark-outline" size={30} color={colors.textOnPrimary} />
        </View>
        <Text style={styles.eyebrow}>ADMINISTRATOR SETUP</Text>
        <Text style={styles.title}>Set up admin access</Text>
        <Text style={styles.subtitle}>
          Administrator access is assigned securely by a trusted project owner. It cannot be granted through public registration.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create your account</Text>
              <Text style={styles.body}>
                Register as a student or teacher using the email address that should become the administrator account.
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Promote it in Supabase</Text>
              <Text style={styles.body}>
                Apply the latest supabase/schema.sql first. In Supabase Dashboard → SQL Editor, replace the example email below with your account email and run this block as the project owner. It temporarily disables the role-protection trigger and restores it in the same transaction:
              </Text>
              <Text selectable style={styles.code}>{promotionSql}</Text>
            </View>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sign in again</Text>
              <Text style={styles.body}>
                Sign out and sign back in. Your profile should show Administrator, and the Admin tab will be available.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          <Text style={styles.noticeText}>
            Only run this query in your own Supabase project as a trusted project owner. Never put a Supabase service-role key in the app.
          </Text>
        </View>

        <AppButton
          theme="primary"
          title="Create student or teacher account"
          icon="person-add-outline"
          onPress={() => router.push('/register')}
        />
        <Link href="/login" style={styles.link}>Already have an account? Sign in</Link>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.background, justifyContent: 'center' },
    content: { padding: 24, width: '100%', maxWidth: 560, alignSelf: 'center' },
    brandMark: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginBottom: 8 },
    title: { color: colors.textPrimary, fontSize: 32, fontWeight: '800', marginBottom: 8 },
    subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 22 },
    formCard: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 18, gap: 20, marginBottom: 16 },
    step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, color: colors.textOnPrimary, textAlign: 'center', textAlignVertical: 'center', fontWeight: '800', overflow: 'hidden' },
    stepContent: { flex: 1, gap: 7 },
    stepTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
    body: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
    code: { color: colors.textPrimary, backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
    notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.surfaceLight, borderRadius: 14, padding: 14, marginBottom: 18 },
    noticeText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    link: { color: colors.primary, fontWeight: '700', textAlign: 'center', marginTop: 14 },
  });
}
