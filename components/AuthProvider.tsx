import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getSession, subscribeToAuth } from '@/lib/auth';
import { ensureProfile, getProfile, syncProfileRole, type Profile, type UserRole } from '@/lib/profiles';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  role: 'student' | 'teacher' | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    try {
      const profile = await getProfile(session.user.id);
      const metadataRole = session.user.user_metadata?.role;
      if ((metadataRole === 'teacher' || metadataRole === 'student') && profile.role !== metadataRole) {
        setProfile(await syncProfileRole(session.user.id, metadataRole));
      } else {
        setProfile(profile);
      }
    } catch {
      try {
        const metadataRole = session.user.user_metadata?.role;
        const role: UserRole = metadataRole === 'teacher' ? 'teacher' : 'student';
        setProfile(await ensureProfile(
          session.user.id,
          session.user.user_metadata?.full_name ?? '',
          role
        ));
      } catch {
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    let active = true;
    getSession()
      .then((currentSession) => {
        if (active) setSession(currentSession);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data } = subscribeToAuth((nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [session]);

  const role = profile?.role ?? (
    session?.user.user_metadata?.role === 'teacher' ? 'teacher' :
    session?.user.user_metadata?.role === 'student' ? 'student' : null
  );

  return (
    <AuthContext.Provider value={{ session, profile, role, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}