import React from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from "react-native";
import { Colors, StatusColors, StatusLabel } from "@/lib/colors";

// ── Button ──
interface BtnProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "sage" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
}
export function Button({ label, onPress, variant = "primary", loading, disabled, style, small }: BtnProps) {
  const bg = {
    primary: Colors.primary,
    outline: "transparent",
    sage: Colors.sage,
    danger: Colors.error,
  }[variant];
  const color = variant === "outline" ? Colors.primary : Colors.white;
  const border = variant === "outline" ? { borderWidth: 2, borderColor: Colors.primary } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled || loading ? 0.5 : 1 },
        small && { paddingVertical: 8, paddingHorizontal: 14 },
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <Text style={[styles.btnText, { color }, small && { fontSize: 13 }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Input ──
interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  label?: string;
  style?: ViewStyle;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}
export function Input({ label, style, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);
  const { TextInput } = require("react-native");
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.inputFocused, props.multiline && { height: 100, textAlignVertical: "top" }]}
        placeholderTextColor={Colors.stone400}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

// ── StatusBadge ──
export function StatusBadge({ status }: { status: string }) {
  const c = StatusColors[status] || { bg: Colors.stone100, text: Colors.stone600, border: Colors.stone200 };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{StatusLabel[status] || status}</Text>
    </View>
  );
}

// ── Card ──
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── LoadingScreen ──
export function LoadingScreen({ text = "Memuat..." }: { text?: string }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={Colors.primary} size="large" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

// ── SectionTitle ──
export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },
  label: { fontSize: 13, fontWeight: "700", color: Colors.stone700, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.stone200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.stone800,
    backgroundColor: Colors.white,
  },
  inputFocused: { borderColor: Colors.primary },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.stone200,
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: Colors.creamLight },
  loadingText: { color: Colors.stone400, fontSize: 14 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
});
