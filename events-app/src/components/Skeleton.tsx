import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  style?: any;
}

interface SkeletonCircleProps {
  size?: number;
  style?: any;
}

/**
 * Generic skeleton loader
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for text blocks
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 12,
  spacing = 8,
  style,
}) => (
  <View style={[styles.textContainer, style]}>
    {Array.from({ length: lines }).map((_, i) => (
      <View key={i} style={{ marginBottom: i < lines - 1 ? spacing : 0 }}>
        <Skeleton height={lineHeight} />
      </View>
    ))}
  </View>
);

/**
 * Skeleton for circular avatars
 */
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({ size = 48, style }) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />
);

/**
 * Skeleton for card layouts
 */
export const SkeletonCard: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <SkeletonCircle size={40} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Skeleton height={14} width="60%" style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="90%" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  textContainer: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
