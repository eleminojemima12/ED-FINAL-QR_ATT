import { View, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    button: { fontSize: 20, textDecorationLine: 'underline', color: colors.primary },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <Link href="/" style={styles.button}>
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}
