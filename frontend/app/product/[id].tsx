import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Card, Field, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { makeId, repo } from "@/src/data/repo";
import { defaultPricing, Outlet, OUTLETS, Product, ProductOutletPricing } from "@/src/data/types";
import { parseNumber } from "@/src/data/format";

type OutletForm = {
  available: boolean;
  hargaJual: string;
  targetFoodCost: string;
  targetMargin: string;
};

function pricingToForm(p?: ProductOutletPricing): OutletForm {
  const x = p || defaultPricing();
  return {
    available: x.available,
    hargaJual: String(x.hargaJual || ""),
    targetFoodCost: String(x.targetFoodCost ?? 30),
    targetMargin: String(x.targetMargin ?? 70),
  };
}

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("");
  const [outletForms, setOutletForms] = useState<Record<Outlet, OutletForm>>({
    "FORU Huis": pricingToForm(),
    "FORU The Mozz": pricingToForm(),
    "FORU Bazar": pricingToForm(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      if (isNew) {
        // Pre-enable the currently active outlet by default
        const o = await repo.getActiveOutlet();
        setOutletForms((prev) => ({ ...prev, [o]: { ...prev[o], available: true } }));
        return;
      }
      const all = await repo.listProducts();
      const p = all.find((x) => x.id === id);
      if (p) {
        setNama(p.nama); setKategori(p.kategori);
        setOutletForms({
          "FORU Huis": pricingToForm(p.prices["FORU Huis"]),
          "FORU The Mozz": pricingToForm(p.prices["FORU The Mozz"]),
          "FORU Bazar": pricingToForm(p.prices["FORU Bazar"]),
        });
      }
    })();
  }, [id, isNew]);

  const updateOutlet = (o: Outlet, patch: Partial<OutletForm>) => {
    setOutletForms((prev) => ({ ...prev, [o]: { ...prev[o], ...patch } }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Wajib diisi";
    if (!kategori.trim()) e.kategori = "Wajib diisi";
    const hasAny = OUTLETS.some((o) => outletForms[o].available);
    if (!hasAny) e.outlet = "Aktifkan minimal 1 outlet";
    for (const o of OUTLETS) {
      const f = outletForms[o];
      if (!f.available) continue;
      if (parseNumber(f.hargaJual) <= 0) e[`${o}-harga`] = "Harga harus > 0";
      const fc = parseNumber(f.targetFoodCost);
      const mg = parseNumber(f.targetMargin);
      if (fc < 0 || fc >= 100) e[`${o}-fc`] = "0 – 99";
      if (mg < 0 || mg >= 100) e[`${o}-mg`] = "0 – 99";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      Alert.alert("Periksa Input", "Ada field yang belum valid. Pastikan minimal 1 outlet aktif dan harga > 0.");
      return;
    }
    const prices: Partial<Record<Outlet, ProductOutletPricing>> = {};
    for (const o of OUTLETS) {
      const f = outletForms[o];
      if (!f.available) continue;
      prices[o] = {
        available: true,
        hargaJual: parseNumber(f.hargaJual),
        targetFoodCost: parseNumber(f.targetFoodCost),
        targetMargin: parseNumber(f.targetMargin),
      };
    }
    const p: Product = {
      id: isNew ? makeId("prod") : (id as string),
      nama: nama.trim(), kategori: kategori.trim(), prices,
    };
    await repo.saveProduct(p);
    if (isNew) {
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

          <Text style={styles.sectionTitle}>Harga per Outlet</Text>
          <Text style={styles.hint}>Aktifkan outlet dimana produk dijual, lalu isi harga & target masing-masing.</Text>
          {!!errors.outlet && <Text style={styles.errorText}>{errors.outlet}</Text>}

          {OUTLETS.map((o) => {
            const f = outletForms[o];
            return (
              <Card key={o} style={{ marginBottom: SPACE.md }} testID={`outlet-card-${o}`}>
                <View style={styles.outletHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.outletName}>{o}</Text>
                    <Text style={styles.outletStatus}>{f.available ? "Tersedia di outlet ini" : "Tidak dijual di outlet ini"}</Text>
                  </View>
                  <Switch
                    testID={`outlet-switch-${o}`}
                    value={f.available}
                    onValueChange={(v) => updateOutlet(o, { available: v })}
                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                    thumbColor="#FFF"
                  />
                </View>
                {f.available && (
                  <View style={styles.outletBody}>
                    <Field label="Harga Jual (Rp)" error={errors[`${o}-harga`]}>
                      <Input testID={`prod-harga-${o}`} keyboardType="numeric" value={f.hargaJual} onChangeText={(v) => updateOutlet(o, { hargaJual: v })} placeholder="25000" />
                    </Field>
                    <View style={{ flexDirection: "row", gap: SPACE.md }}>
                      <View style={{ flex: 1 }}>
                        <Field label="Target FC %" error={errors[`${o}-fc`]}>
                          <Input testID={`prod-fc-${o}`} keyboardType="numeric" value={f.targetFoodCost} onChangeText={(v) => updateOutlet(o, { targetFoodCost: v })} />
                        </Field>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Field label="Target Margin %" error={errors[`${o}-mg`]}>
                          <Input testID={`prod-mg-${o}`} keyboardType="numeric" value={f.targetMargin} onChangeText={(v) => updateOutlet(o, { targetMargin: v })} />
                        </Field>
                      </View>
                    </View>
                  </View>
                )}
              </Card>
            );
          })}

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
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginTop: SPACE.sm, marginBottom: 4 },
  hint: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACE.sm },
  errorText: { color: COLORS.danger, fontSize: 12, marginBottom: SPACE.sm },
  outletHeader: { flexDirection: "row", alignItems: "center" },
  outletName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  outletStatus: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  outletBody: { marginTop: SPACE.md, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACE.md },
});
