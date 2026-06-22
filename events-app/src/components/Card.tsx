import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  elevation?: number;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  style?: any;
}

interface CardBodyProps {
  children: React.ReactNode;
  style?: any;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ children, style, elevation = 2 }) => (
  <Surface style={[styles.card, { elevation }, style]}>
    {children}
  </Surface>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, style }) => (
  <View style={[styles.header, style]}>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

export const CardBody: React.FC<CardBodyProps> = ({ children, style }) => (
  <View style={[styles.body, style]}>
    {children}
  </View>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View style={[styles.footer, style]}>
    {children}
  </View>
);

// Fallback Text component
const Text: React.FC<any> = ({ children, style }) => {
  const { Text: RNText } = require('react-native');
  return <RNText style={style}>{children}</RNText>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  body: {
    paddingVertical: 8,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 12,
  },
});
