import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Field, Input, PrimaryButton, SecondaryButton } from "@/src/components/ui";
import { COLORS, SPACE } from "@/src/theme";
import { makeId, repo } from "@/src/data/repo";
import { Ingredient, Outlet, OUTLETS } from "@/src/data/types";
import { costPerUnit } from "@/src/data/compute";
import { formatIDR, parseNumber } from "@/src/data/format";

export default function IngredientForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");

  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("");
  const [supplier, setSupplier] = useState("");
  const [satuanBeli, setSatuanBeli] = useState("kg");
  const [jumlahBeli, setJumlahBeli] = useState("1");
  const [hargaBeli, setHargaBeli] = useState("");
  const [satuanPakai, setSatuanPakai] = useState("gram");
  const [nilaiKonversi, setNilaiKonversi] = useState("1000");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const o = await repo.getActiveOutlet();
      setOutlet(o);
      if (isNew) return;
      const all = await repo.listIngredients();
      const ing = all.find((x) => x.id === id);
      if (ing) {
        setNama(ing.nama); setKategori(ing.kategori); setSupplier(ing.supplier);
        setSatuanBeli(ing.satuanBeli); setJumlahBeli(String(ing.jumlahBeli));
        setHargaBeli(String(ing.hargaBeli)); setSatuanPakai(ing.satuanPakai);
        setNilaiKonversi(String(ing.nilaiKonversi)); setOutlet(ing.outlet);
      }
    })();
  }, [id, isNew]);

  const preview: Ingredient = {
    id: "preview", nama, kategori, supplier, satuanBeli,
    jumlahBeli: parseNumber(jumlahBeli), hargaBeli: parseNumber(hargaBeli),
    satuanPakai, nilaiKonversi: parseNumber(nilaiKonversi), outlet,
  };
  const pricePerUnit = costPerUnit(preview);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Wajib diisi";
    if (!kategori.trim()) e.kategori = "Wajib diisi";
    if (parseNumber(jumlahBeli) <= 0) e.jumlahBeli = "Harus > 0";
    if (parseNumber(hargaBeli) <= 0) e.hargaBeli = "Harus > 0";
    if (parseNumber(nilaiKonversi) <= 0) e.nilaiKonversi = "Harus > 0";
    if (!satuanBeli.trim()) e.satuanBeli = "Wajib diisi";
    if (!satuanPakai.trim()) e.satuanPakai = "Wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const ing: Ingredient = {
      id: isNew ? makeId("ing") : (id as string),
      nama: nama.trim(), kategori: kategori.trim(), supplier: supplier.trim(),
      satuanBeli: satuanBeli.trim(), jumlahBeli: parseNumber(jumlahBeli),
      hargaBeli: parseNumber(hargaBeli), satuanPakai: satuanPakai.trim(),
      nilaiKonversi: parseNumber(nilaiKonversi), outlet,
    };
    await repo.saveIngredient(ing);
    router.back();
  };

  const remove = () => {
    Alert.alert("Hapus Bahan?", "Bahan akan dihapus permanen.", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await repo.deleteIngredient(id as string); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? "Tambah Bahan" : "Edit Bahan"}</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Field label="Nama Bahan" error={errors.nama}><Input testID="ing-nama" value={nama} onChangeText={setNama} placeholder="contoh: Coffee Beans" /></Field>
          <Field label="Kategori" error={errors.kategori}><Input testID="ing-kategori" value={kategori} onChangeText={setKategori} placeholder="Kopi / Dairy / Protein" /></Field>
          <Field label="Supplier"><Input testID="ing-supplier" value={supplier} onChangeText={setSupplier} placeholder="Nama supplier" /></Field>

          <View style={{ flexDirection: "row", gap: SPACE.md }}>
            <View style={{ flex: 1 }}><Field label="Jumlah Beli" error={errors.jumlahBeli}><Input testID="ing-jumlah" keyboardType="numeric" value={jumlahBeli} onChangeText={setJumlahBeli} /></Field></View>
            <View style={{ flex: 1 }}><Field label="Satuan Beli" error={errors.satuanBeli}><Input testID="ing-satuan-beli" value={satuanBeli} onChangeText={setSatuanBeli} placeholder="kg / liter" /></Field></View>
          </View>
          <Field label="Harga Beli (Rp)" error={errors.hargaBeli}><Input testID="ing-harga" keyboardType="numeric" value={hargaBeli} onChangeText={setHargaBeli} placeholder="contoh: 220000" /></Field>

          <View style={{ flexDirection: "row", gap: SPACE.md }}>
            <View style={{ flex: 1 }}><Field label="Satuan Pakai" error={errors.satuanPakai}><Input testID="ing-satuan-pakai" value={satuanPakai} onChangeText={setSatuanPakai} placeholder="gram / ml / pcs" /></Field></View>
            <View style={{ flex: 1 }}><Field label="Nilai Konversi" error={errors.nilaiKonversi}><Input testID="ing-konversi" keyboardType="numeric" value={nilaiKonversi} onChangeText={setNilaiKonversi} placeholder="1 kg = 1000 g" /></Field></View>
          </View>

          <Field label="Outlet">
            <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" }}>
              {OUTLETS.map((o) => (
                <TouchableOpacity key={o} testID={`ing-outlet-${o}`} onPress={() => setOutlet(o)} style={[styles.chip, outlet === o && styles.chipActive]}>
                  <Text style={[styles.chipText, outlet === o && { color: "#FFF" }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Harga per {satuanPakai || "satuan"}</Text>
            <Text style={styles.previewValue} testID="ing-preview">{formatIDR(pricePerUnit)}</Text>
          </View>

          <PrimaryButton testID="ing-save" label="Simpan" onPress={save} style={{ marginTop: SPACE.md }} />
          {!isNew && <SecondaryButton testID="ing-delete" label="Hapus Bahan" icon="trash-outline" onPress={remove} style={{ marginTop: SPACE.sm, borderColor: COLORS.danger }} />}
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
  preview: { backgroundColor: COLORS.bgMuted, padding: SPACE.md, borderRadius: 12, alignItems: "center", marginTop: SPACE.sm },
  previewLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  previewValue: { fontSize: 26, fontWeight: "900", color: COLORS.primary, marginTop: 4 },
});
