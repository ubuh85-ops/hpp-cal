import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { COLORS } from "@/src/theme";
import { repo } from "@/src/data/repo";

type IoniconName = keyof typeof Ionicons.glyphMap;

function makeIcon(name: IoniconName) {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
  Icon.displayName = `TabIcon-${name}`;
  return Icon;
}

const ICONS = {
  dashboard: makeIcon("grid"),
  ingredients: makeIcon("leaf"),
  products: makeIcon("cafe"),
  recipes: makeIcon("restaurant"),
  simulator: makeIcon("calculator"),
  bazar: makeIcon("storefront"),
  reports: makeIcon("document-text"),
};

export default function TabsLayout() {
  useEffect(() => {
    repo.ensureSeed();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.bg, borderTopColor: COLORS.border, height: 64, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: ICONS.dashboard }} />
      <Tabs.Screen name="ingredients" options={{ title: "Bahan", tabBarIcon: ICONS.ingredients }} />
      <Tabs.Screen name="products" options={{ title: "Produk", tabBarIcon: ICONS.products }} />
      <Tabs.Screen name="recipes" options={{ title: "Resep", tabBarIcon: ICONS.recipes }} />
      <Tabs.Screen name="simulator" options={{ title: "Simulasi", tabBarIcon: ICONS.simulator }} />
      <Tabs.Screen name="bazar" options={{ title: "Bazar", tabBarIcon: ICONS.bazar }} />
      <Tabs.Screen name="reports" options={{ title: "Laporan", tabBarIcon: ICONS.reports }} />
    </Tabs>
  );
}
