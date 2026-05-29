import { storage } from "@/src/utils/storage";
import { Ingredient, Outlet, Overhead, Product, Recipe } from "./types";
import { SEED_INGREDIENTS, SEED_PRODUCTS, SEED_RECIPES, SEED_OVERHEADS } from "./seed";

const K_ING = "hpp.ingredients";
const K_PROD = "hpp.products";
const K_REC = "hpp.recipes";
const K_OH = "hpp.overheads";
const K_OUTLET = "hpp.activeOutlet";
const K_SEEDED = "hpp.seeded.v2";

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = (await storage.getItem(key, "")) as string | null;
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

export const repo = {
  async ensureSeed() {
    const seeded = (await storage.getItem(K_SEEDED, "")) as string | null;
    if (seeded === "1") return;
    await writeJSON(K_ING, SEED_INGREDIENTS);
    await writeJSON(K_PROD, SEED_PRODUCTS);
    await writeJSON(K_REC, SEED_RECIPES);
    await writeJSON(K_OH, SEED_OVERHEADS);
    await storage.setItem(K_SEEDED, "1");
  },

  async resetSeed() {
    await writeJSON(K_ING, SEED_INGREDIENTS);
    await writeJSON(K_PROD, SEED_PRODUCTS);
    await writeJSON(K_REC, SEED_RECIPES);
    await writeJSON(K_OH, SEED_OVERHEADS);
    await storage.setItem(K_SEEDED, "1");
  },

  async getActiveOutlet(): Promise<Outlet> {
    const v = (await storage.getItem(K_OUTLET, "")) as string | null;
    return ((v as Outlet) || "FORU Huis") as Outlet;
  },
  async setActiveOutlet(outlet: Outlet) {
    await storage.setItem(K_OUTLET, outlet);
  },

  // Ingredients
  async listIngredients(): Promise<Ingredient[]> {
    return readJSON<Ingredient[]>(K_ING, []);
  },
  async saveIngredient(ing: Ingredient) {
    const all = await this.listIngredients();
    const idx = all.findIndex((x) => x.id === ing.id);
    if (idx >= 0) all[idx] = ing;
    else all.push(ing);
    await writeJSON(K_ING, all);
  },
  async deleteIngredient(id: string) {
    const all = await this.listIngredients();
    await writeJSON(K_ING, all.filter((x) => x.id !== id));
  },

  // Products
  async listProducts(): Promise<Product[]> {
    return readJSON<Product[]>(K_PROD, []);
  },
  async saveProduct(p: Product) {
    const all = await this.listProducts();
    const idx = all.findIndex((x) => x.id === p.id);
    if (idx >= 0) all[idx] = p;
    else all.push(p);
    await writeJSON(K_PROD, all);
  },
  async deleteProduct(id: string) {
    const all = await this.listProducts();
    await writeJSON(K_PROD, all.filter((x) => x.id !== id));
    const recs = await this.listRecipes();
    await writeJSON(K_REC, recs.filter((r) => r.productId !== id));
  },

  // Recipes
  async listRecipes(): Promise<Recipe[]> {
    return readJSON<Recipe[]>(K_REC, []);
  },
  async getRecipe(productId: string): Promise<Recipe | undefined> {
    const all = await this.listRecipes();
    return all.find((r) => r.productId === productId);
  },
  async saveRecipe(rec: Recipe) {
    const all = await this.listRecipes();
    const idx = all.findIndex((r) => r.productId === rec.productId);
    if (idx >= 0) all[idx] = rec;
    else all.push(rec);
    await writeJSON(K_REC, all);
  },

  // Overhead per outlet
  async listOverheads(): Promise<Overhead[]> {
    return readJSON<Overhead[]>(K_OH, []);
  },
  async getOverhead(outlet: Outlet): Promise<Overhead | null> {
    const all = await this.listOverheads();
    return all.find((o) => o.outlet === outlet) || null;
  },
  async saveOverhead(oh: Overhead) {
    const all = await this.listOverheads();
    const idx = all.findIndex((o) => o.outlet === oh.outlet);
    if (idx >= 0) all[idx] = oh;
    else all.push(oh);
    await writeJSON(K_OH, all);
  },
};

export function makeId(prefix: string = "id"): string {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}
