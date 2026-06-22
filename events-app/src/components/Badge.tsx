import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

export type BadgeType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  style?: any;
}

const getBackgroundColor = (type: BadgeType) => {
  switch (type) {
    case 'success':
      return '#E8F5E9';
    case 'error':
      return '#FFEBEE';
    case 'warning':
      return '#FFF3E0';
    case 'info':
      return '#E3F2FD';
    case 'neutral':
    default:
      return '#F5F5F5';
  }
};

const getTextColor = (type: BadgeType) => {
  switch (type) {
    case 'success':
      return '#2E7D32';
    case 'error':
      return '#C62828';
    case 'warning':
      return '#E65100';
    case 'info':
      return '#1565C0';
    case 'neutral':
    default:
      return '#424242';
  }
};

const getIcon = (type: BadgeType) => {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'error':
      return 'alert-circle';
    case 'warning':
      return 'alert';
    case 'info':
      return 'information';
    case 'neutral':
    default:
      return 'circle';
  }
};

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral', style }) => (
  <Chip
    icon={getIcon(type)}
    style={[
      styles.badge,
      {
        backgroundColor: getBackgroundColor(type),
      },
      style,
    ]}
    textStyle={{
      color: getTextColor(type),
      fontSize: 12,
      fontWeight: '600',
    }}
    compact
  >
    {label}
  </Chip>
);

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
});
