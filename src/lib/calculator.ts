import type { Recipe, ProductionNode } from './types'
import { items, buildings, recipesByOutput } from './data'



// ── Helpers ────────────────────────────────────────────────────────────────

function getDefaultRecipe(itemId: string): Recipe | null {
    const recipes = recipesByOutput[itemId]
    if (!recipes || recipes.length === 0) return null
    // Use first non-alternate recipe, fall back to first available
    return recipes.find(r => !r.alternate) ?? recipes[0]
}

function getRatePerMinute(recipe: Recipe, outputItemId: string): number {
    const output = recipe.outputs.find(o => o.item === outputItemId)!
    return (output.amount / recipe.time) * 60
}

// ── Calculator ─────────────────────────────────────────────────────────────

export function calculate(itemId: string, rate: number, visited = new Set<string>()): ProductionNode {
    const item = items[itemId]
    const recipe = getDefaultRecipe(itemId)
    const isRawResource = item?.isResource ?? false

    // Raw resource or cycle detected – no further inputs
    if (!recipe || isRawResource || visited.has(itemId)) {
        return {
            itemId,
            itemName: item?.name ?? itemId,
            rate,
            recipe: null,
            buildingName: buildings[recipe?.buildings[0] ?? ""]?.name ?? "",
            machines: 0,
            power: 0,
            inputs: [],
        }
    }

    visited.add(itemId)

    const building = buildings[recipe.buildings[0]]
    const ratePerMachine = getRatePerMinute(recipe, itemId)
    const machines = rate / ratePerMachine
    const power = machines * (building?.power ?? 0)

    // Recursively calculate inputs
    const inputs: ProductionNode[] = recipe.inputs.map(input => {
        const inputRatePerMachine = (input.amount / recipe.time) * 60
        const inputRate = inputRatePerMachine * machines
        return calculate(input.item, inputRate, new Set(visited))
    })

    return {
        itemId,
        itemName: item?.name ?? itemId,
        rate,
        recipe,
        buildingName: buildings[recipe?.buildings[0] ?? ""]?.name ?? "",
        machines,
        power,
        inputs,
    }
}