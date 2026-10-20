import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/ThemeProvider';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  onPress: () => void;
  disabled?: boolean;
};

export default function AppButton({ title, icon, theme, onPress, disabled = false }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (theme === 'primary') {
    return (
      <View
        style={[
          styles.buttonOuter,
          { borderWidth: 3, borderColor: colors.primary, borderRadius: 18 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.buttonInner,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
          onPress={onPress}
          disabled={disabled}
        >
          <Ionicons
            name={icon}
            size={22}
            color={colors.textOnPrimary}
            style={styles.icon}
          />
          <Text style={[styles.label, { color: colors.textOnPrimary }]}>
            {title}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.buttonOuter}>
      <Pressable
        style={({ pressed }) => [
          styles.buttonInner,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Ionicons
          name={icon}
          size={22}
          color={colors.textSecondary}
          style={styles.icon}
        />
        <Text style={styles.label}>{title}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    buttonOuter: {
      width: '100%',
      marginBottom: 14,
    },
    buttonInner: {
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    icon: { paddingRight: 10 },
    label: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
    pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
    disabled: { opacity: 0.55 },
  });
}
