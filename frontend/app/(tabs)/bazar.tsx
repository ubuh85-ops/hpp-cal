import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Card, FAB, Section } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { BazarEvent } from "@/src/data/types";
import { eventTotalCost, productMixMetrics } from "@/src/data/bazar";
import { formatIDR, formatPct } from "@/src/data/format";

export default function BazarTab() {
  const router = useRouter();
  const [events, setEvents] = useState<BazarEvent[]>([]);
  const [productsCache, setProductsCache] = useState<any[]>([]);
  const [recipesCache, setRecipesCache] = useState<any[]>([]);
  const [ingsCache, setIngsCache] = useState<any[]>([]);

  const load = useCallback(async () => {
    const [es, ps, rs, is] = await Promise.all([repo.listEvents(), repo.listProducts(), repo.listRecipes(), repo.listIngredients()]);
    setEvents(es);
    setProductsCache(ps);
    setRecipesCache(rs);
    setIngsCache(is);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  // Compute ranking using product mix as projected metrics
  const ranked = events.map((e) => {
    const mix = productMixMetrics(e, e.outlet, productsCache, recipesCache, ingsCache, null);
    const opCost = eventTotalCost(e);
    const grossProfit = mix.totalProfit;
    const netProfit = grossProfit - opCost;
    const roi = opCost > 0 ? (netProfit / opCost) * 100 : 0;
    return { e, revenue: mix.totalRevenue, opCost, netProfit, roi };
  });
  const bestRevenue = ranked.length ? [...ranked].sort((a, b) => b.revenue - a.revenue)[0] : null;
  const bestProfit = ranked.length ? [...ranked].sort((a, b) => b.netProfit - a.netProfit)[0] : null;
  const bestROI = ranked.length ? [...ranked].sort((a, b) => b.roi - a.roi)[0] : null;

  const addNew = async () => {
    const id = "evt-" + Date.now().toString(36);
    const newEvent: BazarEvent = {
      id, nama: "Event Baru", lokasi: "", tanggal: new Date().toISOString().slice(0, 10),
      durasiHari: 1, targetPengunjung: 0, jamOperasional: "10:00 - 22:00",
      outlet: "FORU Bazar",
      costs: { sewa: 0, deposit: 0, listrik: 0, transportasi: 0, parkir: 0, gajiStaff: 0, freelancer: 0, promosi: 0, dekorasi: 0, banner: 0, perlengkapan: 0, lainnya: 0 },
      scenarios: { low: { txPerDay: 20, avgSpending: 20000 }, medium: { txPerDay: 50, avgSpending: 25000 }, high: { txPerDay: 100, avgSpending: 30000 } },
      productMix: [],
      targetProfit: 2000000,
      conversionRates: { conservative: 3, normal: 5, aggressive: 10 },
      status: "planning",
    };
    await repo.saveEvent(newEvent);
    router.push(`/bazar/${id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Perencanaan Bazar</Text>
        <Text style={styles.subtitle}>Simulasi omzet, profit, BEP, dan target sebelum event</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {ranked.length > 0 && (
          <View style={{ paddingHorizontal: SPACE.lg, marginTop: SPACE.md }}>
            <Section title="Ranking Event">
              <View style={{ gap: SPACE.sm }}>
                {bestProfit && (
                  <Card testID="rank-profit">
                    <Text style={styles.rankLabel}>🏆 Profit Tertinggi</Text>
                    <Text style={styles.rankName}>{bestProfit.e.nama}</Text>
                    <Text style={styles.rankMeta}>Net Profit {formatIDR(bestProfit.netProfit)}</Text>
                  </Card>
                )}
                {bestRevenue && bestRevenue.e.id !== bestProfit?.e.id && (
                  <Card testID="rank-revenue">
                    <Text style={styles.rankLabel}>💰 Omzet Tertinggi</Text>
                    <Text style={styles.rankName}>{bestRevenue.e.nama}</Text>
                    <Text style={styles.rankMeta}>Omzet {formatIDR(bestRevenue.revenue)}</Text>
                  </Card>
                )}
                {bestROI && bestROI.e.id !== bestProfit?.e.id && bestROI.e.id !== bestRevenue?.e.id && (
                  <Card testID="rank-roi">
                    <Text style={styles.rankLabel}>📈 ROI Terbaik</Text>
                    <Text style={styles.rankName}>{bestROI.e.nama}</Text>
                    <Text style={styles.rankMeta}>ROI {formatPct(bestROI.roi)}</Text>
                  </Card>
                )}
              </View>
            </Section>
          </View>
        )}

        <View style={{ paddingHorizontal: SPACE.lg, marginTop: SPACE.md }}>
          <Section title={`Event (${events.length})`}>
            <View style={{ gap: SPACE.sm }}>
              {events.length === 0 ? (
                <Card><Text style={{ color: COLORS.textMuted, textAlign: "center", padding: SPACE.md }}>Belum ada event. Tap tombol + untuk membuat.</Text></Card>
              ) : ranked.map(({ e, revenue, opCost, netProfit, roi }) => (
                <TouchableOpacity key={e.id} testID={`event-item-${e.id}`} onPress={() => router.push(`/bazar/${e.id}`)} activeOpacity={0.85}>
                  <Card>
                    <View style={styles.evtTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.evtName}>{e.nama}</Text>
                        <Text style={styles.evtMeta}>{e.lokasi || "—"} • {e.durasiHari} hari • {e.outlet}</Text>
                      </View>
                      <View style={[styles.statusPill, e.status === "completed" && { backgroundColor: "#dcfce7" }]}>
                        <Text style={[styles.statusText, e.status === "completed" && { color: "#166534" }]}>{e.status === "completed" ? "Selesai" : "Rencana"}</Text>
                      </View>
                    </View>
                    <View style={styles.evtMetrics}>
                      <Mini label="Omzet" value={formatIDR(revenue)} />
                      <Mini label="Op. Cost" value={formatIDR(opCost)} />
                      <Mini label="Net Profit" value={formatIDR(netProfit)} accent={netProfit >= 0} danger={netProfit < 0} />
                      <Mini label="ROI" value={formatPct(roi)} accent={roi >= 0} danger={roi < 0} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </Section>
        </View>
      </ScrollView>
      <FAB testID="add-event" onPress={addNew} />
    </SafeAreaView>
  );
}

function Mini({ label, value, accent, danger }: { label: string; value: string; accent?: boolean; danger?: boolean }) {
  return (
    <View style={{ width: "50%", paddingVertical: 6 }}>
      <Text style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "800", color: danger ? COLORS.danger : accent ? COLORS.primary : COLORS.textPrimary, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerWrap: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  rankLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  rankName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginTop: 2 },
  rankMeta: { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginTop: 2 },
  evtTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  evtName: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  evtMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.bgMuted, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700", color: COLORS.textSecondary },
  evtMetrics: { flexDirection: "row", flexWrap: "wrap" },
});
