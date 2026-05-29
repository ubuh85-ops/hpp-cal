# F&B HPP Calculator - Test Plan

Offline-first Expo React Native app for calculating F&B HPP, food cost %, margin %, ideal price.

## Features
- 6 bottom tabs: Dashboard, Bahan, Produk, Resep, Simulasi, Laporan
- Ingredients CRUD (`/ingredient/[id]`)
- Products CRUD (`/product/[id]`)
- Recipe builder (`/recipe/[productId]`)
- Overhead settings (`/overhead`)
- Multi-outlet switcher (FORU Huis / The Mozz / Bazar)
- CSV export/import via Share/Clipboard
- Sample data seeded on first launch

## Auth
None. Single-user, offline storage via AsyncStorage.
