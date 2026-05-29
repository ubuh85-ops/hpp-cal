import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Field, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { COLORS, SPACE } from "@/src/theme";
import { makeId, repo } from "@/src/data/repo";
import { Outlet, OUTLETS, Product } from "@/src/data/types";
import { parseNumber } from "@/src/data/format";

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("");
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [hargaJual, setHargaJual] = useState("");
  const [tgtFc, setTgtFc] = useState("30");
  const [tgtMg, setTgtMg] = useState("70");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const o = await repo.getActiveOutlet();
      setOutlet(o);
      if (isNew) return;
      const all = await repo.listProducts();
      const p = all.find((x) => x.id === id);
      if (p) {
        setNama(p.nama); setKategori(p.kategori); setOutlet(p.outlet);
        setHargaJual(String(p.hargaJual));
        setTgtFc(String(p.targetFoodCost)); setTgtMg(String(p.targetMargin));
      }
    })();
  }, [id, isNew]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Wajib diisi";
    if (!kategori.trim()) e.kategori = "Wajib diisi";
    if (parseNumber(hargaJual) <= 0) e.hargaJual = "Harus > 0";
    const fc = parseNumber(tgtFc);
    const mg = parseNumber(tgtMg);
    if (fc < 0 || fc >= 100) e.tgtFc = "0 – 99";
    if (mg < 0 || mg >= 100) e.tgtMg = "0 – 99";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const p: Product = {
      id: isNew ? makeId("prod") : (id as string),
      nama: nama.trim(), kategori: kategori.trim(), outlet,
      hargaJual: parseNumber(hargaJual),
      targetFoodCost: parseNumber(tgtFc), targetMargin: parseNumber(tgtMg),
    };
    await repo.saveProduct(p);
    if (isNew) {
      // ensure a recipe row exists so user can immediately add ingredients
      await repo.saveRecipe({ productId: p.id, items: [] });
      router.replace(`/recipe/${p.id}`);
    } else {
      router.back();
    }
  };

  const remove = () => {
    Alert.alert("Hapus Produk?", "Produk dan resepnya akan dihapus.", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await repo.deleteProduct(id as string); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? "Tambah Produk" : "Edit Produk"}</Text>
        {!isNew ? (
          <TouchableOpacity testID="open-recipe" onPress={() => router.push(`/recipe/${id}`)} style={styles.iconBtn}>
            <Ionicons name="restaurant-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Field label="Nama Produk" error={errors.nama}><Input testID="prod-nama" value={nama} onChangeText={setNama} placeholder="contoh: Kopi Susu Aren" /></Field>
          <Field label="Kategori" error={errors.kategori}><Input testID="prod-kategori" value={kategori} onChangeText={setKategori} placeholder="Coffee / Burger / Rice Bowl" /></Field>

          <Field label="Outlet">
            <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" }}>
              {OUTLETS.map((o) => (
                <TouchableOpacity key={o} testID={`prod-outlet-${o}`} onPress={() => setOutlet(o)} style={[styles.chip, outlet === o && styles.chipActive]}>
                  <Text style={[styles.chipText, outlet === o && { color: "#FFF" }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Harga Jual (Rp)" error={errors.hargaJual}><Input testID="prod-harga" keyboardType="numeric" value={hargaJual} onChangeText={setHargaJual} placeholder="contoh: 25000" /></Field>
          <View style={{ flexDirection: "row", gap: SPACE.md }}>
            <View style={{ flex: 1 }}><Field label="Target Food Cost %" error={errors.tgtFc}><Input testID="prod-tgt-fc" keyboardType="numeric" value={tgtFc} onChangeText={setTgtFc} /></Field></View>
            <View style={{ flex: 1 }}><Field label="Target Margin %" error={errors.tgtMg}><Input testID="prod-tgt-mg" keyboardType="numeric" value={tgtMg} onChangeText={setTgtMg} /></Field></View>
          </View>

          <PrimaryButton testID="prod-save" label={isNew ? "Simpan & Atur Resep" : "Simpan"} onPress={save} style={{ marginTop: SPACE.md }} />
          {!isNew && <SecondaryButton testID="prod-delete" label="Hapus Produk" icon="trash-outline" onPress={remove} style={{ marginTop: SPACE.sm, borderColor: COLORS.danger }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.bg },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: "600" },
});
