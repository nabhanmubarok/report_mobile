import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/lib/api";
import { getUser, clearAuth } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { Button, Input, Card } from "@/components/ui";

const ROLE_COLOR: Record<string, string> = {
  user: Colors.stone500, admin: Colors.primary, super_admin: Colors.sageDark,
};

export default function ProfilScreen() {
  const [user, setUser] = useState<any>(null);
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);

  useEffect(() => { getUser().then(setUser); }, []);

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar", style: "destructive",
        onPress: async () => { await clearAuth(); router.replace("/(auth)/login"); },
      },
    ]);
  };

  const handleChangePass = async () => {
    if (!passForm.oldPassword || !passForm.newPassword) {
      Alert.alert("Perhatian", "Semua field wajib diisi"); return;
    }
    if (passForm.newPassword !== passForm.confirm) {
      Alert.alert("Perhatian", "Password baru tidak cocok"); return;
    }
    if (passForm.newPassword.length < 6) {
      Alert.alert("Perhatian", "Password baru minimal 6 karakter"); return;
    }
    setSaving(true);
    try {
      await authApi.changePassword?.({ oldPassword: passForm.oldPassword, newPassword: passForm.newPassword })
        ?? (await import("@/lib/api")).default.put("/users/profile/change-password", {
          oldPassword: passForm.oldPassword, newPassword: passForm.newPassword,
        });
      Alert.alert("Berhasil", "Password berhasil diubah. Silakan login ulang.", [
        { text: "OK", onPress: async () => { await clearAuth(); router.replace("/(auth)/login"); } },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <Text style={styles.headerSub}>Kelola informasi akun</Text>
      </View>

      {/* Avatar card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.username}>{user.username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLOR[user.role]}20` }]}>
              <Text style={[styles.roleText, { color: ROLE_COLOR[user.role] }]}>{user.role}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Menu items */}
      <Card>
        <TouchableOpacity style={styles.menuItem} onPress={() => setShowPassSection(!showPassSection)}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
          <Text style={styles.menuLabel}>Ubah Password</Text>
          <Ionicons name={showPassSection ? "chevron-up" : "chevron-down"} size={18} color={Colors.stone400} />
        </TouchableOpacity>

        {showPassSection && (
          <View style={styles.passSection}>
            <Input label="Password Lama" placeholder="Masukkan password lama"
              value={passForm.oldPassword} onChangeText={(t) => setPassForm({ ...passForm, oldPassword: t })}
              secureTextEntry autoCapitalize="none" style={styles.field} />
            <Input label="Password Baru" placeholder="Minimal 6 karakter"
              value={passForm.newPassword} onChangeText={(t) => setPassForm({ ...passForm, newPassword: t })}
              secureTextEntry autoCapitalize="none" style={styles.field} />
            <Input label="Konfirmasi Password Baru" placeholder="Ulangi password baru"
              value={passForm.confirm} onChangeText={(t) => setPassForm({ ...passForm, confirm: t })}
              secureTextEntry autoCapitalize="none" style={styles.field} />
            <Button label="Simpan Password" onPress={handleChangePass} loading={saving} />
          </View>
        )}
      </Card>

      {/* App info */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>LaporKita Mobile</Text>
        <Text style={styles.infoSub}>Platform Pengaduan Masyarakat v1.0.0</Text>
        <View style={styles.infoRow}>
          {[["2.4K+", "Laporan"], ["98%", "Kepuasan"], ["15K+", "Warga"]].map(([v, l]) => (
            <View key={l} style={styles.infoStat}>
              <Text style={styles.infoStatVal}>{v}</Text>
              <Text style={styles.infoStatLabel}>{l}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Logout */}
      <Button label="Keluar dari Akun" onPress={handleLogout} variant="danger"
        style={styles.logoutBtn} />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  content: { gap: 14 },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.stone200, marginBottom: 2,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  headerSub: { fontSize: 13, color: Colors.stone500, marginTop: 2 },
  profileCard: { marginHorizontal: 16 },
  avatarWrap: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: Colors.white },
  username: { fontSize: 20, fontWeight: "700", color: Colors.stone800, fontFamily: "serif", marginBottom: 6 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  roleText: { fontSize: 12, fontWeight: "700" },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.stone700 },
  passSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.stone100, gap: 4 },
  field: { marginBottom: 12 },
  infoCard: { marginHorizontal: 16, alignItems: "center", gap: 4 },
  infoTitle: { fontSize: 18, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  infoSub: { fontSize: 12, color: Colors.stone400, marginBottom: 12 },
  infoRow: { flexDirection: "row", gap: 32 },
  infoStat: { alignItems: "center" },
  infoStatVal: { fontSize: 20, fontWeight: "700", color: Colors.primary },
  infoStatLabel: { fontSize: 11, color: Colors.stone400 },
  logoutBtn: { marginHorizontal: 16 },
});
