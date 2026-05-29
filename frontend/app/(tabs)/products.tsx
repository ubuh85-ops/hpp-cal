import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/src/components/Header";
import { FAB, StatusBadge } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, isAvailableAt, Outlet, Overhead, Product, Recipe } from "@/src/data/types";
import { computeProductMetrics } from "@/src/data/compute";
import { formatIDR } from "@/src/data/format";

export default function ProductsScreen() {
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [overhead, setOverhead] = useState<Overhead | null>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    const o = await repo.getActiveOutlet();
    setOutlet(o);
    const [p, i, r, oh] = await Promise.all([repo.listProducts(), repo.listIngredients(), repo.listRecipes(), repo.getOverhead(o)]);
    setProducts(p); setIngredients(i); setRecipes(r); setOverhead(oh);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => showAll || isAvailableAt(p, outlet))
      .filter((p) => !q || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q));
  }, [products, outlet, query, showAll]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Produk / Menu" outlet={outlet} onChangeOutlet={async (o) => { await repo.setActiveOutlet(o); setOutlet(o); setOverhead(await repo.getOverhead(o)); }} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput testID="search-product" placeholder="Cari produk…" placeholderTextColor={COLORS.textMuted} value={query} onChangeText={setQuery} style={styles.search} />
      </View>
      <View style={styles.filterBar}>
        <TouchableOpacity testID="filter-outlet-only" onPress={() => setShowAll(false)} style={[styles.filterChip, !showAll && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, !showAll && { color: "#FFF" }]}>Outlet ini</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="filter-all" onPress={() => setShowAll(true)} style={[styles.filterChip, showAll && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, showAll && { color: "#FFF" }]}>Semua produk</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 140 }}
        ItemSeparatorComponent={() => <View style={{ height: SPACE.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada produk untuk outlet ini.</Text>}
        renderItem={({ item }) => {
          const available = isAvailableAt(item, outlet);
          const m = computeProductMetrics(item, outlet, recipes.find((r) => r.productId === item.id), ingredients, overhead);
          const outletCount = Object.values(item.prices).filter((pp) => pp?.available).length;
          return (
            <TouchableOpacity testID={`product-item-${item.id}`} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.8} style={[styles.card, !available && styles.cardDisabled]}>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.nama}</Text>
                  <Text style={styles.outletPill}>{outletCount} outlet</Text>
                </View>
                <Text style={styles.meta}>{item.kategori}</Text>
                {available ? (
                  <>
                    <View style={styles.metricsRow}>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>HPP</Text>
                        <Text style={styles.metricValue}>{formatIDR(m.finalHpp)}</Text>
                      </View>
                      <View style={styles.metric}>
                        <Text style={styles.metricLabel}>Harga ({outlet.replace("FORU ", "")})</Text>
                        <Text style={[styles.metricValue, { color: COLORS.primary }]}>{formatIDR(m.pricing.hargaJual)}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 6 }}>
                      <StatusBadge margin={m.margin} testID={`badge-${item.id}`} />
                    </View>
                  </>
                ) : (
                  <View style={styles.notAvail}>
                    <Ionicons name="alert-circle-outline" size={14} color={COLORS.textMuted} />
                    <Text style={styles.notAvailText}>Belum tersedia di {outlet} — tap untuk atur harga</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          );
        }}
      />
      <FAB testID="add-product" onPress={() => router.push("/product/new")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: SPACE.lg, marginTop: SPACE.md, backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.input, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  search: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },
  filterBar: { flexDirection: "row", gap: SPACE.sm, paddingHorizontal: SPACE.lg, marginTop: SPACE.sm },
  filterChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.bg },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: "600" },
  empty: { textAlign: "center", color: COLORS.textMuted, paddingVertical: 40 },
  card: { flexDirection: "row", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, alignItems: "center" },
  cardDisabled: { opacity: 0.65, backgroundColor: COLORS.bgMuted },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, flex: 1 },
  outletPill: { fontSize: 10, color: COLORS.secondary, fontWeight: "700", backgroundColor: "#F4ECE3", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  metricsRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  metric: {},
  metricLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  metricValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  notAvail: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  notAvailText: { fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" },
});
