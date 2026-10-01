import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = { title: string };

export default function Header({ title }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoLockup}>
        <View style={styles.logoCircle}>
          <Ionicons name="qr-code" size={48} color={COLORS.textOnPrimary} />
        </View>
        <View style={styles.logoTag}>
          <Text style={styles.logoTagText}>QR</Text>
          <Text style={styles.logoTagText}>CODE</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoLockup: {
    width: 170,
    height: 88,
    position: 'relative',
    marginBottom: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  logoTag: {
    width: 116,
    height: 58,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 14,
    position: 'absolute',
    right: 0,
    top: 15,
  },
  logoTagText: {
    color: COLORS.textOnPrimary,
    fontSize: 17,
    lineHeight: 19,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
