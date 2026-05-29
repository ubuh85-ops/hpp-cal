import { View, Text, TouchableOpacity, StyleSheet, TextInput, TextInputProps, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACE } from "@/src/theme";

export function KpiCard({ label, value, accent, testID }: { label: string; value: string; accent?: boolean; testID?: string }) {
  return (
    <View style={[styles.kpi, accent && { backgroundColor: COLORS.primary }]} testID={testID}>
      <Text style={[styles.kpiLabel, accent && { color: "rgba(255,255,255,0.85)" }]}>{label}</Text>
      <Text style={[styles.kpiValue, accent && { color: "#FFF" }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export function FAB({ onPress, testID, icon = "add" }: { onPress: () => void; testID?: string; icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap }) {
  return (
    <TouchableOpacity testID={testID || "fab"} style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={28} color="#FFF" />
    </TouchableOpacity>
  );
}

export function StatusBadge({ margin, testID }: { margin: number; testID?: string }) {
  let bg = COLORS.badBg, fg = COLORS.badText, label = "Rendah";
  if (margin >= 60) { bg = COLORS.goodBg; fg = COLORS.goodText; label = "Sehat"; }
  else if (margin >= 40) { bg = COLORS.warnBg; fg = COLORS.warnText; label = "Cukup"; }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]} testID={testID}>
      <Text style={[styles.badgeText, { color: fg }]}>{label} • {margin.toFixed(1)}%</Text>
    </View>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: SPACE.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps & { testID?: string }) {
  return (
    <TextInput
      placeholderTextColor={COLORS.textMuted}
      style={[styles.input, props.style]}
      {...props}
    />
  );
}

export function PrimaryButton({ label, onPress, testID, style, disabled, icon }: { label: string; onPress: () => void; testID?: string; style?: ViewStyle; disabled?: boolean; icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap }) {
  return (
    <TouchableOpacity testID={testID} disabled={disabled} style={[styles.primaryBtn, disabled && { opacity: 0.5 }, style]} onPress={onPress} activeOpacity={0.85}>
      {icon && <Ionicons name={icon} size={18} color="#FFF" style={{ marginRight: 6 }} />}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, testID, style, icon }: { label: string; onPress: () => void; testID?: string; style?: ViewStyle; icon?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap }) {
  return (
    <TouchableOpacity testID={testID} style={[styles.secondaryBtn, style]} onPress={onPress} activeOpacity={0.85}>
      {icon && <Ionicons name={icon} size={18} color={COLORS.primary} style={{ marginRight: 6 }} />}
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={{ marginBottom: SPACE.lg }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: ViewStyle; testID?: string }) {
  return <View testID={testID} style={[styles.card, style]}>{children}</View>;
}

export function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: "800", fontSize: 16 }, accent && { color: COLORS.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpi: { flex: 1, backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.card, padding: SPACE.md, borderWidth: 1, borderColor: COLORS.border, minHeight: 92, justifyContent: "space-between" },
  kpiLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  kpiValue: { fontSize: 22, color: COLORS.textPrimary, fontWeight: "800", letterSpacing: -0.5, marginTop: 6 },
  fab: { position: "absolute", right: 20, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.input, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.bg },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.button, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  primaryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  secondaryBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.button, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", backgroundColor: "#FFF" },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary },
  rowValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "600" },
});
