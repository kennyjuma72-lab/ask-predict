import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { useAuth } from '../../services/AuthContext';
import { useToast } from '../../services/ToastContext';
import { Button } from '../../components/Button';
import { colors, radii, spacing, typography, shadows } from '../../utils/tokens';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      showToast(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandMark}>
          <View style={styles.brandDot} />
          <Text style={[typography.overline, { color: colors.primaryDark }]}>EVENTS</Text>
        </View>

        <View style={styles.header}>
          <Text style={[typography.display, { color: colors.text }]}>Welcome back</Text>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>
            Sign in to continue discovering events.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[typography.caption, styles.label]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            style={styles.input}
            left={<TextInput.Icon icon="email-outline" />}
          />

          <Text style={[typography.caption, styles.label, { marginTop: spacing.md }]}>
            Password
          </Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="password"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword((v) => !v)}
                />
              }
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: spacing.lg }}
          >
            <Text style={[typography.caption, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <Button
            label="Sign in"
            onPress={handleLogin}
            loading={loading}
            size="large"
            fullWidth
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={[typography.caption, { color: colors.textSubtle, marginHorizontal: 12 }]}>
              OR
            </Text>
            <View style={styles.divider} />
          </View>

          <Button
            label="Create new account"
            variant="outline"
            onPress={() => navigation.navigate('Signup')}
            fullWidth
          />
        </View>

        <Text style={[typography.caption, styles.footer]}>
          By signing in you agree to our Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  header: { marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  label: { color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.surface, fontSize: 15 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  footer: {
    textAlign: 'center',
    color: colors.textSubtle,
    marginTop: spacing.xl,
  },
});
