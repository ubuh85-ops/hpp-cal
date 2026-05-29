import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/src/components/Header";
import { Card, Field, Input, Row, Section } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { getPricing, Ingredient, isAvailableAt, Outlet, Overhead, Product, Recipe } from "@/src/data/types";
import { computeProductMetrics, idealPriceByFoodCost, idealPriceByMargin, recipeHPP, overheadPerProduct } from "@/src/data/compute";
import { formatIDR, formatPct, parseNumber, roundToNearest } from "@/src/data/format";

export default function SimulatorScreen() {
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [overhead, setOverhead] = useState<Overhead | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tgtFc, setTgtFc] = useState("30");
  const [tgtMg, setTgtMg] = useState("70");
  const [roundStep, setRoundStep] = useState<number>(500);

  const load = useCallback(async () => {
    const o = await repo.getActiveOutlet();
    setOutlet(o);
    const [p, i, r, oh] = await Promise.all([repo.listProducts(), repo.listIngredients(), repo.listRecipes(), repo.getOverhead(o)]);
    setProducts(p); setIngredients(i); setRecipes(r); setOverhead(oh);
    if (!selectedId) {
      const first = p.find((x) => isAvailableAt(x, o));
      if (first) {
        setSelectedId(first.id);
        const pr = getPricing(first, o);
        setTgtFc(String(pr.targetFoodCost));
        setTgtMg(String(pr.targetMargin));
      }
    }
  }, [selectedId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const outletProducts = products.filter((p) => isAvailableAt(p, outlet));
  const selected = useMemo(() => products.find((p) => p.id === selectedId) || null, [products, selectedId]);
  const recipe = useMemo(() => recipes.find((r) => r.productId === selectedId), [recipes, selectedId]);
  const hppBahan = recipeHPP(recipe, ingredients);
  const oh = overheadPerProduct(overhead);
  const finalHpp = hppBahan + oh;

  const fc = parseNumber(tgtFc);
  const mg = parseNumber(tgtMg);
  const priceFromFc = roundToNearest(idealPriceByFoodCost(finalHpp, fc), roundStep);
  const priceFromMg = roundToNearest(idealPriceByMargin(finalHpp, mg), roundStep);
  const currentMetrics = selected ? computeProductMetrics(selected, outlet, recipe, ingredients, overhead) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Simulasi Harga Ideal" outlet={outlet} onChangeOutlet={async (o) => { await repo.setActiveOutlet(o); setOutlet(o); setOverhead(await repo.getOverhead(o)); setSelectedId(null); }} />
      <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }}>
        <Section title="Pilih Produk">
          <TouchableOpacity testID="simulator-pick-product" style={styles.picker} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickerLabel}>Produk ({outlet})</Text>
              <Text style={styles.pickerValue}>{selected?.nama || "— Pilih produk —"}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Section>

        {selected && currentMetrics && (
          <>
            <Section title="HPP Saat Ini">
              <Card>
                <Row label="HPP Bahan" value={formatIDR(hppBahan)} />
                <Row label="Overhead per produk" value={formatIDR(oh)} />
                <View style={styles.divider} />
                <Row label="Total HPP" value={formatIDR(finalHpp)} bold accent />
                <Row label={`Harga Jual (${outlet})`} value={formatIDR(currentMetrics.pricing.hargaJual)} />
                <Row label="Food Cost" value={formatPct(currentMetrics.foodCost)} />
                <Row label="Margin" value={formatPct(currentMetrics.margin)} bold />
              </Card>
            </Section>

            <Section title="Target Food Cost (%)">
              <Card>
                <Field label="Target Food Cost %">
                  <Input testID="input-target-fc" keyboardType="numeric" value={tgtFc} onChangeText={setTgtFc} placeholder="contoh: 30" />
                </Field>
                <View style={styles.idealBox}>
                  <Text style={styles.idealLabel}>Harga Jual Ideal</Text>
                  <Text style={styles.idealValue} testID="ideal-price-fc">{formatIDR(priceFromFc)}</Text>
                </View>
              </Card>
            </Section>

            <Section title="Target Margin (%)">
              <Card>
                <Field label="Target Margin %">
                  <Input testID="input-target-mg" keyboardType="numeric" value={tgtMg} onChangeText={setTgtMg} placeholder="contoh: 70" />
                </Field>
                <View style={styles.idealBox}>
                  <Text style={styles.idealLabel}>Harga Jual Ideal</Text>
                  <Text style={styles.idealValue} testID="ideal-price-mg">{formatIDR(priceFromMg)}</Text>
                </View>
              </Card>
            </Section>

            <Section title="Pembulatan">
              <View style={{ flexDirection: "row", gap: SPACE.sm }}>
                {[500, 1000].map((s) => (
                  <TouchableOpacity
                    key={s}
                    testID={`round-${s}`}
                    onPress={() => setRoundStep(s)}
                    style={[styles.roundChip, roundStep === s && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                  >
                    <Text style={[styles.roundChipText, roundStep === s && { color: "#FFF" }]}>Rp {s.toLocaleString("id-ID")}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} onPress={() => setPickerOpen(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Pilih Produk ({outlet})</Text>
            <FlatList
              data={outletProducts}
              keyExtractor={(p) => p.id}
              ListEmptyComponent={<Text style={{ color: COLORS.textMuted, textAlign: "center", paddingVertical: 20 }}>Belum ada produk untuk outlet ini.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`pick-product-${item.id}`}
                  style={styles.sheetItem}
                  onPress={() => { setSelectedId(item.id); const pr = getPricing(item, outlet); setTgtFc(String(pr.targetFoodCost)); setTgtMg(String(pr.targetMargin)); setPickerOpen(false); }}
                >
                  <Text style={styles.sheetItemText}>{item.nama}</Text>
                  {selectedId === item.id && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  picker: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, backgroundColor: COLORS.bg },
  pickerLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },
  pickerValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: "700", marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  idealBox: { backgroundColor: COLORS.bgMuted, padding: SPACE.md, borderRadius: RADIUS.card, alignItems: "center", marginTop: SPACE.sm },
  idealLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  idealValue: { fontSize: 28, fontWeight: "900", color: COLORS.primary, marginTop: 4, letterSpacing: -0.5 },
  roundChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.bg },
  roundChipText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACE.lg, maxHeight: "70%" },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACE.md },
  sheetItem: { paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetItemText: { fontSize: 14, color: COLORS.textPrimary },
});
