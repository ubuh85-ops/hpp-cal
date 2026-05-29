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

export type Product = {
  id: string;
  nama: string;
  kategori: string;
  outlet: Outlet;
  hargaJual: number;
  targetFoodCost: number; // percent 0-100
  targetMargin: number; // percent 0-100
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
  targetSalesPerMonth: number; // for per-product allocation
  outlet: Outlet;
};
