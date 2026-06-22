import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, typography } from '../utils/tokens';

export type BadgeType = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'brand';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  dot?: boolean;
  style?: any;
}

const palette: Record<BadgeType, { bg: string; fg: string; dot: string }> = {
  success: { bg: colors.successSoft, fg: '#15803d', dot: colors.success },
  error: { bg: colors.dangerSoft, fg: '#b91c1c', dot: colors.danger },
  warning: { bg: colors.warningSoft, fg: '#b45309', dot: colors.warning },
  info: { bg: colors.infoSoft, fg: '#0369a1', dot: colors.info },
  brand: { bg: colors.primarySoft, fg: colors.primaryDark, dot: colors.primary },
  neutral: { bg: '#f1f5f9', fg: '#334155', dot: '#64748b' },
};

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral', dot = true, style }) => {
  const p = palette[type];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: p.dot }]} /> : null}
      <Text style={[typography.caption, { color: p.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
