import type { GameData, Recipe } from './types'
import raw from '../data/data.json'

const data = raw as GameData

export const items = data.items
export const buildings = data.buildings
export const recipes = data.recipes

// Indices for quick lookup
export const recipesByOutput: Record<string, Recipe[]> = {}
export const recipesByBuilding: Record<string, Recipe[]> = {}

for (const recipe of recipes) {
    for (const output of recipe.outputs) {
        if (!recipesByOutput[output.item]) recipesByOutput[output.item] = []
        recipesByOutput[output.item].push(recipe)
    }
    for (const building of recipe.buildings) {
        if (!recipesByBuilding[building]) recipesByBuilding[building] = []
        recipesByBuilding[building].push(recipe)
    }
}

export const itemOptions = Object.values(items)
    .filter(item => !item.isResource)
    .map(item => ({ value: item.id, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

export function getIconPath(itemName: string): string {
    return `/icons/${itemName.replace(/ /g, '_')}.webp`
}