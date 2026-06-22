import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';
import { colors, radii, spacing } from '../utils/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.View
      style={[styles.skeleton, { width, height, borderRadius, opacity }, style]}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: DimensionValue;
  style?: any;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 12,
  spacing: gap = 8,
  lastLineWidth = '70%',
  style,
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height={lineHeight}
        width={i === lines - 1 ? lastLineWidth : '100%'}
        style={{ marginBottom: i < lines - 1 ? gap : 0 }}
      />
    ))}
  </View>
);

export const SkeletonCircle: React.FC<{ size?: number; style?: any }> = ({
  size = 48,
  style,
}) => <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;

export const SkeletonCard: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <SkeletonCircle size={44} />
    <View style={{ flex: 1, marginLeft: spacing.md }}>
      <Skeleton height={14} width="55%" style={{ marginBottom: 8 }} />
      <Skeleton height={11} width="85%" style={{ marginBottom: 6 }} />
      <Skeleton height={11} width="40%" />
    </View>
  </View>
);

export const SkeletonEventCard: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.eventCard, style]}>
    <Skeleton height={140} borderRadius={radii.md} />
    <View style={{ paddingTop: spacing.md }}>
      <Skeleton height={16} width="80%" style={{ marginBottom: 8 }} />
      <Skeleton height={12} width="60%" style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton height={20} width={70} borderRadius={radii.pill} />
        <Skeleton height={20} width={50} borderRadius={radii.pill} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
  eventCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
  },
});
