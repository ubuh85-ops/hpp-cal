export type Outlet = "FORU Huis" | "FORU The Mozz" | "FORU Bazar";

export const OUTLETS: Outlet[] = ["FORU Huis", "FORU The Mozz", "FORU Bazar"];

export type Ingredient = {
  id: string;
  nama: string;
  kategori: string;
  supplier: string;
  satuanBeli: string; // e.g. kg
  jumlahBeli: number; // e.g. 1
  hargaBeli: number; // IDR
  satuanPakai: string; // e.g. gram
  nilaiKonversi: number; // qty of satuanPakai per satuanBeli (e.g. 1000 g per kg)
  outlet: Outlet;
};

export type ProductOutletPricing = {
  available: boolean;
  hargaJual: number;
  targetFoodCost: number; // percent 0-100
  targetMargin: number; // percent 0-100
};

export type Product = {
  id: string;
  nama: string;
  kategori: string;
  // Per-outlet pricing. A product is global; visibility & price differ per outlet.
  prices: Partial<Record<Outlet, ProductOutletPricing>>;
  imageUrl?: string;
};

export type RecipeItem = {
  ingredientId: string;
  qty: number;
};

export type Recipe = {
  productId: string;
  items: RecipeItem[];
};

export type Overhead = {
  sewa: number;
  gaji: number;
  listrik: number;
  air: number;
  internet: number;
  marketing: number;
  lain: number;
  targetSalesPerMonth: number;
  outlet: Outlet;
};

export type BazarCosts = {
  sewa: number;
  deposit: number;
  listrik: number;
  transportasi: number;
  parkir: number;
  gajiStaff: number;
  freelancer: number;
  promosi: number;
  dekorasi: number;
  banner: number;
  perlengkapan: number;
  lainnya: number;
};

export type BazarScenarioInput = { txPerDay: number; avgSpending: number };

export type BazarProductMixItem = { productId: string; qty: number };

export type BazarEvent = {
  id: string;
  nama: string;
  lokasi: string;
  tanggal: string; // ISO yyyy-mm-dd
  durasiHari: number;
  targetPengunjung: number;
  jamOperasional: string;
  outlet: Outlet; // which outlet's pricing to use
  costs: BazarCosts;
  scenarios: {
    low: BazarScenarioInput;
    medium: BazarScenarioInput;
    high: BazarScenarioInput;
  };
  productMix: BazarProductMixItem[];
  targetProfit: number;
  conversionRates: { conservative: number; normal: number; aggressive: number };
  status: "planning" | "completed";
  actualRevenue?: number;
  actualCost?: number;
};

export function defaultBazarCosts(): BazarCosts {
  return { sewa: 0, deposit: 0, listrik: 0, transportasi: 0, parkir: 0, gajiStaff: 0, freelancer: 0, promosi: 0, dekorasi: 0, banner: 0, perlengkapan: 0, lainnya: 0 };
}

export function defaultPricing(): ProductOutletPricing {
  return { available: false, hargaJual: 0, targetFoodCost: 30, targetMargin: 70 };
}

export function getPricing(p: Product, outlet: Outlet): ProductOutletPricing {
  return p.prices[outlet] || defaultPricing();
}

export function isAvailableAt(p: Product, outlet: Outlet): boolean {
  return p.prices[outlet]?.available === true;
}
