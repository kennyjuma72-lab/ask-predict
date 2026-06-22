import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton, ActivityIndicator } from 'react-native-paper';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

const getBackgroundColor = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return '#6B5B9A';
    case 'secondary':
      return '#C9507B';
    case 'danger':
      return '#F44336';
    case 'success':
      return '#4CAF50';
    case 'ghost':
      return 'transparent';
    default:
      return '#6B5B9A';
  }
};

const getTextColor = (variant: ButtonVariant) => {
  return variant === 'ghost' ? '#6B5B9A' : '#FFFFFF';
};

const getPadding = (size: ButtonSize) => {
  switch (size) {
    case 'small':
      return { paddingVertical: 6, paddingHorizontal: 12 };
    case 'large':
      return { paddingVertical: 14, paddingHorizontal: 24 };
    case 'medium':
    default:
      return { paddingVertical: 10, paddingHorizontal: 16 };
  }
};

const getFontSize = (size: ButtonSize) => {
  switch (size) {
    case 'small':
      return 12;
    case 'large':
      return 16;
    case 'medium':
    default:
      return 14;
  }
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const backgroundColor = getBackgroundColor(variant);
  const textColor = getTextColor(variant);
  const padding = getPadding(size);
  const fontSize = getFontSize(size);

  return (
    <PaperButton
      onPress={onPress}
      disabled={disabled || loading}
      mode={variant === 'ghost' ? 'text' : 'contained'}
      style={[
        styles.button,
        {
          backgroundColor: variant === 'ghost' ? 'transparent' : backgroundColor,
          ...padding,
        },
        style,
      ]}
      labelStyle={{
        color: textColor,
        fontSize,
        fontWeight: '600',
      }}
      icon={loading ? () => <ActivityIndicator size={size === 'small' ? 14 : 18} color={textColor} /> : icon}
    >
      {label}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    minWidth: 100,
  },
});
