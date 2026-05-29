import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACE } from "@/src/theme";
import { OUTLETS, Outlet } from "@/src/data/types";

type Props = {
  title: string;
  outlet: Outlet;
  onChangeOutlet: (o: Outlet) => void;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; testID?: string };
};

export function Header({ title, outlet, onChangeOutlet, rightAction }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} testID="header-title">{title}</Text>
          <TouchableOpacity
            testID="outlet-switcher"
            style={styles.outletBtn}
            onPress={() => setOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="storefront-outline" size={14} color={COLORS.primary} />
            <Text style={styles.outletText}>{outlet}</Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {rightAction && (
          <TouchableOpacity
            testID={rightAction.testID || "header-action"}
            onPress={rightAction.onPress}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Ionicons name={rightAction.icon} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Pilih Outlet</Text>
            <FlatList
              data={OUTLETS}
              keyExtractor={(o) => o}
              renderItem={({ item }) => (
                <TouchableOpacity
                  testID={`outlet-option-${item}`}
                  style={[styles.sheetItem, outlet === item && styles.sheetItemActive]}
                  onPress={() => { onChangeOutlet(item); setOpen(false); }}
                >
                  <Text style={[styles.sheetItemText, outlet === item && { color: COLORS.primary, fontWeight: "700" }]}>{item}</Text>
                  {outlet === item && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.md },
  row: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  outletBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  outletText: { fontSize: 12, color: COLORS.primary, fontWeight: "600", marginHorizontal: 4 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgMuted },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACE.lg, paddingBottom: SPACE.xl + 16 },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary, marginBottom: SPACE.md },
  sheetItem: { paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetItemActive: { },
  sheetItemText: { fontSize: 15, color: COLORS.textPrimary },
});
