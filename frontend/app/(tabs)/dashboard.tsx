import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Header } from "@/src/components/Header";
import { KpiCard, Card, Section } from "@/src/components/ui";
import { COLORS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, Outlet, Overhead, Product, Recipe } from "@/src/data/types";
import { computeProductMetrics, ProductMetrics } from "@/src/data/compute";
import { formatIDR, formatPct } from "@/src/data/format";
import { StatusBadge } from "@/src/components/ui";

export default function Dashboard() {
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [overhead, setOverhead] = useState<Overhead | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const o = await repo.getActiveOutlet();
    setOutlet(o);
    const [ings, prods, recs, oh] = await Promise.all([
      repo.listIngredients(),
      repo.listProducts(),
      repo.listRecipes(),
      repo.getOverhead(o),
    ]);
    setIngredients(ings);
    setProducts(prods);
    setRecipes(recs);
    setOverhead(oh);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleOutlet = async (o: Outlet) => {
    await repo.setActiveOutlet(o);
    setOutlet(o);
    setOverhead(await repo.getOverhead(o));
  };

  const outletProducts = products.filter((p) => p.outlet === outlet);
  const metrics: ProductMetrics[] = outletProducts.map((p) =>
    computeProductMetrics(p, recipes.find((r) => r.productId === p.id), ingredients, overhead),
  );

  const totalProducts = outletProducts.length;
  const totalIngredients = ingredients.length;
  const avgFc = metrics.length ? metrics.reduce((s, m) => s + m.foodCost, 0) / metrics.length : 0;
  const avgMargin = metrics.length ? metrics.reduce((s, m) => s + m.margin, 0) / metrics.length : 0;
  const highest = metrics.length ? metrics.reduce((a, b) => (a.margin > b.margin ? a : b)) : null;
  const lowest = metrics.length ? metrics.reduce((a, b) => (a.margin < b.margin ? a : b)) : null;

  const maxFc = Math.max(1, ...metrics.map((m) => m.foodCost));
  const maxMargin = Math.max(1, ...metrics.map((m) => m.margin));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Dashboard" outlet={outlet} onChangeOutlet={handleOutlet} rightAction={{ icon: "settings-outline", onPress: () => router.push("/overhead"), testID: "open-overhead" }} />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={COLORS.primary} />}>
        <View style={styles.kpiRow}>
          <KpiCard label="Total Produk" value={String(totalProducts)} testID="kpi-products" />
          <KpiCard label="Total Bahan" value={String(totalIngredients)} testID="kpi-ingredients" />
        </View>
        <View style={[styles.kpiRow, { marginTop: SPACE.md }]}>
          <KpiCard label="Avg Food Cost" value={formatPct(avgFc)} testID="kpi-foodcost" />
          <KpiCard label="Avg Margin" value={formatPct(avgMargin)} accent testID="kpi-margin" />
        </View>

        <Section title="Margin Tertinggi & Terendah">
          <View style={{ gap: SPACE.sm }}>
            {highest && (
              <Card testID="card-highest">
                <Text style={styles.cardLabel}>🏆 Margin Tertinggi</Text>
                <Text style={styles.cardName}>{highest.product.nama}</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardMeta}>Harga {formatIDR(highest.product.hargaJual)}</Text>
                  <StatusBadge margin={highest.margin} />
                </View>
              </Card>
            )}
            {lowest && lowest.product.id !== highest?.product.id && (
              <Card testID="card-lowest">
                <Text style={styles.cardLabel}>⚠️ Margin Terendah</Text>
                <Text style={styles.cardName}>{lowest.product.nama}</Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardMeta}>Harga {formatIDR(lowest.product.hargaJual)}</Text>
                  <StatusBadge margin={lowest.margin} />
                </View>
              </Card>
            )}
          </View>
        </Section>

        <Section title="Food Cost per Produk">
          <Card>
            {metrics.length === 0 ? <Text style={styles.empty}>Belum ada produk untuk outlet ini.</Text> : metrics.map((m) => (
              <View key={m.product.id} style={styles.barRow}>
                <View style={styles.barRowHeader}>
                  <Text style={styles.barLabel} numberOfLines={1}>{m.product.nama}</Text>
                  <Text style={styles.barValue}>{formatPct(m.foodCost)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(100, (m.foodCost / maxFc) * 100)}%`, backgroundColor: COLORS.secondary }]} />
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Margin per Produk">
          <Card>
            {metrics.length === 0 ? <Text style={styles.empty}>—</Text> : metrics.map((m) => (
              <View key={m.product.id} style={styles.barRow}>
                <View style={styles.barRowHeader}>
                  <Text style={styles.barLabel} numberOfLines={1}>{m.product.nama}</Text>
                  <Text style={styles.barValue}>{formatPct(m.margin)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.min(100, (m.margin / maxMargin) * 100)}%`, backgroundColor: COLORS.primary }]} />
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Pengaturan">
          <TouchableOpacity testID="overhead-link" onPress={() => router.push("/overhead")} activeOpacity={0.8}>
            <Card>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>Biaya Overhead</Text>
                  <Text style={styles.cardMeta}>Alokasi: {overhead ? formatIDR((overhead.sewa + overhead.gaji + overhead.listrik + overhead.air + overhead.internet + overhead.marketing + overhead.lain) / Math.max(1, overhead.targetSalesPerMonth)) : "—"} / produk</Text>
                </View>
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Atur ›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACE.lg, paddingBottom: 120 },
  kpiRow: { flexDirection: "row", gap: SPACE.md },
  cardLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardMeta: { fontSize: 12, color: COLORS.textSecondary },
  empty: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", paddingVertical: SPACE.md },
  barRow: { marginBottom: SPACE.sm },
  barRowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barLabel: { fontSize: 13, color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  barValue: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "700" },
  barTrack: { height: 8, backgroundColor: COLORS.bgMuted, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
});
