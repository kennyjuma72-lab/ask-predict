import React from 'react';
import { StyleSheet, ActivityIndicator, View, Pressable, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../utils/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
}

const variantStyles: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: '#ffffff' },
  secondary: { bg: colors.secondary, fg: '#ffffff' },
  danger: { bg: colors.danger, fg: '#ffffff' },
  success: { bg: colors.success, fg: '#ffffff' },
  ghost: { bg: 'transparent', fg: colors.primary },
  outline: { bg: 'transparent', fg: colors.text, border: colors.border },
};

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  small: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 },
  medium: { paddingVertical: 12, paddingHorizontal: 18, fontSize: 14 },
  large: { paddingVertical: 15, paddingHorizontal: 22, fontSize: 16 },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth,
  style,
}) => {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1 : 0,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={v.fg} style={{ marginRight: icon || label ? 8 : 0 }} />
        ) : icon ? (
          <View style={{ marginRight: 8 }}>{icon}</View>
        ) : null}
        <Text
          style={[
            typography.bodyStrong,
            { color: v.fg, fontSize: s.fontSize, textAlign: 'center' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
