import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { authApi } from "@/lib/api";
import { getUser, clearAuth } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { Button, Input, Card } from "@/components/ui";

export default function ProfilScreen() {
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [usernameForm, setUsernameForm] = useState({ username: "" });
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    getUser().then((u) => {
      if (!u) { router.replace("/(auth)/login"); return; }
      setUser(u);
      setUsernameForm({ username: u.username });
    });
    authApi.getProfile().then((r) => {
      if (r.data.data.avatar) setAvatar(r.data.data.avatar);
    }).catch(() => {});
  }, []);

  const pickAvatar = () => {
    Alert.alert("Ganti Foto Profil", "", [
      { text: "Kamera", onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
          if (!res.canceled) uploadAvatar(res.assets[0].uri);
        }
      },
      { text: "Galeri", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
          if (!res.canceled) uploadAvatar(res.assets[0].uri);
        }
      },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    setAvatar(uri);
    try {
      const ext = uri.split(".").pop() || "jpg";
      const fd = new FormData() as any;
      fd.append("avatar", { uri, name: `avatar.${ext}`, type: `image/${ext}` });
      const res = await authApi.updateAvatar(fd);
      setAvatar(res.data.data.avatar);
      Alert.alert("Berhasil", "Foto profil berhasil diupdate!");
    } catch { Alert.alert("Gagal", "Gagal mengupload foto profil"); }
    finally { setUploading(false); }
  };

  const handleUpdateProfile = async () => {
    if (!usernameForm.username) { Alert.alert("Perhatian", "Username wajib diisi"); return; }
    setSavingProfile(true);
    try {
      await authApi.updateProfile(usernameForm);
      Alert.alert("Berhasil", "Profil diperbarui. Silakan login ulang.", [
        { text: "OK", onPress: async () => { await clearAuth(); router.replace("/(auth)/login"); } },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal memperbarui profil");
    } finally { setSavingProfile(false); }
  };

  const handleChangePass = async () => {
    if (!passForm.oldPassword || !passForm.newPassword) { Alert.alert("Perhatian", "Semua field wajib diisi"); return; }
    if (passForm.newPassword !== passForm.confirm) { Alert.alert("Perhatian", "Password baru tidak cocok"); return; }
    if (passForm.newPassword.length < 6) { Alert.alert("Perhatian", "Password minimal 6 karakter"); return; }
    setSavingPass(true);
    try {
      await authApi.changePassword({ oldPassword: passForm.oldPassword, newPassword: passForm.newPassword });
      Alert.alert("Berhasil", "Password berhasil diubah. Silakan login ulang.", [
        { text: "OK", onPress: async () => { await clearAuth(); router.replace("/(auth)/login"); } },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal mengubah password");
    } finally { setSavingPass(false); }
  };

  const handleLogout = () => {
    Alert.alert("Konfirmasi", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: async () => { await clearAuth(); router.replace("/(auth)/login"); } },
    ]);
  };

  if (!user) return null;

  const ROLE_COLOR: Record<string, string> = { user: Colors.stone500, admin: Colors.primary, super_admin: Colors.sageDark };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ gap: 14 }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profil Saya</Text>
        <Text style={s.headerSub}>Kelola informasi akun</Text>
      </View>

      {/* Avatar */}
      <Card style={s.profileCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={pickAvatar} style={{ position: "relative" }}>
            {avatar
              ? <Image source={{ uri: avatar }} style={s.avatarImg} resizeMode="cover" />
              : <View style={s.avatarPlaceholder}><Text style={s.avatarText}>{user.username.charAt(0).toUpperCase()}</Text></View>
            }
            <View style={s.cameraBtn}>
              <Ionicons name={uploading ? "hourglass-outline" : "camera"} size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.username}>{user.username}</Text>
            <View style={[s.roleBadge, { backgroundColor: `${ROLE_COLOR[user.role]}20` }]}>
              <Text style={[s.roleText, { color: ROLE_COLOR[user.role] }]}>{user.role}</Text>
            </View>
            <Text style={s.avatarHint}>{uploading ? "Mengupload..." : "Ketuk foto untuk mengubah"}</Text>
          </View>
        </View>
      </Card>

      {/* Username */}
      <Card style={s.sectionCard}>
        <Text style={s.sectionTitle}>Ubah Username</Text>
        <Input label="Username" placeholder="Username baru" value={usernameForm.username}
          onChangeText={(t) => setUsernameForm({ username: t })} autoCapitalize="none" style={{ marginBottom: 12 }} />
        <Button label={savingProfile ? "Menyimpan..." : "Simpan Username"} onPress={handleUpdateProfile} loading={savingProfile} />
      </Card>

      {/* Password */}
      <Card>
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }} onPress={() => setShowPass(!showPass)}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.primary} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: Colors.stone700 }}>Ubah Password</Text>
          <Ionicons name={showPass ? "chevron-up" : "chevron-down"} size={18} color={Colors.stone400} />
        </TouchableOpacity>
        {showPass && (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.stone100, gap: 4 }}>
            <Input label="Password Lama" placeholder="Password lama" value={passForm.oldPassword}
              onChangeText={(t) => setPassForm({ ...passForm, oldPassword: t })} secureTextEntry autoCapitalize="none" style={{ marginBottom: 12 }} />
            <Input label="Password Baru" placeholder="Minimal 6 karakter" value={passForm.newPassword}
              onChangeText={(t) => setPassForm({ ...passForm, newPassword: t })} secureTextEntry autoCapitalize="none" style={{ marginBottom: 12 }} />
            <Input label="Konfirmasi" placeholder="Ulangi password baru" value={passForm.confirm}
              onChangeText={(t) => setPassForm({ ...passForm, confirm: t })} secureTextEntry autoCapitalize="none" style={{ marginBottom: 12 }} />
            <Button label="Simpan Password" onPress={handleChangePass} loading={savingPass} />
          </View>
        )}
      </Card>

      <Button label="Keluar dari Akun" onPress={handleLogout} variant="danger" style={{ marginHorizontal: 16 }} />
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: { backgroundColor: Colors.white, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.stone200, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.stone800 },
  headerSub: { fontSize: 13, color: Colors.stone500, marginTop: 2 },
  profileCard: { marginHorizontal: 16 },
  avatarImg: { width: 72, height: 72, borderRadius: 20, borderWidth: 2, borderColor: Colors.stone200 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontWeight: "700", color: Colors.white },
  cameraBtn: { position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.white },
  username: { fontSize: 18, fontWeight: "700", color: Colors.stone800, marginBottom: 6 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start", marginBottom: 6 },
  roleText: { fontSize: 12, fontWeight: "700" },
  avatarHint: { fontSize: 11, color: Colors.stone400 },
  sectionCard: { marginHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.stone700, marginBottom: 12 },
});
