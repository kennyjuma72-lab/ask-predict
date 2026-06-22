import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography, shadows } from '../utils/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof spacing | 'none';
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: any;
}

interface SectionProps {
  children: React.ReactNode;
  style?: any;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'lg',
}) => {
  const pad = padding === 'none' ? 0 : spacing[padding];
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && shadows.sm,
        variant === 'outlined' && { borderWidth: 1, borderColor: colors.border },
        variant === 'flat' && { backgroundColor: colors.surfaceMuted },
        { padding: pad },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, style }) => (
  <View style={[styles.header, style]}>
    <View style={{ flex: 1 }}>
      <Text style={[typography.h3, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {action ? <View style={{ marginLeft: spacing.md }}>{action}</View> : null}
  </View>
);

export const CardBody: React.FC<SectionProps> = ({ children, style }) => (
  <View style={[{ paddingVertical: spacing.sm }, style]}>{children}</View>
);

export const CardFooter: React.FC<SectionProps> = ({ children, style }) => (
  <View
    style={[
      {
        paddingTop: spacing.md,
        marginTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
      },
      style,
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
});
