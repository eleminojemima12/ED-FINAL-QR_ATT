import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const { theme, loading: themeLoading } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || themeLoading) return;
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const isAdminSetupRoute = pathname === '/admin-register';
    if (!session && !isAuthRoute && !isAdminSetupRoute) router.replace('/login');
    if (session && isAuthRoute) router.replace('/(tabs)');
  }, [loading, pathname, router, session, themeLoading]);

  if (themeLoading) return null;

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="admin-register" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
