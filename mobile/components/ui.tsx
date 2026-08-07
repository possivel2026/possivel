import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from 'react-native';

export const colors = {
  background: '#07111f',
  surface: '#0e1b2d',
  surfaceAlt: '#14243a',
  border: '#263b55',
  text: '#f7fbff',
  muted: '#9eb0c5',
  primary: '#31d5a5',
  primaryDark: '#18a77e',
  danger: '#ff6b7a',
  warning: '#ffcb6b',
};

export function Screen({ children, scroll = false }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={styles.screenContent}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  children,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...props
}: PropsWithChildren<PressableProps & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }>) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === 'ghost' ? colors.primary : '#06120e'} /> : <Text style={[styles.buttonText, variant === 'ghost' && styles.buttonGhostText]}>{children}</Text>}
    </Pressable>
  );
}

export function Input({ label, error, multiline, ...props }: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.textarea, props.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Avatar({ uri, name, size = 44 }: { uri?: string | null; name?: string; size?: number }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceAlt }} />;
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: Math.max(12, size * 0.34) }]}>{initials}</Text>
    </View>
  );
}

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{description}</Text>
      {action}
    </Card>
  );
}

export function Badge({ children }: PropsWithChildren) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

export const typography = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  link: { color: colors.primary, fontWeight: '700' },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  screenContent: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { flexGrow: 1, padding: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  headerTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  headerSubtitle: { color: colors.muted, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 10 },
  button: { minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingHorizontal: 16 },
  buttonSecondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  buttonDanger: { backgroundColor: colors.danger },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { color: '#06120e', fontWeight: '800', fontSize: 15 },
  buttonGhostText: { color: colors.primary },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  inputGroup: { gap: 6 },
  label: { color: colors.text, fontWeight: '700', fontSize: 13 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.surfaceAlt, fontSize: 15 },
  textarea: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 12 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark },
  avatarText: { color: colors.text, fontWeight: '900' },
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { color: colors.muted, textAlign: 'center' },
  empty: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(49,213,165,0.15)' },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
});
