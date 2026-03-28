import { writable } from 'svelte/store'
import type { GraphOptions } from './types'

export const graphOptions = writable<GraphOptions>({
    animatedEdges: false,
    horizontalLayout: false,
})