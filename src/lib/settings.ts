import { writable } from 'svelte/store'
import type { GraphOptions } from './types'

const stored = localStorage.getItem('settings')
const initial: GraphOptions = stored ? JSON.parse(stored) : {
    animatedEdges: false,
    horizontalLayout: false,
}

export const graphOptions = writable<GraphOptions>(initial)

graphOptions.subscribe(value => {
    localStorage.setItem('settings', JSON.stringify(value))
})

const storedOverrides = localStorage.getItem('recipeOverrides')
export const recipeOverrides = writable<Record<string, string>>(
    storedOverrides ? JSON.parse(storedOverrides) : {}
)

recipeOverrides.subscribe(value => {
    localStorage.setItem('recipeOverrides', JSON.stringify(value))
})