import { Ingredient, Overhead, Product, Recipe } from "./types";

// Ingredients
export const SEED_INGREDIENTS: Ingredient[] = [
  { id: "ing-coffee", nama: "Coffee Beans", kategori: "Kopi", supplier: "Toko Kopi Jaya", satuanBeli: "kg", jumlahBeli: 1, hargaBeli: 220000, satuanPakai: "gram", nilaiKonversi: 1000, outlet: "FORU Huis" },
  { id: "ing-fresh-milk", nama: "Fresh Milk", kategori: "Dairy", supplier: "Greenfields", satuanBeli: "liter", jumlahBeli: 1, hargaBeli: 22000, satuanPakai: "ml", nilaiKonversi: 1000, outlet: "FORU Huis" },
  { id: "ing-palm-sugar", nama: "Palm Sugar Syrup", kategori: "Sirup", supplier: "Aren Nusantara", satuanBeli: "liter", jumlahBeli: 1, hargaBeli: 60000, satuanPakai: "ml", nilaiKonversi: 1000, outlet: "FORU Huis" },
  { id: "ing-matcha", nama: "Matcha Powder", kategori: "Powder", supplier: "Matcha JP", satuanBeli: "gram", jumlahBeli: 100, hargaBeli: 150000, satuanPakai: "gram", nilaiKonversi: 1, outlet: "FORU Huis" },
  { id: "ing-choco", nama: "Chocolate Powder", kategori: "Powder", supplier: "Van Houten", satuanBeli: "kg", jumlahBeli: 1, hargaBeli: 120000, satuanPakai: "gram", nilaiKonversi: 1000, outlet: "FORU Huis" },
  { id: "ing-cup", nama: "Cup 16oz", kategori: "Kemasan", supplier: "Tokopack", satuanBeli: "pack", jumlahBeli: 50, hargaBeli: 75000, satuanPakai: "pcs", nilaiKonversi: 50, outlet: "FORU Huis" },
  { id: "ing-beef", nama: "Beef Patty", kategori: "Protein", supplier: "Meat Co", satuanBeli: "kg", jumlahBeli: 1, hargaBeli: 180000, satuanPakai: "gram", nilaiKonversi: 1000, outlet: "FORU Huis" },
  { id: "ing-bun", nama: "Burger Bun", kategori: "Roti", supplier: "Bakery Co", satuanBeli: "pack", jumlahBeli: 12, hargaBeli: 48000, satuanPakai: "pcs", nilaiKonversi: 12, outlet: "FORU Huis" },
  { id: "ing-rice", nama: "Rice", kategori: "Karbo", supplier: "Pasar Induk", satuanBeli: "kg", jumlahBeli: 5, hargaBeli: 75000, satuanPakai: "gram", nilaiKonversi: 5000, outlet: "FORU Huis" },
  { id: "ing-chicken", nama: "Chicken", kategori: "Protein", supplier: "Ayam Segar", satuanBeli: "kg", jumlahBeli: 1, hargaBeli: 45000, satuanPakai: "gram", nilaiKonversi: 1000, outlet: "FORU Huis" },
  { id: "ing-sauce", nama: "Sauce", kategori: "Saus", supplier: "Heinz", satuanBeli: "liter", jumlahBeli: 1, hargaBeli: 35000, satuanPakai: "ml", nilaiKonversi: 1000, outlet: "FORU Huis" },
];

