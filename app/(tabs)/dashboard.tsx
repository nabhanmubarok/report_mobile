import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { reportApi } from "@/lib/api";
import { getUser, formatDate, getImageUrl } from "@/lib/auth";
import { Colors } from "@/lib/colors";
import { StatusBadge, Card, LoadingScreen } from "@/components/ui";
import { Image } from "expo-image";

interface Report {
  id: number; header: string; body: string; status: string;
  author: string; category_name: string; address: string | null;
  image: string | null; comment_count: number; created_at: string;
}

const STATUS_FILTERS = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "pending" },
  { label: "Disetujui", value: "approved" },
  { label: "Ditolak", value: "rejected" },
];

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { getUser().then(setUser); }, []);

  const loadReports = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const res = await reportApi.getAll({
        ...(statusFilter ? { status: statusFilter } : {}),
        page: p, limit: 10,
      });
      const data = res.data.data;
      setReports(reset ? data : (prev) => [...prev, ...data]);
      setHasMore(data.length === 10);
      if (reset) setPage(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { setLoading(true); loadReports(true); }, [statusFilter]);

  const onRefresh = () => { setRefreshing(true); loadReports(true); };

  const filtered = search
    ? reports.filter(r =>
        r.header.toLowerCase().includes(search.toLowerCase()) ||
        r.body.toLowerCase().includes(search.toLowerCase()))
    : reports;

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {user?.username || "Warga"} 👋</Text>
          <Text style={styles.subGreeting}>Pantau laporan pengaduan</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profil")} style={styles.avatarBtn}>
          <Text style={styles.avatarText}>{(user?.username || "U").charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.stone400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari laporan..."
          placeholderTextColor={Colors.stone400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            style={[styles.chip, statusFilter === f.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={Colors.stone300} />
            <Text style={styles.emptyText}>Tidak ada laporan</Text>
          </View>
        }
        onEndReached={() => { if (hasMore) { setPage(p => p + 1); loadReports(); } }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => {
          const imgUrl = getImageUrl(item.image);
          return (
            <TouchableOpacity onPress={() => router.push(`/laporan/${item.id}` as any)} activeOpacity={0.85}>
              <Card style={styles.reportCard}>
                {imgUrl && (
                  <Image source={{ uri: imgUrl }} style={styles.reportImg} contentFit="cover" />
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.header}</Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.body}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="pricetag-outline" size={12} color={Colors.stone400} />
                      <Text style={styles.metaText}>{item.category_name}</Text>
                    </View>
                    {item.address && (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color={Colors.stone400} />
                        <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
                      </View>
                    )}
                    <View style={styles.metaItem}>
                      <Ionicons name="chatbubble-outline" size={12} color={Colors.stone400} />
                      <Text style={styles.metaText}>{item.comment_count}</Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <View style={styles.metaItem}>
                      <View style={styles.authorDot}>
                        <Text style={styles.authorDotText}>{item.author.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.authorText}>{item.author}</Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamLight },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.stone200,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: Colors.stone800, fontFamily: "serif" },
  subGreeting: { fontSize: 13, color: Colors.stone400, marginTop: 2 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.stone200, paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.stone800 },
  filterScroll: { marginTop: 10 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.stone100, borderWidth: 1.5, borderColor: Colors.stone200,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.stone600 },
  chipTextActive: { color: Colors.white },
  list: { padding: 16, gap: 12 },
  reportCard: { padding: 0, overflow: "hidden" },
  reportImg: { width: "100%", height: 140 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.stone800 },
  cardDesc: { fontSize: 13, color: Colors.stone500, lineHeight: 18, marginBottom: 10 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: Colors.stone400, maxWidth: 120 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.stone100 },
  authorDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  authorDotText: { fontSize: 9, fontWeight: "700", color: Colors.white },
  authorText: { fontSize: 11, color: Colors.stone400 },
  dateText: { fontSize: 11, color: Colors.stone400 },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.stone400, fontSize: 15 },
});
