# PRD: F&B HPP Calculator

## Goal
Offline-first Indonesian mobile app for F&B owners to calculate HPP, food cost %, profit margin, and ideal selling price.

## Stack
- Expo Router (file-based routing)
- AsyncStorage via `@/src/utils/storage` (offline-only, no backend)
- React Native (no web-only libs)

## Routes
- `/` → redirects to `/(tabs)/dashboard`
- `/(tabs)/dashboard` — KPI cards, charts (food cost / margin per product), highest/lowest margin, overhead link
- `/(tabs)/ingredients` — list + FAB → `/ingredient/[id]`
- `/(tabs)/products` — list + FAB → `/product/[id]`
- `/(tabs)/recipes` — list → `/recipe/[productId]`
- `/(tabs)/simulator` — ideal price calculator (target FC% or margin%, rounded Rp500/Rp1.000)
- `/(tabs)/reports` — profitability table + CSV export/import + reset
- `/ingredient/[id]`, `/product/[id]`, `/recipe/[productId]`, `/overhead` — forms

## Data Layer (`src/data/`)
- `types.ts` — Ingredient, Product, Recipe, Overhead, Outlet
- `seed.ts` — Sample ingredients + products + recipes + per-outlet overheads
- `repo.ts` — AsyncStorage repo with ensureSeed/resetSeed
- `compute.ts` — costPerUnit, recipeHPP, foodCostPct, marginPct, idealPrice*, overheadPerProduct, computeProductMetrics
- `format.ts` — IDR formatting, percentage, rounding, parseNumber

## Formulas
- HPP = Σ (cost_per_unit × qty)
- FinalHPP = HPP + (totalMonthlyOverhead / targetSalesPerMonth)
- Food Cost % = FinalHPP / hargaJual × 100
- Gross Profit = hargaJual − FinalHPP
- Margin % = (hargaJual − FinalHPP) / hargaJual × 100
- Ideal price by FC% = FinalHPP / (targetFC/100)
- Ideal price by margin% = FinalHPP / (1 − targetMargin/100)

## Status Indicator
- Green (Sehat): margin ≥ 60%
- Yellow (Cukup): 40% ≤ margin < 60%
- Red (Rendah): margin < 40%

## Multi-Outlet
- Ingredients and products are tagged with `outlet`. Lists filter by active outlet.
- Overhead is stored per outlet.
- Outlet selection persists in storage.
