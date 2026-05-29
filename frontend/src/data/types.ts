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

export function defaultPricing(): ProductOutletPricing {
  return { available: false, hargaJual: 0, targetFoodCost: 30, targetMargin: 70 };
}

export function getPricing(p: Product, outlet: Outlet): ProductOutletPricing {
  return p.prices[outlet] || defaultPricing();
}

export function isAvailableAt(p: Product, outlet: Outlet): boolean {
  return p.prices[outlet]?.available === true;
}
