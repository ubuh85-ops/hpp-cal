import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/src/components/Header";
import { FAB } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, Outlet } from "@/src/data/types";
import { costPerUnit } from "@/src/data/compute";
import { formatIDR } from "@/src/data/format";

export default function IngredientsScreen() {
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [items, setItems] = useState<Ingredient[]>([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setOutlet(await repo.getActiveOutlet());
    setItems(await repo.listIngredients());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => i.outlet === outlet)
      .filter((i) => !q || i.nama.toLowerCase().includes(q) || i.kategori.toLowerCase().includes(q));
  }, [items, outlet, query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Bahan Baku" outlet={outlet} onChangeOutlet={async (o) => { await repo.setActiveOutlet(o); setOutlet(o); }} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          testID="search-ingredient"
          placeholder="Cari bahan…"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 140 }}
        ItemSeparatorComponent={() => <View style={{ height: SPACE.sm }} />}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada bahan. Tambah dengan tombol +.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`ingredient-item-${item.id}`}
            onPress={() => router.push(`/ingredient/${item.id}`)}
            activeOpacity={0.8}
            style={styles.card}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.nama}</Text>
              <Text style={styles.meta}>{item.kategori} • {item.supplier}</Text>
              <Text style={styles.meta}>{item.jumlahBeli} {item.satuanBeli} = {formatIDR(item.hargaBeli)}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.priceLabel}>per {item.satuanPakai}</Text>
              <Text style={styles.priceValue}>{formatIDR(costPerUnit(item))}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <FAB testID="add-ingredient" onPress={() => router.push("/ingredient/new")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: SPACE.lg, marginTop: SPACE.md, backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.input, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  search: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },
  empty: { textAlign: "center", color: COLORS.textMuted, paddingVertical: 40 },
  card: { flexDirection: "row", backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: SPACE.md, alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  right: { alignItems: "flex-end" },
  priceLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  priceValue: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
});
