import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { Button, Input } from "@/components/ui";

export default function LoginScreen() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Perhatian", "Username dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(form);
      const { token, user } = res.data.data;
      await setAuth(token, user);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Login Gagal", err.response?.data?.message || "Username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="megaphone" size={28} color={Colors.white} />
          </View>
          <Text style={styles.appName}>LaporKita</Text>
          <Text style={styles.tagline}>Platform Pengaduan Masyarakat</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Masuk untuk melanjutkan</Text>

          <Input
            label="Username"
            placeholder="Masukkan username"
            value={form.username}
            onChangeText={(t) => setForm({ ...form, username: t })}
            autoCapitalize="none"
            style={styles.field}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passWrap}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Masukkan password"
                  value={form.password}
                  onChangeText={(t) => setForm({ ...form, password: t })}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color={Colors.stone400} />
              </TouchableOpacity>
            </View>
          </View>

          <Button label="Masuk" onPress={handleLogin} loading={loading} style={styles.submitBtn} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.link}>Daftar sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[["2.4K+", "Laporan"], ["98%", "Kepuasan"], ["15K+", "Warga"]].map(([v, l]) => (
            <View key={l} style={styles.statItem}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  content: { padding: 24, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 32 },
  logoWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  appName: { fontSize: 28, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  tagline: { fontSize: 13, color: Colors.stone500, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: Colors.stone200,
  },
  title: { fontSize: 22, fontWeight: "700", color: Colors.stone800, marginBottom: 4, fontFamily: "serif" },
  subtitle: { fontSize: 14, color: Colors.stone500, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: Colors.stone700, marginBottom: 6 },
  passWrap: { flexDirection: "row", alignItems: "center" },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, marginLeft: -4 },
  submitBtn: { marginTop: 8 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: Colors.stone500, fontSize: 14 },
  link: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  statsRow: {
    flexDirection: "row", justifyContent: "space-around",
    marginTop: 32, paddingVertical: 20,
    backgroundColor: Colors.primary, borderRadius: 16,
  },
  statItem: { alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "700", color: Colors.white },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
});
