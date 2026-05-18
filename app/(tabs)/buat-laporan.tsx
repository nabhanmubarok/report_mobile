import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { reportApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { Button, Input, Card } from "@/components/ui";

export default function BuatLaporanScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    header: "", body: "", category_id: "", address: "",
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);

  useEffect(() => {
    getUser().then((u) => {
      if (!u) { Alert.alert("Perhatian", "Silakan login terlebih dahulu"); router.replace("/(auth)/login"); }
    });
    reportApi.getCategories().then((r) => setCategories(r.data.data));
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert("Pilih Foto", "", [
      { text: "Kamera", onPress: pickCamera },
      { text: "Galeri", onPress: pickImage },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    if (!form.header || !form.body || !selectedCat) {
      Alert.alert("Perhatian", "Judul, deskripsi, dan kategori wajib diisi"); return;
    }
    setLoading(true);
    try {
      const fd = new FormData() as any;
      fd.append("header", form.header);
      fd.append("body", form.body);
      fd.append("category_id", selectedCat.id.toString());
      if (form.address) fd.append("address", form.address);
      if (imageUri) {
        const ext = imageUri.split(".").pop() || "jpg";
        fd.append("image", { uri: imageUri, name: `photo.${ext}`, type: `image/${ext}` } as any);
      }
      await reportApi.create(fd);
      Alert.alert("Berhasil", "Laporan berhasil dikirim!", [
        { text: "OK", onPress: () => { setForm({ header: "", body: "", category_id: "", address: "" }); setImageUri(null); setSelectedCat(null); router.push("/(tabs)/dashboard"); } },
      ]);
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.message || "Gagal mengirim laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buat Laporan Baru</Text>
        <Text style={styles.headerSub}>Laporkan masalah di sekitar Anda</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Info */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Informasi Laporan</Text>
          </View>

          <Input label="Judul Laporan *" placeholder="Contoh: Jalan Berlubang di Depan SDN 01"
            value={form.header} onChangeText={(t) => setForm({ ...form, header: t })}
            style={styles.field} />
          <Text style={styles.charCount}>{form.header.length}/200 karakter</Text>

          <Input label="Deskripsi Lengkap *" placeholder="Jelaskan masalah secara detail..."
            value={form.body} onChangeText={(t) => setForm({ ...form, body: t })}
            multiline numberOfLines={5} style={styles.field} />

          {/* Kategori picker */}
          <View style={styles.field}>
            <Text style={styles.label}>Kategori *</Text>
            <TouchableOpacity style={styles.catBtn} onPress={() => setCatOpen(!catOpen)}>
              <Text style={selectedCat ? styles.catSelected : styles.catPlaceholder}>
                {selectedCat ? selectedCat.category_name : "Pilih kategori laporan"}
              </Text>
              <Ionicons name={catOpen ? "chevron-up" : "chevron-down"} size={18} color={Colors.stone400} />
            </TouchableOpacity>
            {catOpen && (
              <View style={styles.catDropdown}>
                {categories.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.catOption}
                    onPress={() => { setSelectedCat(c); setForm({ ...form, category_id: c.id.toString() }); setCatOpen(false); }}>
                    <Text style={[styles.catOptionText, selectedCat?.id === c.id && styles.catOptionActive]}>
                      {c.category_name}
                    </Text>
                    {selectedCat?.id === c.id && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Card>

        {/* Lokasi */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Lokasi Kejadian</Text>
          </View>
          <Input label="Alamat Lengkap"
            placeholder="Jl. Mawar No.10, RT 03/RW 05, Kelurahan..."
            value={form.address} onChangeText={(t) => setForm({ ...form, address: t })}
            multiline numberOfLines={2} style={styles.field} />
          <Text style={styles.hint}>Sertakan nama jalan, nomor, RT/RW, kelurahan, dan kecamatan.</Text>
        </Card>

        {/* Foto */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Foto Bukti</Text>
          </View>

          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImg}>
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={showImageOptions} style={styles.uploadBtn}>
              <Ionicons name="cloud-upload-outline" size={32} color={Colors.stone300} />
              <Text style={styles.uploadText}>Ketuk untuk upload foto</Text>
              <Text style={styles.uploadHint}>Kamera atau Galeri – Maks 5MB</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Submit */}
        <View style={styles.submitRow}>
          <Button label="Batal" onPress={() => router.back()} variant="outline" style={styles.btnHalf} />
          <Button label="Kirim Laporan" onPress={handleSubmit} loading={loading} style={styles.btnHalf} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.stone200,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  headerSub: { fontSize: 13, color: Colors.stone500, marginTop: 2 },
  content: { padding: 16, gap: 14 },
  section: {},
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.stone700 },
  field: { marginBottom: 4 },
  charCount: { fontSize: 11, color: Colors.stone400, marginBottom: 12, textAlign: "right" },
  label: { fontSize: 13, fontWeight: "700", color: Colors.stone700, marginBottom: 6 },
  catBtn: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: Colors.stone200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: Colors.white,
  },
  catSelected: { fontSize: 15, color: Colors.stone800 },
  catPlaceholder: { fontSize: 15, color: Colors.stone400 },
  catDropdown: {
    borderWidth: 1.5, borderColor: Colors.stone200, borderRadius: 12,
    marginTop: 4, backgroundColor: Colors.white, overflow: "hidden",
  },
  catOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.stone100,
  },
  catOptionText: { fontSize: 14, color: Colors.stone700 },
  catOptionActive: { color: Colors.primary, fontWeight: "700" },
  hint: { fontSize: 11, color: Colors.stone400, marginTop: 4 },
  previewImg: { width: "100%", height: 180, borderRadius: 12 },
  removeImg: { position: "absolute", top: 8, right: 8 },
  uploadBtn: {
    borderWidth: 2, borderStyle: "dashed", borderColor: Colors.stone200,
    borderRadius: 14, padding: 32, alignItems: "center", gap: 8,
  },
  uploadText: { fontSize: 14, fontWeight: "700", color: Colors.stone500 },
  uploadHint: { fontSize: 12, color: Colors.stone400 },
  submitRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  btnHalf: { flex: 1 },
});
