import { readFileSync, writeFileSync } from "fs";
import type { Item, Building, RecipeItem, Recipe, GameData } from './src/lib/types'
import { join } from "path";

const INPUT_FILE = join(process.cwd(), "en-US.json");
const OUTPUT_FILE = join(process.cwd(), "src/data/data.json");

// ── Types ──────────────────────────────────────────────────────────────────

interface RawClass {
    ClassName: string;
    mDisplayName: string;
    mForm?: string;
    mResourceSinkPoints?: string;
    mPowerConsumption?: string;
    mPowerConsumptionExponent?: string;
    mIngredients?: string;
    mProduct?: string;
    mProducedIn?: string;
    mManufactoringDuration?: string;
    [key: string]: string | undefined;
}

interface RawEntry {
    NativeClass: string;
    Classes: RawClass[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseProducedIn(s: string): string[] {
    return [...s.matchAll(/(\w+_C)[",)]/g)].map((m) => m[1]);
}

function parseItems(s: string): RecipeItem[] {
    return [...s.matchAll(/(Desc_\w+)'.*?Amount=(\d+)/g)].map((m) => ({
        item: m[1],
        amount: parseInt(m[2], 10),
    }));
}

// ── Main ───────────────────────────────────────────────────────────────────

console.log(`Reading ${INPUT_FILE}...`);
const raw = readFileSync(INPUT_FILE);
const data: RawEntry[] = JSON.parse(raw.toString("utf-16le").replace(/^\uFEFF/, ""));

// Pass 1: Items
const ITEM_CLASSES = [
    "FGItemDescriptor'",
    "FGResourceDescriptor",
    "FGItemDescriptorBiomass",
    "FGConsumableDescriptor",
    "FGItemDescriptorNuclearFuel",
    "FGItemDescriptorPowerBoosterFuel",
    "FGPowerShardDescriptor",
];

const items: Record<string, Item> = {};
for (const entry of data) {
    if (ITEM_CLASSES.some((ic) => entry.NativeClass.includes(ic))) {
        for (const cls of entry.Classes) {
            const formRaw = cls.mForm ?? "RF_SOLID";
            const form = formRaw.includes("LIQUID")
                ? "liquid"
                : formRaw.includes("GAS")
                    ? "gas"
                    : "solid";
            items[cls.ClassName] = {
                id: cls.ClassName,
                name: cls.mDisplayName,
                form,
                isResource: entry.NativeClass.includes("FGResourceDescriptor"),
                sinkPoints: parseInt(cls.mResourceSinkPoints ?? "0", 10),
            };
        }
    }
}

// Pass 2: Buildings
const buildings: Record<string, Building> = {};
for (const entry of data) {
    if (entry.NativeClass.includes("FGBuildableManufacturer")) {
        for (const cls of entry.Classes) {
            buildings[cls.ClassName] = {
                id: cls.ClassName,
                name: cls.mDisplayName,
                power: parseFloat(cls.mPowerConsumption ?? "0"),
                powerExponent: parseFloat(cls.mPowerConsumptionExponent ?? "1.321929"),
            };
        }
    }
}

// Pass 3: Recipes
const recipes: Recipe[] = [];
for (const entry of data) {
    if (entry.NativeClass.includes("FGRecipe")) {
        for (const cls of entry.Classes) {
            const producers = parseProducedIn(cls.mProducedIn ?? "").filter(
                (p) => p in buildings
            );
            if (!producers.length) continue;

            const inputs = parseItems(cls.mIngredients ?? "");
            const outputs = parseItems(cls.mProduct ?? "");
            if (!outputs.length) continue;

            recipes.push({
                id: cls.ClassName,
                name: cls.mDisplayName,
                alternate: cls.mDisplayName.startsWith("Alternate:"),
                time: parseFloat(cls.mManufactoringDuration ?? "0"),
                buildings: producers,
                inputs,
                outputs,
            });
        }
    }
}

// ── Output ─────────────────────────────────────────────────────────────────

const output: GameData = { items, buildings, recipes };
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");

console.log(`✓ Items:     ${Object.keys(items).length}`);
console.log(`✓ Buildings: ${Object.keys(buildings).length}`);
console.log(
    `✓ Recipes:   ${recipes.length}  (${recipes.filter((r) => r.alternate).length} alternates)`
);
console.log(`\nWritten to ${OUTPUT_FILE}`);