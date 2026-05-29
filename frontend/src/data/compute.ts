import { getPricing, Ingredient, Outlet, Overhead, Product, ProductOutletPricing, Recipe } from "./types";

export function costPerUnit(ing: Ingredient): number {
  const denom = (ing.jumlahBeli || 0) * (ing.nilaiKonversi || 0);
  if (denom <= 0) return 0;
  return ing.hargaBeli / denom;
}

export function recipeHPP(recipe: Recipe | undefined, ingredients: Ingredient[]): number {
  if (!recipe) return 0;
  const map = new Map(ingredients.map((i) => [i.id, i]));
  let total = 0;
  for (const item of recipe.items) {
    const ing = map.get(item.ingredientId);
    if (!ing) continue;
    total += costPerUnit(ing) * item.qty;
  }
  return total;
}

export function foodCostPct(hpp: number, hargaJual: number): number {
  if (hargaJual <= 0) return 0;
  return (hpp / hargaJual) * 100;
}

export function grossProfit(hpp: number, hargaJual: number): number {
  return hargaJual - hpp;
}

export function marginPct(hpp: number, hargaJual: number): number {
  if (hargaJual <= 0) return 0;
  return ((hargaJual - hpp) / hargaJual) * 100;
}

export function idealPriceByFoodCost(hpp: number, targetFoodCostPct: number): number {
  if (targetFoodCostPct <= 0) return 0;
  return hpp / (targetFoodCostPct / 100);
}

export function idealPriceByMargin(hpp: number, targetMarginPct: number): number {
  const m = targetMarginPct / 100;
  if (m >= 1) return 0;
  return hpp / (1 - m);
}

export function overheadPerProduct(overhead: Overhead | null): number {
  if (!overhead) return 0;
  const totalMonthly =
    overhead.sewa + overhead.gaji + overhead.listrik + overhead.air +
    overhead.internet + overhead.marketing + overhead.lain;
  if (overhead.targetSalesPerMonth <= 0) return 0;
  return totalMonthly / overhead.targetSalesPerMonth;
}

export function marginStatus(margin: number): "green" | "yellow" | "red" {
  if (margin >= 60) return "green";
  if (margin >= 40) return "yellow";
  return "red";
}

export type ProductMetrics = {
  product: Product;
  pricing: ProductOutletPricing;
  hppBahan: number;
  overhead: number;
  finalHpp: number;
  hpp: number; // alias for finalHpp (back-compat)
  foodCost: number;
  profit: number;
  margin: number;
  idealPrice: number;
};

export function computeProductMetrics(
  product: Product,
  outlet: Outlet,
  recipe: Recipe | undefined,
  ingredients: Ingredient[],
  overhead: Overhead | null,
): ProductMetrics {
  const pricing = getPricing(product, outlet);
  const hppBahan = recipeHPP(recipe, ingredients);
  const oh = overheadPerProduct(overhead);
  const finalHpp = hppBahan + oh;
  const fc = foodCostPct(finalHpp, pricing.hargaJual);
  const profit = grossProfit(finalHpp, pricing.hargaJual);
  const margin = marginPct(finalHpp, pricing.hargaJual);
  let ideal = 0;
  if (pricing.targetFoodCost > 0) {
    ideal = idealPriceByFoodCost(finalHpp, pricing.targetFoodCost);
  } else if (pricing.targetMargin > 0) {
    ideal = idealPriceByMargin(finalHpp, pricing.targetMargin);
  }
  return { product, pricing, hppBahan, overhead: oh, finalHpp, hpp: finalHpp, foodCost: fc, profit, margin, idealPrice: ideal };
}
