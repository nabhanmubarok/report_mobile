import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { reportApi } from "@/lib/api";
import { getUser, formatDate, getImageUrl } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { StatusBadge, Card, LoadingScreen } from "@/components/ui";
import { Image } from "expo-image";

const STATUS_FILTERS = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "pending" },
  { label: "Disetujui", value: "approved" },
  { label: "Ditolak", value: "rejected" },
];

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => { getUser().then(setUser); }, []);

  const loadReports = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const res = await reportApi.getAll({ ...(statusFilter ? { status: statusFilter } : {}), page: p, limit: 10 });
      const data = res.data.data;
      setReports(reset ? data : (prev) => [...prev, ...data]);
      setHasMore(data.length === 10);
      setTotal(res.data.pagination?.total || 0);
      if (reset) setPage(1);
    } finally { setLoading(false); setRefreshing(false); }
  }, [statusFilter, page]);

  useEffect(() => { setLoading(true); loadReports(true); }, [statusFilter]);

  const filtered = search
    ? reports.filter(r => r.header.toLowerCase().includes(search.toLowerCase()) || r.body.toLowerCase().includes(search.toLowerCase()))
    : reports;

  if (loading) return <LoadingScreen />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Halo, {user?.username || "Warga"} 👋</Text>
          <Text style={s.subGreeting}>Pantau laporan pengaduan</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profil")} style={s.avatarBtn}>
          <Text style={s.avatarText}>{(user?.username || "U").charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        {[
          { num: total, label: "Total", color: Colors.white },
          { num: reports.filter(r => r.status === "pending").length, label: "Menunggu", color: "#FDE68A" },
          { num: reports.filter(r => r.status === "approved").length, label: "Disetujui", color: Colors.sageLight },
        ].map((s2) => (
          <View key={s2.label} style={s.statItem}>
            <Text style={[s.statNum, { color: s2.color }]}>{s2.num}</Text>
            <Text style={s.statLabel}>{s2.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.stone400} style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} placeholder="Cari laporan..." placeholderTextColor={Colors.stone400}
          value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity key={f.value} onPress={() => setStatusFilter(f.value)}
            style={[s.chip, statusFilter === f.value && s.chipActive]}>
            <Text style={[s.chipText, statusFilter === f.value && s.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(true); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
            <Ionicons name="document-text-outline" size={48} color={Colors.stone300} />
            <Text style={{ color: Colors.stone400, fontSize: 15 }}>Tidak ada laporan</Text>
          </View>
        }
        onEndReached={() => { if (hasMore) { setPage(p => p + 1); loadReports(); } }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => {
          const imgUrl = getImageUrl(item.image);
          return (
            <TouchableOpacity onPress={() => router.push(`/laporan/${item.id}` as any)} activeOpacity={0.85}>
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {imgUrl && <Image source={{ uri: imgUrl }} style={s.reportImg} contentFit="cover" />}
                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <Text style={s.cardTitle} numberOfLines={2}>{item.header}</Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <Text style={s.cardDesc} numberOfLines={2}>{item.body}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                    <View style={s.metaItem}><Ionicons name="pricetag-outline" size={12} color={Colors.stone400} /><Text style={s.metaText}>{item.category_name}</Text></View>
                    {item.address && <View style={s.metaItem}><Ionicons name="location-outline" size={12} color={Colors.stone400} /><Text style={s.metaText} numberOfLines={1}>{item.address}</Text></View>}
                    <View style={s.metaItem}><Ionicons name="chatbubble-outline" size={12} color={Colors.stone400} /><Text style={s.metaText}>{item.comment_count}</Text></View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.stone100 }}>
                    <View style={s.metaItem}>
                      {item.author_avatar
                        ? <Image source={{ uri: item.author_avatar }} style={s.authorAvatar} contentFit="cover" />
                        : <View style={s.authorDot}><Text style={s.authorDotText}>{item.author.charAt(0).toUpperCase()}</Text></View>
                      }
                      <Text style={s.metaText}>{item.author}</Text>
                    </View>
                    <Text style={s.metaText}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone200 },
  greeting: { fontSize: 20, fontWeight: "700", color: Colors.stone800 },
  subGreeting: { fontSize: 13, color: Colors.stone400, marginTop: 2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  statsRow: { flexDirection: "row", backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 20 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.stone200, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.stone800 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.stone100, borderWidth: 1.5, borderColor: Colors.stone200 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.stone600 },
  chipTextActive: { color: Colors.white },
  reportImg: { width: "100%", height: 140 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.stone800 },
  cardDesc: { fontSize: 13, color: Colors.stone500, lineHeight: 18, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: Colors.stone400, maxWidth: 120 },
  authorAvatar: { width: 20, height: 20, borderRadius: 10 },
  authorDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  authorDotText: { fontSize: 9, fontWeight: "700", color: Colors.white },
});