// Products
export const SEED_PRODUCTS: Product[] = [
  { id: "prod-kopi-aren", nama: "Kopi Susu Aren", kategori: "Coffee", outlet: "FORU Huis", hargaJual: 25000, targetFoodCost: 30, targetMargin: 70 },
  { id: "prod-foru-sig", nama: "FORU Signature", kategori: "Coffee", outlet: "FORU Huis", hargaJual: 32000, targetFoodCost: 28, targetMargin: 72 },
  { id: "prod-matcha", nama: "Matcha Latte", kategori: "Tea", outlet: "FORU Huis", hargaJual: 30000, targetFoodCost: 32, targetMargin: 68 },
  { id: "prod-royal-choco", nama: "Royal Chocolate", kategori: "Chocolate", outlet: "FORU Huis", hargaJual: 28000, targetFoodCost: 30, targetMargin: 70 },
  { id: "prod-burger-camat", nama: "Burger Camat", kategori: "Burger", outlet: "FORU The Mozz", hargaJual: 38000, targetFoodCost: 35, targetMargin: 65 },
  { id: "prod-burger-bupati", nama: "Burger Bupati", kategori: "Burger", outlet: "FORU The Mozz", hargaJual: 48000, targetFoodCost: 35, targetMargin: 65 },
  { id: "prod-burger-presiden", nama: "Burger Presiden", kategori: "Burger", outlet: "FORU The Mozz", hargaJual: 65000, targetFoodCost: 38, targetMargin: 62 },
  { id: "prod-rice-bowl", nama: "Rice Bowl Chicken", kategori: "Rice Bowl", outlet: "FORU Bazar", hargaJual: 35000, targetFoodCost: 35, targetMargin: 65 },
  { id: "prod-nasgor", nama: "Nasi Goreng", kategori: "Rice Bowl", outlet: "FORU Bazar", hargaJual: 28000, targetFoodCost: 33, targetMargin: 67 },
];

export const SEED_RECIPES: Recipe[] = [
  { productId: "prod-kopi-aren", items: [
    { ingredientId: "ing-coffee", qty: 18 },
    { ingredientId: "ing-fresh-milk", qty: 120 },
    { ingredientId: "ing-palm-sugar", qty: 20 },
    { ingredientId: "ing-cup", qty: 1 },
  ]},
  { productId: "prod-foru-sig", items: [
    { ingredientId: "ing-coffee", qty: 20 },
    { ingredientId: "ing-fresh-milk", qty: 150 },
    { ingredientId: "ing-palm-sugar", qty: 15 },
    { ingredientId: "ing-cup", qty: 1 },
  ]},
  { productId: "prod-matcha", items: [
    { ingredientId: "ing-matcha", qty: 5 },
    { ingredientId: "ing-fresh-milk", qty: 180 },
    { ingredientId: "ing-palm-sugar", qty: 15 },
    { ingredientId: "ing-cup", qty: 1 },
  ]},
  { productId: "prod-royal-choco", items: [
    { ingredientId: "ing-choco", qty: 20 },
    { ingredientId: "ing-fresh-milk", qty: 180 },
    { ingredientId: "ing-cup", qty: 1 },
  ]},
  { productId: "prod-burger-camat", items: [
    { ingredientId: "ing-beef", qty: 100 },
    { ingredientId: "ing-bun", qty: 1 },
    { ingredientId: "ing-sauce", qty: 20 },
  ]},
  { productId: "prod-burger-bupati", items: [
    { ingredientId: "ing-beef", qty: 150 },
    { ingredientId: "ing-bun", qty: 1 },
    { ingredientId: "ing-sauce", qty: 25 },
  ]},
  { productId: "prod-burger-presiden", items: [
    { ingredientId: "ing-beef", qty: 200 },
    { ingredientId: "ing-bun", qty: 2 },
    { ingredientId: "ing-sauce", qty: 30 },
  ]},
  { productId: "prod-rice-bowl", items: [
    { ingredientId: "ing-rice", qty: 200 },
    { ingredientId: "ing-chicken", qty: 120 },
    { ingredientId: "ing-sauce", qty: 25 },
  ]},
  { productId: "prod-nasgor", items: [
    { ingredientId: "ing-rice", qty: 220 },
    { ingredientId: "ing-chicken", qty: 80 },
    { ingredientId: "ing-sauce", qty: 20 },
  ]},
];

export const SEED_OVERHEADS: Overhead[] = [
  { outlet: "FORU Huis", sewa: 8000000, gaji: 12000000, listrik: 1500000, air: 400000, internet: 600000, marketing: 1000000, lain: 500000, targetSalesPerMonth: 3000 },
  { outlet: "FORU The Mozz", sewa: 10000000, gaji: 15000000, listrik: 2000000, air: 500000, internet: 600000, marketing: 1500000, lain: 800000, targetSalesPerMonth: 4000 },
  { outlet: "FORU Bazar", sewa: 6000000, gaji: 8000000, listrik: 1000000, air: 300000, internet: 500000, marketing: 800000, lain: 400000, targetSalesPerMonth: 2500 },
];
