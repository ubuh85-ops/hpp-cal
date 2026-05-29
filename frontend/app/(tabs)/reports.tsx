import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Header } from "@/src/components/Header";
import { Card, PrimaryButton, SecondaryButton, Section, StatusBadge } from "@/src/components/ui";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Ingredient, Outlet, Overhead, Product, Recipe } from "@/src/data/types";
import { computeProductMetrics, ProductMetrics } from "@/src/data/compute";
import { formatIDR, formatPct } from "@/src/data/format";

export default function ReportsScreen() {
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

  const metrics: ProductMetrics[] = products
    .filter((p) => p.outlet === outlet)
    .map((p) => computeProductMetrics(p, recipes.find((r) => r.productId === p.id), ingredients, overhead))
    .sort((a, b) => b.margin - a.margin);

  const exportCSV = async () => {
    const header = ["Nama Produk", "Kategori", "HPP", "Harga Jual", "Food Cost %", "Profit", "Margin %", "Harga Ideal"].join(",");
    const rows = metrics.map((m) => [
      `"${m.product.nama}"`,
      `"${m.product.kategori}"`,
      Math.round(m.finalHpp),
      m.product.hargaJual,
      m.foodCost.toFixed(2),
      Math.round(m.profit),
      m.margin.toFixed(2),
      Math.round(m.idealPrice),
    ].join(","));
    const csv = [header, ...rows].join("\n");
    try {
      await Share.share({ message: csv, title: `Laporan HPP - ${outlet}` });
    } catch {
      await Clipboard.setStringAsync(csv);
      Alert.alert("Disalin", "CSV disalin ke clipboard.");
    }
  };

  const exportIngredientsCSV = async () => {
    const header = ["Nama", "Kategori", "Supplier", "Satuan Beli", "Jumlah Beli", "Harga Beli", "Satuan Pakai", "Konversi"].join(",");
    const rows = ingredients
      .filter((i) => i.outlet === outlet)
      .map((i) => [`"${i.nama}"`, `"${i.kategori}"`, `"${i.supplier}"`, i.satuanBeli, i.jumlahBeli, i.hargaBeli, i.satuanPakai, i.nilaiKonversi].join(","));
    const csv = [header, ...rows].join("\n");
    try {
      await Share.share({ message: csv, title: `Bahan Baku - ${outlet}` });
    } catch {
      await Clipboard.setStringAsync(csv);
      Alert.alert("Disalin", "CSV disalin ke clipboard.");
    }
  };

  const importIngredientsCSV = async () => {
    let text = "";
    try {
      text = await Clipboard.getStringAsync();
    } catch {
      Alert.alert("Izin Clipboard Ditolak", "Browser menolak akses clipboard. Buka di aplikasi mobile, atau izinkan akses clipboard di pengaturan browser.");
      return;
    }
    if (!text || !text.includes(",")) {
      Alert.alert("Clipboard kosong", "Salin CSV bahan terlebih dahulu, lalu tekan tombol ini.\n\nFormat: Nama,Kategori,Supplier,SatuanBeli,JumlahBeli,HargaBeli,SatuanPakai,Konversi");
      return;
    }
    try {
      const lines = text.trim().split(/\r?\n/);
      const start = lines[0].toLowerCase().includes("nama") ? 1 : 0;
      let added = 0;
      for (let i = start; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 8) continue;
        const ing: Ingredient = {
          id: `ing-${Date.now()}-${i}`,
          nama: cols[0], kategori: cols[1], supplier: cols[2],
          satuanBeli: cols[3], jumlahBeli: parseFloat(cols[4]) || 0,
          hargaBeli: parseFloat(cols[5]) || 0,
          satuanPakai: cols[6], nilaiKonversi: parseFloat(cols[7]) || 1,
          outlet,
        };
        if (ing.nama) { await repo.saveIngredient(ing); added++; }
      }
      Alert.alert("Berhasil", `${added} bahan diimpor.`);
      load();
    } catch (e: any) {
      Alert.alert("Gagal", String(e?.message || e));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Header title="Laporan Profitabilitas" outlet={outlet} onChangeOutlet={async (o) => { await repo.setActiveOutlet(o); setOutlet(o); setOverhead(await repo.getOverhead(o)); }} />
      <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }}>
        <Section title="Aksi">
          <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" }}>
            <PrimaryButton testID="export-report" label="Export Laporan CSV" icon="share-outline" onPress={exportCSV} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: "row", gap: SPACE.sm, marginTop: SPACE.sm }}>
            <SecondaryButton testID="export-ingredients" label="Export Bahan" icon="download-outline" onPress={exportIngredientsCSV} style={{ flex: 1 }} />
            <SecondaryButton testID="import-ingredients" label="Import Bahan" icon="clipboard-outline" onPress={importIngredientsCSV} style={{ flex: 1 }} />
          </View>
          <Text style={styles.hint}>Tips: Import membaca data dari clipboard (paste CSV terlebih dulu).</Text>
        </Section>

        <Section title="Tabel Profitabilitas">
          {metrics.length === 0 ? (
            <Card><Text style={styles.empty}>Belum ada data untuk outlet ini.</Text></Card>
          ) : metrics.map((m) => (
            <Card key={m.product.id} style={{ marginBottom: SPACE.sm }} testID={`report-row-${m.product.id}`}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{m.product.nama}</Text>
                <StatusBadge margin={m.margin} />
              </View>
              <View style={styles.metricGrid}>
                <Mini label="HPP" value={formatIDR(m.finalHpp)} />
                <Mini label="Harga Jual" value={formatIDR(m.product.hargaJual)} accent />
                <Mini label="Food Cost" value={formatPct(m.foodCost)} />
                <Mini label="Profit" value={formatIDR(m.profit)} />
                <Mini label="Margin" value={formatPct(m.margin)} bold />
                <Mini label="Harga Ideal" value={formatIDR(m.idealPrice)} />
              </View>
            </Card>
          ))}
        </Section>

        <Section title="Reset Data">
          <SecondaryButton testID="reset-seed" label="Reset ke Sample Data" icon="refresh-outline" onPress={() => {
            Alert.alert("Reset Data?", "Semua perubahan akan hilang dan kembali ke data contoh.", [
              { text: "Batal", style: "cancel" },
              { text: "Reset", style: "destructive", onPress: async () => { await repo.resetSeed(); load(); } },
            ]);
          }} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Mini({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <View style={miniStyles.box}>
      <Text style={miniStyles.label}>{label}</Text>
      <Text style={[miniStyles.value, bold && { fontWeight: "800" }, accent && { color: COLORS.primary }]}>{value}</Text>
    </View>
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

const miniStyles = StyleSheet.create({
  box: { width: "33%", paddingVertical: 6 },
  label: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" },
  value: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "700", marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: SPACE.sm },
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 20 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, flex: 1 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap" },
});
