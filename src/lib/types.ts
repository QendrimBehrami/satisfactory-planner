export interface Item {
    id: string
    name: string
    form: 'solid' | 'liquid' | 'gas'
    isResource?: boolean
    sinkPoints: number
}

export interface Building {
    id: string
    name: string
    power: number
    powerExponent: number
}

export interface RecipeItem {
    item: string
    amount: number
}

export interface Recipe {
    id: string
    name: string
    alternate: boolean
    time: number
    buildings: string[]
    inputs: RecipeItem[]
    outputs: RecipeItem[]
}

export interface GameData {
    items: Record<string, Item>
    buildings: Record<string, Building>
    recipes: Recipe[]
}