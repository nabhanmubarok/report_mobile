import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { notificationApi } from "@/lib/api";
import { getUser, formatDate } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { LoadingScreen } from "@/components/ui";

export default function NotifikasiScreen() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const u = await getUser();
      if (!u) { router.replace("/(auth)/login"); return; }
      const res = await notificationApi.getAll();
      setNotifs(res.data.data);
      setUnread(res.data.unread_count);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnread(0);
    } catch { Alert.alert("Gagal", "Tidak dapat menandai semua notifikasi"); }
  };

  const handlePress = async (n: any) => {
    if (!n.is_read) {
      await notificationApi.markAsRead(n.id);
      setNotifs(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 } : item));
      setUnread(prev => Math.max(0, prev - 1));
    }
    router.push(`/laporan/${n.report_id}` as any);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Notifikasi</Text>
          {unread > 0 && <Text style={s.subtitle}>{unread} belum dibaca</Text>}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
            <Ionicons name="checkmark-done-outline" size={16} color={Colors.primary} />
            <Text style={s.markAllText}>Tandai semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32, gap: 12 }}>
            <Ionicons name="notifications-off-outline" size={56} color={Colors.stone300} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.stone600 }}>Belum ada notifikasi</Text>
            <Text style={{ fontSize: 14, color: Colors.stone400, textAlign: "center", lineHeight: 20 }}>
              Notifikasi muncul saat admin mengubah status laporan kamu
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePress(item)} activeOpacity={0.85}
            style={[s.item, !item.is_read && s.itemUnread]}>
            <View style={[s.icon, !item.is_read && s.iconUnread]}>
              <Ionicons name={item.is_read ? "notifications-outline" : "notifications"} size={20}
                color={item.is_read ? Colors.stone400 : Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.msg, !item.is_read && s.msgUnread]}>{item.message}</Text>
              <Text style={s.date}>{formatDate(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={s.dot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone200 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.stone800 },
  subtitle: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: "600" },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 8 },
  markAllText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.stone200, elevation: 1 },
  itemUnread: { backgroundColor: `${Colors.primary}08`, borderColor: `${Colors.primary}30`, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.stone100, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconUnread: { backgroundColor: `${Colors.primary}15` },
  msg: { fontSize: 14, color: Colors.stone600, lineHeight: 20 },
  msgUnread: { color: Colors.stone800, fontWeight: "600" },
  date: { fontSize: 12, color: Colors.stone400, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4, flexShrink: 0 },
});
