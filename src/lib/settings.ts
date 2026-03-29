import { writable } from 'svelte/store'
import type { GraphOptions } from './types'

const stored = localStorage.getItem('settings')
const initial: GraphOptions = stored ? JSON.parse(stored) : {
    animatedEdges: true,
    horizontalLayout: true,
    autoMerge: true,
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

const storedDone = localStorage.getItem('doneNodes')
export const doneNodes = writable<Record<string, boolean>>(
    storedDone ? JSON.parse(storedDone) : {}
)

doneNodes.subscribe(value => {
    localStorage.setItem('doneNodes', JSON.stringify(value))
})

const storedCollapsed = localStorage.getItem('collapsedNodes')
export const collapsedNodes = writable<Record<string, boolean>>(
    storedCollapsed ? JSON.parse(storedCollapsed) : {}
)

collapsedNodes.subscribe(value => {
    localStorage.setItem('collapsedNodes', JSON.stringify(value))
})