import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { reportApi, commentApi } from "@/lib/api";
import { getUser, isAdmin, formatDate, getImageUrl } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { StatusBadge, Card, LoadingScreen, Button } from "@/components/ui";

export default function DetailLaporanScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commLoading, setCommLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => { getUser().then(setUser); }, []);

  const load = async () => {
    try {
      const [rr, cr] = await Promise.all([
        reportApi.getById(Number(id)),
        commentApi.getByReport(Number(id)),
      ]);
      setReport(rr.data.data);
      setComments(cr.data.data);
    } catch {
      Alert.alert("Error", "Laporan tidak ditemukan");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const submitComment = async () => {
    if (!user) { Alert.alert("Perhatian", "Login untuk berkomentar"); return; }
    if (!commentText.trim()) return;
    setCommLoading(true);
    try {
      await commentApi.create({ body: commentText, public_report_id: Number(id) });
      setCommentText("");
      load();
    } catch { Alert.alert("Gagal", "Gagal menambahkan komentar"); }
    finally { setCommLoading(false); }
  };

  const saveEdit = async (cid: number) => {
    if (!editText.trim()) return;
    try {
      await commentApi.update(cid, editText);
      setEditingId(null);
      load();
    } catch { Alert.alert("Gagal", "Gagal memperbarui komentar"); }
  };

  const deleteComment = (cid: number) => {
    Alert.alert("Hapus Komentar", "Yakin hapus komentar ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await commentApi.delete(cid); load(); } },
    ]);
  };

  const updateStatus = (status: string) => {
    const labels: Record<string, string> = { approved: "Setujui", rejected: "Tolak", pending: "Set Pending" };
    Alert.alert("Konfirmasi", `${labels[status]} laporan ini?`, [
      { text: "Batal", style: "cancel" },
      {
        text: labels[status], onPress: async () => {
          try { await reportApi.updateStatus(Number(id), status); load(); }
          catch { Alert.alert("Gagal", "Gagal mengubah status"); }
        }
      },
    ]);
  };

  const deleteReport = () => {
    Alert.alert("Hapus Laporan", "Tindakan tidak dapat dibatalkan. Lanjutkan?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          try { await reportApi.delete(Number(id)); router.replace("/(tabs)/dashboard"); }
          catch { Alert.alert("Gagal", "Gagal menghapus laporan"); }
        }
      },
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!report) return null;

  const imgUrl = getImageUrl(report.image);
  const isOwner = user?.id === report.user_id;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.stone700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Detail Laporan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Report card */}
        <Card style={styles.reportCard}>
          {imgUrl && (
            <Image source={{ uri: imgUrl }} style={styles.reportImg} contentFit="cover" />
          )}
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={styles.reportTitle}>{report.header}</Text>
              <StatusBadge status={report.status} />
            </View>
            <Text style={styles.reportBody}>{report.body}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}><Ionicons name="person-outline" size={13} color={Colors.stone400} /><Text style={styles.metaText}>{report.author}</Text></View>
              <View style={styles.metaItem}><Ionicons name="pricetag-outline" size={13} color={Colors.stone400} /><Text style={styles.metaText}>{report.category_name}</Text></View>
              <View style={styles.metaItem}><Ionicons name="calendar-outline" size={13} color={Colors.stone400} /><Text style={styles.metaText}>{formatDate(report.created_at)}</Text></View>
            </View>
            {report.address && (
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={15} color={Colors.primary} />
                <Text style={styles.addressText}>{report.address}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Admin actions */}
        {isAdmin(user) && (
          <Card>
            <Text style={styles.sectionTitle}>Tindakan Admin</Text>
            <View style={styles.adminBtns}>
              <TouchableOpacity
                onPress={() => updateStatus("approved")} disabled={report.status === "approved"}
                style={[styles.adminBtn, { backgroundColor: `${Colors.sage}20`, opacity: report.status === "approved" ? 0.4 : 1 }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.sageDark} />
                <Text style={[styles.adminBtnText, { color: Colors.sageDark }]}>Setujui</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateStatus("rejected")} disabled={report.status === "rejected"}
                style={[styles.adminBtn, { backgroundColor: "#FEF2F2", opacity: report.status === "rejected" ? 0.4 : 1 }]}>
                <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
                <Text style={[styles.adminBtnText, { color: Colors.error }]}>Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateStatus("pending")} disabled={report.status === "pending"}
                style={[styles.adminBtn, { backgroundColor: "#FFFBEB", opacity: report.status === "pending" ? 0.4 : 1 }]}>
                <Ionicons name="time-outline" size={16} color={Colors.warning} />
                <Text style={[styles.adminBtnText, { color: Colors.warning }]}>Pending</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Hapus laporan */}
        {(isOwner || isAdmin(user)) && (
          <Button label="Hapus Laporan" onPress={deleteReport} variant="danger" />
        )}

        {/* Comments */}
        <Card>
          <Text style={styles.sectionTitle}>
            Komentar ({comments.length})
          </Text>

          {/* Input komentar */}
          {user ? (
            <View style={styles.commentInput}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{user.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Tulis komentar..."
                  placeholderTextColor={Colors.stone400}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  onPress={submitComment}
                  disabled={commLoading || !commentText.trim()}
                  style={[styles.sendBtn, { opacity: commLoading || !commentText.trim() ? 0.5 : 1 }]}>
                  <Ionicons name="send" size={14} color={Colors.white} />
                  <Text style={styles.sendBtnText}>{commLoading ? "Mengirim..." : "Kirim"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                <Text style={styles.loginLink}>Login</Text> untuk berkomentar
              </Text>
            </TouchableOpacity>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <Text style={styles.noComment}>Belum ada komentar</Text>
          ) : (
            <View style={styles.commentList}>
              {comments.map((c: any) => (
                <View key={c.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{c.commenter.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commenter}>{c.commenter}</Text>
                      <View style={styles.commentActions}>
                        <Text style={styles.commentDate}>{formatDate(c.created_at)}</Text>
                        {user?.id === c.user_id && editingId !== c.id && (
                          <TouchableOpacity onPress={() => { setEditingId(c.id); setEditText(c.body); }}>
                            <Ionicons name="pencil-outline" size={14} color={Colors.stone400} />
                          </TouchableOpacity>
                        )}
                        {(user?.id === c.user_id || isAdmin(user)) && editingId !== c.id && (
                          <TouchableOpacity onPress={() => deleteComment(c.id)}>
                            <Ionicons name="trash-outline" size={14} color={Colors.stone400} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {editingId === c.id ? (
                      <View>
                        <TextInput
                          style={[styles.commentTextInput, { marginBottom: 8 }]}
                          value={editText} onChangeText={setEditText}
                          multiline autoFocus
                        />
                        <View style={styles.editBtns}>
                          <TouchableOpacity onPress={() => saveEdit(c.id)} style={styles.editSave}>
                            <Ionicons name="checkmark" size={14} color={Colors.sageDark} />
                            <Text style={[styles.editBtnText, { color: Colors.sageDark }]}>Simpan</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingId(null)} style={styles.editCancel}>
                            <Ionicons name="close" size={14} color={Colors.stone500} />
                            <Text style={[styles.editBtnText, { color: Colors.stone500 }]}>Batal</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.commentBody}>{c.body}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone200,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: Colors.stone800 },
  content: { padding: 16, gap: 14 },
  reportCard: { padding: 0, overflow: "hidden" },
  reportImg: { width: "100%", height: 200 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  reportTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  reportBody: { fontSize: 14, color: Colors.stone600, lineHeight: 22, marginBottom: 14 },
  metaRow: { gap: 8, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: Colors.stone400 },
  addressBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.stone50, borderRadius: 10, padding: 10,
  },
  addressText: { flex: 1, fontSize: 13, color: Colors.stone600, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.stone700, marginBottom: 14 },
  adminBtns: { flexDirection: "row", gap: 10 },
  adminBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  adminBtnText: { fontSize: 13, fontWeight: "700" },
  commentInput: { flexDirection: "row", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.stone100 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  commentAvatarText: { fontSize: 12, fontWeight: "700", color: Colors.white },
  commentTextInput: {
    borderWidth: 1.5, borderColor: Colors.stone200, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: Colors.stone800,
    backgroundColor: Colors.white, marginBottom: 8,
  },
  sendBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, alignSelf: "flex-start",
  },
  sendBtnText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  loginPrompt: { backgroundColor: Colors.stone50, borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  loginPromptText: { fontSize: 14, color: Colors.stone500 },
  loginLink: { color: Colors.primary, fontWeight: "700" },
  noComment: { textAlign: "center", color: Colors.stone400, fontSize: 14, paddingVertical: 16 },
  commentList: { gap: 14 },
  commentItem: { flexDirection: "row", gap: 10 },
  commentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  commenter: { fontSize: 13, fontWeight: "700", color: Colors.stone700 },
  commentActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  commentDate: { fontSize: 11, color: Colors.stone400 },
  commentBody: { fontSize: 13, color: Colors.stone600, lineHeight: 18 },
  editBtns: { flexDirection: "row", gap: 8 },
  editSave: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.sage}20`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editCancel: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.stone100, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontSize: 12, fontWeight: "700" },
});
