import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Card, Field, Input, PrimaryButton, Row, Section } from "@/src/components/ui";
import { COLORS, SPACE } from "@/src/theme";
import { repo } from "@/src/data/repo";
import { Outlet, OUTLETS, Overhead } from "@/src/data/types";
import { formatIDR, parseNumber } from "@/src/data/format";
import { overheadPerProduct } from "@/src/data/compute";

export default function OverheadScreen() {
  const router = useRouter();
  const [outlet, setOutlet] = useState<Outlet>("FORU Huis");
  const [sewa, setSewa] = useState("0");
  const [gaji, setGaji] = useState("0");
  const [listrik, setListrik] = useState("0");
  const [air, setAir] = useState("0");
  const [internet, setInternet] = useState("0");
  const [marketing, setMarketing] = useState("0");
  const [lain, setLain] = useState("0");
  const [target, setTarget] = useState("3000");

  const load = async (o: Outlet) => {
    const oh = await repo.getOverhead(o);
    if (oh) {
      setSewa(String(oh.sewa)); setGaji(String(oh.gaji));
      setListrik(String(oh.listrik)); setAir(String(oh.air));
      setInternet(String(oh.internet)); setMarketing(String(oh.marketing));
      setLain(String(oh.lain)); setTarget(String(oh.targetSalesPerMonth));
    } else {
      setSewa("0"); setGaji("0"); setListrik("0"); setAir("0");
      setInternet("0"); setMarketing("0"); setLain("0"); setTarget("3000");
    }
  };

  useEffect(() => {
    (async () => {
      const o = await repo.getActiveOutlet();
      setOutlet(o);
      await load(o);
    })();
  }, []);

  const total = parseNumber(sewa) + parseNumber(gaji) + parseNumber(listrik) + parseNumber(air) + parseNumber(internet) + parseNumber(marketing) + parseNumber(lain);
  const ohPreview: Overhead = {
    outlet, sewa: parseNumber(sewa), gaji: parseNumber(gaji),
    listrik: parseNumber(listrik), air: parseNumber(air),
    internet: parseNumber(internet), marketing: parseNumber(marketing),
    lain: parseNumber(lain), targetSalesPerMonth: parseNumber(target),
  };
  const perProduct = overheadPerProduct(ohPreview);

  const save = async () => {
    await repo.saveOverhead(ohPreview);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Biaya Overhead</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <Field label="Outlet">
            <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" }}>
              {OUTLETS.map((o) => (
                <TouchableOpacity key={o} testID={`oh-outlet-${o}`} onPress={async () => { setOutlet(o); await repo.setActiveOutlet(o); await load(o); }} style={[styles.chip, outlet === o && styles.chipActive]}>
                  <Text style={[styles.chipText, outlet === o && { color: "#FFF" }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Section title="Biaya Tetap per Bulan">
            <Field label="Sewa (Rp)"><Input testID="oh-sewa" keyboardType="numeric" value={sewa} onChangeText={setSewa} /></Field>
            <Field label="Gaji (Rp)"><Input testID="oh-gaji" keyboardType="numeric" value={gaji} onChangeText={setGaji} /></Field>
            <Field label="Listrik (Rp)"><Input testID="oh-listrik" keyboardType="numeric" value={listrik} onChangeText={setListrik} /></Field>
            <Field label="Air (Rp)"><Input testID="oh-air" keyboardType="numeric" value={air} onChangeText={setAir} /></Field>
            <Field label="Internet (Rp)"><Input testID="oh-internet" keyboardType="numeric" value={internet} onChangeText={setInternet} /></Field>
            <Field label="Marketing (Rp)"><Input testID="oh-marketing" keyboardType="numeric" value={marketing} onChangeText={setMarketing} /></Field>
            <Field label="Biaya Lain (Rp)"><Input testID="oh-lain" keyboardType="numeric" value={lain} onChangeText={setLain} /></Field>
          </Section>

          <Section title="Alokasi">
            <Field label="Target Penjualan / Bulan (cup atau porsi)"><Input testID="oh-target" keyboardType="numeric" value={target} onChangeText={setTarget} /></Field>
            <Card>
              <Row label="Total Overhead / bulan" value={formatIDR(total)} bold />
              <Row label="Alokasi per produk" value={formatIDR(perProduct)} accent bold />
            </Card>
          </Section>

          <PrimaryButton testID="oh-save" label="Simpan Overhead" onPress={save} />
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
