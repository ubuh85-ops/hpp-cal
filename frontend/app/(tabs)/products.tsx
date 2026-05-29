import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/src/components/Header";
import { FAB, StatusBadge } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, Outlet, Overhead, Product, Recipe } from "@/src/data/types";
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
      .filter((p) => p.outlet === outlet)
      .filter((p) => !q || p.nama.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q));
  }, [products, outlet, query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Produk / Menu" outlet={outlet} onChangeOutlet={async (o) => { await repo.setActiveOutlet(o); setOutlet(o); setOverhead(await repo.getOverhead(o)); }} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput testID="search-product" placeholder="Cari produk…" placeholderTextColor={COLORS.textMuted} value={query} onChangeText={setQuery} style={styles.search} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 140 }}
        ItemSeparatorComponent={() => <View style={{ height: SPACE.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada produk untuk outlet ini.</Text>}
        renderItem={({ item }) => {
          const m = computeProductMetrics(item, recipes.find((r) => r.productId === item.id), ingredients, overhead);
          return (
            <TouchableOpacity testID={`product-item-${item.id}`} onPress={() => router.push(`/product/${item.id}`)} activeOpacity={0.8} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.nama}</Text>
                <Text style={styles.meta}>{item.kategori}</Text>
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>HPP</Text>
                    <Text style={styles.metricValue}>{formatIDR(m.finalHpp)}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Harga Jual</Text>
                    <Text style={[styles.metricValue, { color: COLORS.primary }]}>{formatIDR(item.hargaJual)}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 6 }}>
                  <StatusBadge margin={m.margin} testID={`badge-${item.id}`} />
                </View>
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
  empty: { textAlign: "center", color: COLORS.textMuted, paddingVertical: 40 },
  card: { flexDirection: "row", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, alignItems: "center" },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  metricsRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  metric: {},
  metricLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  metricValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
});
