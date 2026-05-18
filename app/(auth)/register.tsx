import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/lib/api";
import { Colors } from "@/lib/colors";
import { Button, Input } from "@/components/ui";

export default function RegisterScreen() {
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Perhatian", "Semua field wajib diisi"); return;
    }
    if (form.password !== form.confirm) {
      Alert.alert("Perhatian", "Password tidak cocok"); return;
    }
    if (form.password.length < 6) {
      Alert.alert("Perhatian", "Password minimal 6 karakter"); return;
    }
    setLoading(true);
    try {
      await authApi.register({ username: form.username, password: form.password });
      Alert.alert("Berhasil", "Akun berhasil dibuat! Silakan login.", [
        { text: "Login", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={Colors.stone700} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="megaphone" size={28} color={Colors.white} />
          </View>
          <Text style={styles.appName}>LaporKita</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>Daftar gratis dan mulai laporkan masalah</Text>

          <Input label="Username" placeholder="Pilih username unik"
            value={form.username} onChangeText={(t) => setForm({ ...form, username: t })}
            autoCapitalize="none" style={styles.field} />

          <Input label="Password" placeholder="Minimal 6 karakter"
            value={form.password} onChangeText={(t) => setForm({ ...form, password: t })}
            secureTextEntry autoCapitalize="none" style={styles.field} />

          <Input label="Konfirmasi Password" placeholder="Ulangi password"
            value={form.confirm} onChangeText={(t) => setForm({ ...form, confirm: t })}
            secureTextEntry autoCapitalize="none" style={styles.field} />

          <View style={styles.benefits}>
            {["Gratis selamanya", "Laporan ditangani profesional", "Pantau status 24/7"].map((s) => (
              <View key={s} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.sage} />
                <Text style={styles.benefitText}>{s}</Text>
              </View>
            ))}
          </View>

          <Button label="Daftar Sekarang" onPress={handleRegister} loading={loading}
            variant="sage" style={styles.submitBtn} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.link}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  content: { padding: 24, paddingTop: 60 },
  back: { marginBottom: 16 },
  header: { alignItems: "center", marginBottom: 28 },
  logoWrap: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: Colors.sage, alignItems: "center", justifyContent: "center", marginBottom: 10,
    shadowColor: Colors.sage, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  appName: { fontSize: 26, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: Colors.stone200,
  },
  title: { fontSize: 22, fontWeight: "700", color: Colors.stone800, marginBottom: 4, fontFamily: "serif" },
  subtitle: { fontSize: 14, color: Colors.stone500, marginBottom: 24 },
  field: { marginBottom: 16 },
  benefits: { backgroundColor: Colors.stone50, borderRadius: 12, padding: 14, marginBottom: 20, gap: 8 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: 13, color: Colors.stone600 },
  submitBtn: { marginBottom: 4 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { color: Colors.stone500, fontSize: 14 },
  link: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
});
