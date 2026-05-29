import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/src/components/Header";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, Outlet, Overhead, Product, Recipe } from "@/src/data/types";
import { computeProductMetrics } from "@/src/data/compute";
import { formatIDR } from "@/src/data/format";

export default function RecipesScreen() {
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [overhead, setOverhead] = useState<Overhead | null>(null);

  const load = useCallback(async () => {
    const o = await repo.getActiveOutlet();
    setOutlet(o);
    const [p, i, r, oh] = await Promise.all([repo.listProducts(), repo.listIngredients(), repo.listRecipes(), repo.getOverhead(o)]);
    setProducts(p); setIngredients(i); setRecipes(r); setOverhead(oh);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Recipes are shared across outlets. Show ALL products here.
  const list = products;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Resep / Recipe Builder" outlet={outlet} onChangeOutlet={async (o) => { await repo.setActiveOutlet(o); setOutlet(o); setOverhead(await repo.getOverhead(o)); }} />
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: SPACE.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada produk. Tambahkan produk dulu.</Text>}
        renderItem={({ item }) => {
          const recipe = recipes.find((r) => r.productId === item.id);
          const m = computeProductMetrics(item, outlet, recipe, ingredients, overhead);
          const itemCount = recipe?.items.length || 0;
          return (
            <TouchableOpacity testID={`recipe-item-${item.id}`} onPress={() => router.push(`/recipe/${item.id}`)} activeOpacity={0.8} style={styles.card}>
              <View style={[styles.iconWrap, itemCount === 0 && { backgroundColor: COLORS.bgMuted }]}>
                <Ionicons name="restaurant" size={20} color={itemCount === 0 ? COLORS.textMuted : COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.nama}</Text>
                <Text style={styles.meta}>{itemCount} bahan • HPP {formatIDR(m.finalHpp)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  empty: { textAlign: "center", color: COLORS.textMuted, paddingVertical: 40, paddingHorizontal: SPACE.lg },
  card: { flexDirection: "row", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, alignItems: "center", gap: SPACE.md },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FCE7D8", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
