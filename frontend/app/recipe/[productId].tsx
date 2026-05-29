import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton, Row, Section, Card } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, Outlet, Overhead, Product, Recipe, RecipeItem } from "@/src/data/types";
import { computeProductMetrics, costPerUnit } from "@/src/data/compute";
import { formatIDR, formatPct, parseNumber } from "@/src/data/format";

export default function RecipeBuilder() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [overhead, setOverhead] = useState<Overhead | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [prods, ings, recs] = await Promise.all([repo.listProducts(), repo.listIngredients(), repo.listRecipes()]);
      const p = prods.find((x) => x.id === productId) || null;
      setProduct(p);
      setIngredients(ings);
      const rec = recs.find((r) => r.productId === productId);
      setItems(rec?.items || []);
      if (p) setOverhead(await repo.getOverhead(p.outlet));
    })();
  }, [productId]);

  const ingredientMap = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const recipe: Recipe = { productId: productId as string, items };
  const metrics = product ? computeProductMetrics(product, recipe, ingredients, overhead) : null;

  const outletIngredients = useMemo(
    () => ingredients.filter((i) => !product || i.outlet === product.outlet),
    [ingredients, product],
  );

  const addIngredient = (ing: Ingredient) => {
    if (items.find((x) => x.ingredientId === ing.id)) return;
    setItems([...items, { ingredientId: ing.id, qty: 1 }]);
    setPickerOpen(false);
  };
  const updateQty = (ingredientId: string, q: string) => {
    setItems(items.map((it) => it.ingredientId === ingredientId ? { ...it, qty: parseNumber(q) } : it));
  };
  const removeItem = (ingredientId: string) => {
    setItems(items.filter((it) => it.ingredientId !== ingredientId));
  };
  const save = async () => {
    await repo.saveRecipe({ productId: productId as string, items });
    router.back();
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Resep</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={{ padding: SPACE.lg, color: COLORS.textMuted }}>Produk tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{product.nama}</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {metrics && (
            <Section title="Ringkasan HPP">
              <Card>
                <Row label="HPP Bahan" value={formatIDR(metrics.finalHpp - (overhead ? (overhead.sewa + overhead.gaji + overhead.listrik + overhead.air + overhead.internet + overhead.marketing + overhead.lain) / Math.max(1, overhead.targetSalesPerMonth) : 0))} />
                <Row label="Overhead per produk" value={formatIDR(metrics.finalHpp - items.reduce((s, it) => { const ing = ingredientMap.get(it.ingredientId); return ing ? s + costPerUnit(ing) * it.qty : s; }, 0))} />
                <View style={styles.divider} />
                <Row label="Total HPP" value={formatIDR(metrics.finalHpp)} bold accent />
                <Row label="Harga Jual" value={formatIDR(product.hargaJual)} />
                <Row label="Food Cost" value={formatPct(metrics.foodCost)} />
                <Row label="Profit Kotor" value={formatIDR(metrics.profit)} />
                <Row label="Margin" value={formatPct(metrics.margin)} bold />
              </Card>
            </Section>
          )}

          <Section title={`Bahan (${items.length})`} action={
            <TouchableOpacity testID="add-recipe-item" onPress={() => setPickerOpen(true)} style={styles.addBtn}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.addBtnText}>Tambah</Text>
            </TouchableOpacity>
          }>
            {items.length === 0 ? (
              <Card><Text style={{ color: COLORS.textMuted, textAlign: "center", paddingVertical: 12 }}>Belum ada bahan dalam resep.</Text></Card>
            ) : items.map((it) => {
              const ing = ingredientMap.get(it.ingredientId);
              if (!ing) return null;
              const lineCost = costPerUnit(ing) * it.qty;
              return (
                <View key={it.ingredientId} style={styles.itemCard} testID={`recipe-line-${ing.id}`}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{ing.nama}</Text>
                    <Text style={styles.itemMeta}>{formatIDR(costPerUnit(ing))} / {ing.satuanPakai}</Text>
                  </View>
                  <View style={styles.qtyWrap}>
                    <TextInput
                      testID={`recipe-qty-${ing.id}`}
                      keyboardType="numeric"
                      value={String(it.qty)}
                      onChangeText={(v) => updateQty(ing.id, v)}
                      style={styles.qtyInput}
                    />
                    <Text style={styles.qtyUnit}>{ing.satuanPakai}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                    <Text style={styles.itemCost}>{formatIDR(lineCost)}</Text>
                    <TouchableOpacity testID={`recipe-remove-${ing.id}`} onPress={() => removeItem(ing.id)}>
                      <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </Section>

          <PrimaryButton testID="recipe-save" label="Simpan Resep" onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Pilih Bahan ({product.outlet})</Text>
            <FlatList
              data={outletIngredients.filter((ing) => !items.find((it) => it.ingredientId === ing.id))}
              keyExtractor={(i) => i.id}
              ListEmptyComponent={<Text style={{ color: COLORS.textMuted, textAlign: "center", paddingVertical: 20 }}>Semua bahan sudah ditambahkan, atau belum ada bahan untuk outlet ini.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity testID={`pick-ing-${item.id}`} onPress={() => addIngredient(item)} style={styles.sheetItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetItemText}>{item.nama}</Text>
                    <Text style={styles.sheetItemMeta}>{formatIDR(costPerUnit(item))} / {item.satuanPakai}</Text>
                  </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, flex: 1, textAlign: "center" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700", marginLeft: 4 },
  itemCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, marginBottom: SPACE.sm },
  itemName: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  itemMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  qtyWrap: { alignItems: "center", marginHorizontal: 6 },
  qtyInput: { width: 64, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 6, textAlign: "center", color: COLORS.textPrimary, fontWeight: "700" },
  qtyUnit: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  itemCost: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACE.lg, maxHeight: "70%" },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACE.md },
  sheetItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetItemText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "600" },
  sheetItemMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
