import { BazarEvent, Ingredient, Outlet, Overhead, Product, Recipe } from "./types";
import { computeProductMetrics, recipeHPP } from "./compute";
import { getPricing, isAvailableAt } from "./types";

export function eventTotalCost(e: BazarEvent): number {
  const c = e.costs;
  return c.sewa + c.deposit + c.listrik + c.transportasi + c.parkir + c.gajiStaff + c.freelancer + c.promosi + c.dekorasi + c.banner + c.perlengkapan + c.lainnya;
}

export type CostBreakdownItem = { label: string; value: number };

export function eventCostBreakdown(e: BazarEvent): CostBreakdownItem[] {
  return [
    { label: "Sewa Tenant", value: e.costs.sewa },
    { label: "Deposit", value: e.costs.deposit },
    { label: "Listrik", value: e.costs.listrik },
    { label: "Transportasi", value: e.costs.transportasi },
    { label: "Parkir", value: e.costs.parkir },
    { label: "Gaji Staff", value: e.costs.gajiStaff },
    { label: "Freelancer", value: e.costs.freelancer },
    { label: "Promosi", value: e.costs.promosi },
    { label: "Dekorasi Booth", value: e.costs.dekorasi },
    { label: "Banner", value: e.costs.banner },
    { label: "Perlengkapan", value: e.costs.perlengkapan },
    { label: "Lainnya", value: e.costs.lainnya },
  ].filter((c) => c.value > 0);
}

// Average outlet-level food cost % across products available at outlet (fallback when no product mix).
export function avgFoodCostPct(
  outlet: Outlet,
  products: Product[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  overhead: Overhead | null,
): number {
  const list = products.filter((p) => isAvailableAt(p, outlet));
  if (!list.length) return 0;
  const fcs = list.map((p) => computeProductMetrics(p, outlet, recipes.find((r) => r.productId === p.id), ingredients, overhead).foodCost);
  return fcs.reduce((s, v) => s + v, 0) / fcs.length;
}

export type ScenarioMetrics = {
  label: string;
  txPerDay: number;
  avgSpending: number;
  omzetHarian: number;
  omzetEvent: number;
  cogs: number;
  grossProfit: number;
  opCost: number;
  netProfit: number;
  roiPct: number;
};

export function computeScenario(
  label: string,
  txPerDay: number,
  avgSpending: number,
  durasiHari: number,
  opCost: number,
  fcPct: number,
): ScenarioMetrics {
  const omzetHarian = txPerDay * avgSpending;
  const omzetEvent = omzetHarian * Math.max(1, durasiHari);
  const cogs = omzetEvent * (fcPct / 100);
  const grossProfit = omzetEvent - cogs;
  const netProfit = grossProfit - opCost;
  const roiPct = opCost > 0 ? (netProfit / opCost) * 100 : 0;
  return { label, txPerDay, avgSpending, omzetHarian, omzetEvent, cogs, grossProfit, opCost, netProfit, roiPct };
}

export type ProductMixRow = {
  productId: string;
  nama: string;
  qty: number;
  hargaJual: number;
  hpp: number;
  revenue: number;
  totalHpp: number;
  profit: number;
  marginPct: number;
};

export function productMixMetrics(
  e: BazarEvent,
  outlet: Outlet,
  products: Product[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  overhead: Overhead | null,
): { rows: ProductMixRow[]; totalRevenue: number; totalHpp: number; totalProfit: number; avgMargin: number; totalQty: number } {
  const rows: ProductMixRow[] = [];
  for (const item of e.productMix) {
    const p = products.find((pp) => pp.id === item.productId);
    if (!p || item.qty <= 0) continue;
    if (!isAvailableAt(p, outlet)) continue; // skip products not sold at this outlet
    const pricing = getPricing(p, outlet);
    const hppPerUnit = recipeHPP(recipes.find((r) => r.productId === p.id), ingredients);
    const revenue = pricing.hargaJual * item.qty;
    const totalHpp = hppPerUnit * item.qty;
    const profit = revenue - totalHpp;
    const marginPct = pricing.hargaJual > 0 ? ((pricing.hargaJual - hppPerUnit) / pricing.hargaJual) * 100 : 0;
    rows.push({ productId: p.id, nama: p.nama, qty: item.qty, hargaJual: pricing.hargaJual, hpp: hppPerUnit, revenue, totalHpp, profit, marginPct });
  }
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalHpp = rows.reduce((s, r) => s + r.totalHpp, 0);
  const totalProfit = totalRevenue - totalHpp;
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  return { rows, totalRevenue, totalHpp, totalProfit, avgMargin, totalQty };
}

export function bepRevenue(opCost: number, grossMarginPct: number): number {
  if (grossMarginPct <= 0) return 0;
  return opCost / (grossMarginPct / 100);
}

export function targetOmzet(opCost: number, targetProfit: number, grossMarginPct: number): number {
  if (grossMarginPct <= 0) return 0;
  return (opCost + targetProfit) / (grossMarginPct / 100);
}

export function visitorProjection(visitors: number, conversionPct: number, avgSpending: number): { buyers: number; omzet: number } {
  const buyers = visitors * (conversionPct / 100);
  return { buyers, omzet: buyers * avgSpending };
}
