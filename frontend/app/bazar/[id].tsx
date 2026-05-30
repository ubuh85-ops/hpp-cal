import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal, FlatList, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Card, Field, Input, PrimaryButton, SecondaryButton, Section, Row, KpiCard } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { BazarEvent, isAvailableAt, Outlet, OUTLETS, Product, Recipe, Ingredient, Overhead } from "@/src/data/types";
import { avgFoodCostPct, bepRevenue, computeScenario, eventCostBreakdown, eventTotalCost, productMixMetrics, targetOmzet, visitorProjection } from "@/src/data/bazar";
import { formatIDR, formatPct, parseNumber } from "@/src/data/format";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<BazarEvent | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [overhead, setOverhead] = useState<Overhead | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [e, ps, rs, is] = await Promise.all([repo.getEvent(id as string), repo.listProducts(), repo.listRecipes(), repo.listIngredients()]);
      if (e) {
        setEvent(e);
        setOverhead(await repo.getOverhead(e.outlet));
      }
      setProducts(ps); setRecipes(rs); setIngredients(is);
    })();
  }, [id]);

  const update = (patch: Partial<BazarEvent>) => setEvent((p) => p ? { ...p, ...patch } : p);
  const updateCost = (key: keyof BazarEvent["costs"], val: string) => setEvent((p) => p ? { ...p, costs: { ...p.costs, [key]: parseNumber(val) } } : p);
  const updateScenario = (level: "low" | "medium" | "high", key: "txPerDay" | "avgSpending", val: string) =>
    setEvent((p) => p ? { ...p, scenarios: { ...p.scenarios, [level]: { ...p.scenarios[level], [key]: parseNumber(val) } } } : p);

  const opCost = event ? eventTotalCost(event) : 0;
  const mix = useMemo(() => event ? productMixMetrics(event, event.outlet, products, recipes, ingredients, overhead) : null, [event, products, recipes, ingredients, overhead]);
  const fcPct = useMemo(() => {
    if (!event) return 0;
    if (mix && mix.totalRevenue > 0) return (mix.totalHpp / mix.totalRevenue) * 100;
    return avgFoodCostPct(event.outlet, products, recipes, ingredients, overhead);
  }, [event, mix, products, recipes, ingredients, overhead]);
  const marginAvg = 100 - fcPct;

  const scenarios = useMemo(() => {
    if (!event) return null;
    return {
      low: computeScenario("Low", event.scenarios.low.txPerDay, event.scenarios.low.avgSpending, event.durasiHari, opCost, fcPct),
      medium: computeScenario("Medium", event.scenarios.medium.txPerDay, event.scenarios.medium.avgSpending, event.durasiHari, opCost, fcPct),
      high: computeScenario("High", event.scenarios.high.txPerDay, event.scenarios.high.avgSpending, event.durasiHari, opCost, fcPct),
    };
  }, [event, opCost, fcPct]);

  const projected = scenarios?.medium;

  const bep = bepRevenue(opCost, marginAvg);
  const avgSpendMed = event ? event.scenarios.medium.avgSpending : 0;
  const bepTx = avgSpendMed > 0 ? Math.ceil(bep / avgSpendMed) : 0;
  const bepProducts = mix && mix.totalQty > 0 && mix.totalRevenue > 0 ? Math.ceil((bep / mix.totalRevenue) * mix.totalQty) : 0;

  const reqOmzet = event ? targetOmzet(opCost, event.targetProfit, marginAvg) : 0;
  const reqTx = avgSpendMed > 0 ? Math.ceil(reqOmzet / avgSpendMed) : 0;
  const reqProducts = mix && mix.totalQty > 0 && mix.totalRevenue > 0 ? Math.ceil((reqOmzet / mix.totalRevenue) * mix.totalQty) : 0;

  const convAvgSpend = event?.scenarios.medium.avgSpending || 25000;
  const convCons = event ? visitorProjection(event.targetPengunjung, event.conversionRates.conservative, convAvgSpend) : { buyers: 0, omzet: 0 };
  const convNorm = event ? visitorProjection(event.targetPengunjung, event.conversionRates.normal, convAvgSpend) : { buyers: 0, omzet: 0 };
  const convAgg = event ? visitorProjection(event.targetPengunjung, event.conversionRates.aggressive, convAvgSpend) : { buyers: 0, omzet: 0 };

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}><Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} /></TouchableOpacity>
          <Text style={styles.title}>Event</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ padding: SPACE.lg, color: COLORS.textMuted }}>Memuat...</Text>
      </SafeAreaView>
    );
  }

  const save = async () => {
    await repo.saveEvent(event);
    router.back();
  };
  const remove = () => {
    Alert.alert("Hapus Event?", "Event akan dihapus permanen.", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await repo.deleteEvent(event.id); router.back(); } },
    ]);
  };
  const toggleComplete = async () => {
    update({ status: event.status === "completed" ? "planning" : "completed" });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{event.nama || "Event"}</Text>
        <TouchableOpacity testID="toggle-complete" onPress={toggleComplete} style={styles.iconBtn}>
          <Ionicons name={event.status === "completed" ? "checkmark-done-circle" : "checkmark-circle-outline"} size={22} color={event.status === "completed" ? COLORS.success : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">

          {/* Profitability Dashboard cards */}
          <View style={{ flexDirection: "row", gap: SPACE.md }}>
            <KpiCard label="Op. Cost" value={formatIDR(opCost)} testID="kpi-opcost" />
            <KpiCard label="Proj. Revenue" value={formatIDR(projected?.omzetEvent || 0)} testID="kpi-revenue" />
          </View>
          <View style={{ flexDirection: "row", gap: SPACE.md, marginTop: SPACE.md }}>
            <KpiCard label="Gross Profit" value={formatIDR(projected?.grossProfit || 0)} testID="kpi-gross" />
            <KpiCard label="Net Profit" value={formatIDR(projected?.netProfit || 0)} accent testID="kpi-net" />
          </View>
          <View style={{ flexDirection: "row", gap: SPACE.md, marginTop: SPACE.md }}>
            <KpiCard label="BEP Revenue" value={formatIDR(bep)} testID="kpi-bep" />
            <KpiCard label="ROI" value={formatPct(projected?.roiPct || 0)} testID="kpi-roi" />
          </View>

          <Section title="Informasi Event">
            <Field label="Nama Event"><Input testID="evt-nama" value={event.nama} onChangeText={(v) => update({ nama: v })} /></Field>
            <Field label="Lokasi"><Input testID="evt-lokasi" value={event.lokasi} onChangeText={(v) => update({ lokasi: v })} placeholder="contoh: SMP As Saadah" /></Field>
            <View style={{ flexDirection: "row", gap: SPACE.md }}>
              <View style={{ flex: 1 }}><Field label="Tanggal"><Input testID="evt-tanggal" value={event.tanggal} onChangeText={(v) => update({ tanggal: v })} placeholder="YYYY-MM-DD" /></Field></View>
              <View style={{ flex: 1 }}><Field label="Durasi (hari)"><Input testID="evt-durasi" keyboardType="numeric" value={String(event.durasiHari)} onChangeText={(v) => update({ durasiHari: parseNumber(v) || 1 })} /></Field></View>
            </View>
            <View style={{ flexDirection: "row", gap: SPACE.md }}>
              <View style={{ flex: 1 }}><Field label="Target Pengunjung"><Input testID="evt-pengunjung" keyboardType="numeric" value={String(event.targetPengunjung)} onChangeText={(v) => update({ targetPengunjung: parseNumber(v) })} /></Field></View>
              <View style={{ flex: 1 }}><Field label="Jam Operasional"><Input testID="evt-jam" value={event.jamOperasional} onChangeText={(v) => update({ jamOperasional: v })} placeholder="08:00 - 22:00" /></Field></View>
            </View>
            <Field label="Outlet (sumber harga & resep)">
              <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" }}>
                {OUTLETS.map((o) => (
                  <TouchableOpacity key={o} testID={`evt-outlet-${o}`} onPress={async () => { update({ outlet: o }); setOverhead(await repo.getOverhead(o)); }} style={[styles.chip, event.outlet === o && styles.chipActive]}>
                    <Text style={[styles.chipText, event.outlet === o && { color: "#FFF" }]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Field>
          </Section>

          <Section title={`Operational Cost — Total ${formatIDR(opCost)}`}>
            <Card>
              {([
                ["sewa", "Sewa Tenant"], ["deposit", "Deposit"], ["listrik", "Listrik"],
                ["transportasi", "Transportasi"], ["parkir", "Parkir"], ["gajiStaff", "Gaji Staff"],
                ["freelancer", "Freelancer"], ["promosi", "Promosi"], ["dekorasi", "Dekorasi Booth"],
                ["banner", "Banner"], ["perlengkapan", "Perlengkapan"], ["lainnya", "Lainnya"],
              ] as [keyof BazarEvent["costs"], string][]).map(([k, label]) => (
                <View key={k} style={styles.costRow}>
                  <Text style={styles.costLabel}>{label}</Text>
                  <TextInput
                    testID={`cost-${k}`}
                    keyboardType="numeric"
                    value={String(event.costs[k] || "")}
                    onChangeText={(v) => updateCost(k, v)}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.costInput}
                  />
                </View>
              ))}
            </Card>
          </Section>

          <Section title="Skenario Penjualan">
            {(["low", "medium", "high"] as const).map((lv) => {
              const s = scenarios![lv];
              const colorAccent = lv === "low" ? COLORS.warning : lv === "medium" ? COLORS.accent : COLORS.success;
              return (
                <Card key={lv} style={{ marginBottom: SPACE.sm }} testID={`scenario-${lv}`}>
                  <View style={styles.scenarioHead}>
                    <View style={[styles.scenarioDot, { backgroundColor: colorAccent }]} />
                    <Text style={styles.scenarioTitle}>{lv === "low" ? "Low Scenario" : lv === "medium" ? "Medium Scenario" : "High Scenario"}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: SPACE.md }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Tx / hari"><Input testID={`scn-${lv}-tx`} keyboardType="numeric" value={String(event.scenarios[lv].txPerDay)} onChangeText={(v) => updateScenario(lv, "txPerDay", v)} /></Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Avg / tx (Rp)"><Input testID={`scn-${lv}-avg`} keyboardType="numeric" value={String(event.scenarios[lv].avgSpending)} onChangeText={(v) => updateScenario(lv, "avgSpending", v)} /></Field>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <Row label="Omzet harian" value={formatIDR(s.omzetHarian)} />
                  <Row label="Omzet event" value={formatIDR(s.omzetEvent)} bold accent />
                  <Row label={`COGS (FC ${formatPct(fcPct)})`} value={formatIDR(s.cogs)} />
                  <Row label="Gross Profit" value={formatIDR(s.grossProfit)} />
                  <Row label="Operational Cost" value={"- " + formatIDR(opCost)} />
                  <Row label="Net Profit" value={formatIDR(s.netProfit)} bold accent />
                  <Row label="ROI" value={formatPct(s.roiPct)} />
                </Card>
              );
            })}
          </Section>

          {/* Scenario comparison chart */}
          <Section title="Perbandingan Skenario">
            <Card>
              {(["low", "medium", "high"] as const).map((lv) => {
                const s = scenarios![lv];
                const max = Math.max(1, scenarios!.high.omzetEvent);
                return (
                  <View key={lv} style={{ marginBottom: 10 }}>
                    <View style={styles.barRowHead}>
                      <Text style={styles.barLbl}>{lv === "low" ? "Low" : lv === "medium" ? "Medium" : "High"}</Text>
                      <Text style={styles.barVal}>{formatIDR(s.omzetEvent)} • Net {formatIDR(s.netProfit)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${(s.omzetEvent / max) * 100}%`, backgroundColor: COLORS.secondary }]} />
                    </View>
                    <View style={[styles.barTrack, { marginTop: 4 }]}>
                      <View style={[styles.barFill, { width: `${Math.max(0, (s.netProfit / max) * 100)}%`, backgroundColor: s.netProfit >= 0 ? COLORS.primary : COLORS.danger }]} />
                    </View>
                  </View>
                );
              })}
            </Card>
          </Section>

          <Section title={`Product Mix (${event.productMix.length} produk)`} action={
            <TouchableOpacity testID="add-mix-product" onPress={() => setProductPickerOpen(true)} style={styles.addBtn}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.addBtnText}>Tambah</Text>
            </TouchableOpacity>
          }>
            {event.productMix.length === 0 ? (
              <Card><Text style={{ color: COLORS.textMuted, textAlign: "center", padding: SPACE.md }}>Belum ada produk dalam mix.</Text></Card>
            ) : mix!.rows.map((r) => (
              <View key={r.productId} style={styles.mixRow} testID={`mix-${r.productId}`}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mixName}>{r.nama}</Text>
                  <Text style={styles.mixMeta}>Harga {formatIDR(r.hargaJual)} • HPP {formatIDR(r.hpp)} • Margin {formatPct(r.marginPct)}</Text>
                </View>
                <View style={{ alignItems: "center", marginHorizontal: 6 }}>
                  <TextInput
                    testID={`mix-qty-${r.productId}`}
                    keyboardType="numeric"
                    value={String(r.qty)}
                    onChangeText={(v) => update({ productMix: event.productMix.map((it) => it.productId === r.productId ? { ...it, qty: parseNumber(v) } : it) })}
                    style={styles.qtyInput}
                  />
                  <Text style={styles.qtyUnit}>pcs</Text>
                </View>
                <View style={{ alignItems: "flex-end", marginLeft: 4 }}>
                  <Text style={styles.mixRev}>{formatIDR(r.revenue)}</Text>
                  <TouchableOpacity testID={`mix-remove-${r.productId}`} onPress={() => update({ productMix: event.productMix.filter((it) => it.productId !== r.productId) })}>
                    <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {mix && event.productMix.length > 0 && (
              <Card style={{ marginTop: SPACE.sm }}>
                <Row label="Total Qty" value={String(mix.totalQty) + " pcs"} />
                <Row label="Total Revenue" value={formatIDR(mix.totalRevenue)} />
                <Row label="Total HPP" value={formatIDR(mix.totalHpp)} />
                <Row label="Gross Profit" value={formatIDR(mix.totalProfit)} bold accent />
                <Row label="Avg Margin" value={formatPct(mix.avgMargin)} />
              </Card>
            )}
          </Section>

          {/* Product Contribution chart */}
          {mix && mix.rows.length > 0 && (
            <Section title="Kontribusi Produk">
              <Card>
                {mix.rows.map((r) => (
                  <View key={r.productId} style={{ marginBottom: 8 }}>
                    <View style={styles.barRowHead}>
                      <Text style={styles.barLbl} numberOfLines={1}>{r.nama}</Text>
                      <Text style={styles.barVal}>{formatPct((r.revenue / Math.max(1, mix.totalRevenue)) * 100)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${(r.revenue / Math.max(1, mix.totalRevenue)) * 100}%`, backgroundColor: COLORS.primary }]} />
                    </View>
                  </View>
                ))}
              </Card>
            </Section>
          )}

          <Section title="Break Even Point">
            <Card>
              <Row label={`Avg Margin (${mix && mix.totalRevenue > 0 ? "dari Mix" : "dari Outlet"})`} value={formatPct(marginAvg)} />
              <Row label="BEP Revenue" value={formatIDR(bep)} bold accent />
              <Row label={`BEP Transaksi (@${formatIDR(avgSpendMed)})`} value={`${bepTx} tx`} />
              {bepProducts > 0 && <Row label="BEP Produk (estimasi)" value={`${bepProducts} pcs`} />}
            </Card>
          </Section>

          <Section title="Target Omzet Planner">
            <Card>
              <Field label="Target Net Profit (Rp)">
                <Input testID="target-profit" keyboardType="numeric" value={String(event.targetProfit)} onChangeText={(v) => update({ targetProfit: parseNumber(v) })} />
              </Field>
              <Row label="Omzet Diperlukan" value={formatIDR(reqOmzet)} bold accent />
              <Row label={`Transaksi (@${formatIDR(avgSpendMed)})`} value={`${reqTx} tx`} />
              {reqProducts > 0 && <Row label="Produk Diperlukan" value={`${reqProducts} pcs`} />}
            </Card>
          </Section>

          <Section title="Analisis Konversi Pengunjung">
            <Card>
              <Row label="Target Pengunjung" value={`${event.targetPengunjung.toLocaleString("id-ID")} orang`} />
              <Row label={`Avg Spending`} value={formatIDR(convAvgSpend)} />
              <View style={styles.divider} />
              <ConvLine title="Konservatif" rate={event.conversionRates.conservative} buyers={convCons.buyers} omzet={convCons.omzet} onChange={(v) => update({ conversionRates: { ...event.conversionRates, conservative: parseNumber(v) } })} testID="conv-cons" />
              <ConvLine title="Normal" rate={event.conversionRates.normal} buyers={convNorm.buyers} omzet={convNorm.omzet} onChange={(v) => update({ conversionRates: { ...event.conversionRates, normal: parseNumber(v) } })} testID="conv-norm" />
              <ConvLine title="Agresif" rate={event.conversionRates.aggressive} buyers={convAgg.buyers} omzet={convAgg.omzet} onChange={(v) => update({ conversionRates: { ...event.conversionRates, aggressive: parseNumber(v) } })} testID="conv-agg" />
            </Card>
          </Section>

          <Section title="Breakdown Biaya">
            <Card>
              {eventCostBreakdown(event).map((c) => (
                <View key={c.label} style={{ marginBottom: 6 }}>
                  <View style={styles.barRowHead}>
                    <Text style={styles.barLbl}>{c.label}</Text>
                    <Text style={styles.barVal}>{formatIDR(c.value)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(c.value / Math.max(1, opCost)) * 100}%`, backgroundColor: COLORS.accent }]} />
                  </View>
                </View>
              ))}
              {eventCostBreakdown(event).length === 0 && <Text style={{ color: COLORS.textMuted, textAlign: "center" }}>Belum ada biaya tercatat.</Text>}
            </Card>
          </Section>

          {event.status === "completed" && (
            <Section title="Hasil Aktual (Opsional)">
              <Card>
                <Field label="Revenue Aktual"><Input testID="actual-revenue" keyboardType="numeric" value={String(event.actualRevenue || "")} onChangeText={(v) => update({ actualRevenue: parseNumber(v) })} /></Field>
                <Field label="Op. Cost Aktual"><Input testID="actual-cost" keyboardType="numeric" value={String(event.actualCost || "")} onChangeText={(v) => update({ actualCost: parseNumber(v) })} /></Field>
              </Card>
            </Section>
          )}

          <PrimaryButton testID="evt-save" label="Simpan Event" onPress={save} style={{ marginTop: SPACE.md }} />
          <SecondaryButton testID="evt-delete" label="Hapus Event" icon="trash-outline" onPress={remove} style={{ marginTop: SPACE.sm, borderColor: COLORS.danger }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={productPickerOpen} transparent animationType="fade" onRequestClose={() => setProductPickerOpen(false)}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={() => setProductPickerOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Pilih Produk ({event.outlet})</Text>
            <FlatList
              data={products.filter((p) => isAvailableAt(p, event.outlet) && !event.productMix.find((m) => m.productId === p.id))}
              keyExtractor={(p) => p.id}
              ListEmptyComponent={<Text style={{ color: COLORS.textMuted, textAlign: "center", padding: 20 }}>Tidak ada produk tersedia.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity testID={`pick-mix-${item.id}`} onPress={() => { update({ productMix: [...event.productMix, { productId: item.id, qty: 10 }] }); setProductPickerOpen(false); }} style={styles.sheetItem}>
                  <Text style={styles.sheetItemText}>{item.nama}</Text>
                  <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function ConvLine({ title, rate, buyers, omzet, onChange, testID }: { title: string; rate: number; buyers: number; omzet: number; onChange: (v: string) => void; testID?: string }) {
  return (
    <View style={styles.convRow} testID={testID}>
      <View style={{ flex: 1 }}>
        <Text style={styles.convTitle}>{title}</Text>
        <Text style={styles.convMeta}>{Math.round(buyers).toLocaleString("id-ID")} pembeli • {formatIDR(omzet)}</Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <TextInput keyboardType="numeric" value={String(rate)} onChangeText={onChange} style={styles.convInput} />
        <Text style={{ fontSize: 10, color: COLORS.textMuted }}>%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, flex: 1, textAlign: "center" },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.bg },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: "600" },
  costRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  costLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  costInput: { width: 140, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, textAlign: "right", fontSize: 13, color: COLORS.textPrimary, fontWeight: "700" },
  scenarioHead: { flexDirection: "row", alignItems: "center", marginBottom: SPACE.sm },
  scenarioDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  scenarioTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  barRowHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barLbl: { fontSize: 12, color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  barVal: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "700" },
  barTrack: { height: 8, backgroundColor: COLORS.bgMuted, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700", marginLeft: 4 },
  mixRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, marginBottom: SPACE.sm },
  mixName: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  mixMeta: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  qtyInput: { width: 56, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 6, textAlign: "center", color: COLORS.textPrimary, fontWeight: "700" },
  qtyUnit: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  mixRev: { fontSize: 12, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  convRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  convTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  convMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  convInput: { width: 56, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 6, textAlign: "center", color: COLORS.textPrimary, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACE.lg, maxHeight: "70%" },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACE.md },
  sheetItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetItemText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "600" },
});
