import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { reportApi, commentApi, authApi } from "@/lib/api";
import { getUser, isAdmin, formatDate, getImageUrl } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { StatusBadge, Card, LoadingScreen, Button } from "@/components/ui";

export default function DetailLaporanScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commLoading, setCommLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    getUser().then((u) => {
      setUser(u);
      if (u) {
        authApi.getProfile().then((r) => { if (r.data.data.avatar) setAvatar(r.data.data.avatar); }).catch(() => {});
      }
    });
  }, []);

  const load = async () => {
    try {
      const [rr, cr] = await Promise.all([reportApi.getById(Number(id)), commentApi.getByReport(Number(id))]);
      setReport(rr.data.data);
      setComments(cr.data.data);
    } catch { Alert.alert("Error", "Laporan tidak ditemukan"); router.back(); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const submitComment = async () => {
    if (!user) { Alert.alert("Perhatian", "Login untuk berkomentar"); return; }
    if (!commentText.trim()) return;
    setCommLoading(true);
    try { await commentApi.create({ body: commentText, public_report_id: Number(id) }); setCommentText(""); load(); }
    catch { Alert.alert("Gagal", "Gagal menambahkan komentar"); }
    finally { setCommLoading(false); }
  };

  const saveEdit = async (cid: number) => {
    if (!editText.trim()) return;
    try { await commentApi.update(cid, editText); setEditingId(null); load(); }
    catch { Alert.alert("Gagal", "Gagal memperbarui komentar"); }
  };

  const deleteComment = (cid: number) => {
    Alert.alert("Hapus Komentar", "Yakin hapus?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await commentApi.delete(cid); load(); } },
    ]);
  };

  const updateStatus = (status: string) => {
    const labels: Record<string, string> = { approved: "Setujui", rejected: "Tolak", pending: "Set Pending" };
    Alert.alert("Konfirmasi", `${labels[status]} laporan ini?`, [
      { text: "Batal", style: "cancel" },
      { text: labels[status], onPress: async () => {
          try { await reportApi.updateStatus(Number(id), status); load(); }
          catch { Alert.alert("Gagal", "Gagal mengubah status"); }
        }
      },
    ]);
  };

  const deleteReport = () => {
    Alert.alert("Hapus Laporan", "Tindakan tidak dapat dibatalkan?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
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
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.stone700} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Detail Laporan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.container} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {/* Report */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {imgUrl && <Image source={{ uri: imgUrl }} style={s.reportImg} contentFit="cover" />}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <Text style={s.reportTitle}>{report.header}</Text>
              <StatusBadge status={report.status} />
            </View>
            <Text style={s.reportBody}>{report.body}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {report.author_avatar
                ? <Image source={{ uri: report.author_avatar }} style={s.authorAvatar} contentFit="cover" />
                : <View style={s.authorDot}><Text style={s.authorDotText}>{report.author?.charAt(0).toUpperCase()}</Text></View>
              }
              <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.stone600 }}>{report.author}</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 12 }}>
              <View style={s.metaItem}><Ionicons name="pricetag-outline" size={13} color={Colors.stone400} /><Text style={s.metaText}>{report.category_name}</Text></View>
              <View style={s.metaItem}><Ionicons name="calendar-outline" size={13} color={Colors.stone400} /><Text style={s.metaText}>{formatDate(report.created_at)}</Text></View>
            </View>

            {report.address && (
              <View style={s.addressBox}>
                <Ionicons name="location-outline" size={15} color={Colors.primary} />
                <Text style={s.addressText}>{report.address}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Admin actions */}
        {isAdmin(user) && (
          <Card>
            <Text style={s.sectionTitle}>Tindakan Admin</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[
                { status: "approved", label: "Setujui", bg: `${Colors.sage}20`, color: Colors.sageDark, icon: "checkmark-circle-outline" },
                { status: "rejected", label: "Tolak", bg: "#FEF2F2", color: Colors.error, icon: "close-circle-outline" },
                { status: "pending", label: "Pending", bg: "#FFFBEB", color: Colors.warning, icon: "time-outline" },
              ].map((a) => (
                <TouchableOpacity key={a.status} onPress={() => updateStatus(a.status)}
                  disabled={report.status === a.status}
                  style={[s.adminBtn, { backgroundColor: a.bg, opacity: report.status === a.status ? 0.4 : 1 }]}>
                  <Ionicons name={a.icon as any} size={16} color={a.color} />
                  <Text style={[s.adminBtnText, { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {(isOwner || isAdmin(user)) && (
          <Button label="Hapus Laporan" onPress={deleteReport} variant="danger" />
        )}

        {/* Comments */}
        <Card>
          <Text style={s.sectionTitle}>Komentar ({comments.length})</Text>

          {user ? (
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.stone100 }}>
              {avatar
                ? <Image source={{ uri: avatar }} style={s.commentAvatar} contentFit="cover" />
                : <View style={s.commentAvatarPH}><Text style={s.commentAvatarText}>{user.username.charAt(0).toUpperCase()}</Text></View>
              }
              <View style={{ flex: 1 }}>
                <TextInput style={s.commentInput} placeholder="Tulis komentar..." placeholderTextColor={Colors.stone400}
                  value={commentText} onChangeText={setCommentText} multiline />
                <TouchableOpacity onPress={submitComment} disabled={commLoading || !commentText.trim()}
                  style={[s.sendBtn, { opacity: commLoading || !commentText.trim() ? 0.5 : 1 }]}>
                  <Ionicons name="send" size={14} color={Colors.white} />
                  <Text style={s.sendBtnText}>{commLoading ? "Mengirim..." : "Kirim"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}
              style={{ backgroundColor: Colors.stone50, borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: Colors.stone500 }}>
                <Text style={{ color: Colors.primary, fontWeight: "700" }}>Login</Text> untuk berkomentar
              </Text>
            </TouchableOpacity>
          )}

          {comments.length === 0
            ? <Text style={{ textAlign: "center", color: Colors.stone400, fontSize: 14, paddingVertical: 16 }}>Belum ada komentar</Text>
            : <View style={{ gap: 14 }}>
                {comments.map((c: any) => (
                  <View key={c.id} style={{ flexDirection: "row", gap: 10 }}>
                    {c.commenter_avatar
                      ? <Image source={{ uri: c.commenter_avatar }} style={s.commentAvatar} contentFit="cover" />
                      : <View style={s.commentAvatarPH}><Text style={s.commentAvatarText}>{c.commenter.charAt(0).toUpperCase()}</Text></View>
                    }
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.stone700 }}>{c.commenter}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <Text style={{ fontSize: 11, color: Colors.stone400 }}>{formatDate(c.created_at)}</Text>
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
                          <TextInput style={[s.commentInput, { marginBottom: 8 }]} value={editText} onChangeText={setEditText} multiline autoFocus />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity onPress={() => saveEdit(c.id)} style={s.editSave}>
                              <Ionicons name="checkmark" size={14} color={Colors.sageDark} />
                              <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.sageDark }}>Simpan</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setEditingId(null)} style={s.editCancel}>
                              <Ionicons name="close" size={14} color={Colors.stone500} />
                              <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.stone500 }}>Batal</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 13, color: Colors.stone600, lineHeight: 18 }}>{c.body}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
          }
        </Card>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone200 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: Colors.stone800 },
  reportImg: { width: "100%", height: 220 },
  reportTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: Colors.stone800 },
  reportBody: { fontSize: 14, color: Colors.stone600, lineHeight: 22, marginBottom: 14 },
  authorAvatar: { width: 28, height: 28, borderRadius: 14 },
  authorDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  authorDotText: { fontSize: 11, fontWeight: "700", color: Colors.white },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: Colors.stone400 },
  addressBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.stone50, borderRadius: 10, padding: 10 },
  addressText: { flex: 1, fontSize: 13, color: Colors.stone600, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.stone700, marginBottom: 14 },
  adminBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  adminBtnText: { fontSize: 13, fontWeight: "700" },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
  commentAvatarPH: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  commentAvatarText: { fontSize: 12, fontWeight: "700", color: Colors.white },
  commentInput: { borderWidth: 1.5, borderColor: Colors.stone200, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: Colors.stone800, backgroundColor: Colors.white, marginBottom: 8 },
  sendBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: "flex-start" },
  sendBtnText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  editSave: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.sage}20`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editCancel: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.stone100, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
