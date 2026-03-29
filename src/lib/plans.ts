import { writable, derived } from 'svelte/store'

export interface Plan {
    id: string
    name: string
    iconItemId?: string
    itemId: string
    rate: number
    recipeOverrides: Record<string, string>
    doneNodes: Record<string, boolean>
    collapsedNodes: Record<string, boolean>
}

function createPlanDefaults(): Plan {
    return {
        id: crypto.randomUUID(),
        name: 'Plan 1',
        itemId: 'Desc_Motor_C',
        rate: 10,
        recipeOverrides: {},
        doneNodes: {},
        collapsedNodes: {},
    }
}

function loadPlans(): Plan[] {
    try {
        const stored = localStorage.getItem('plans')
        if (stored) return JSON.parse(stored)
    } catch {}
    // Migrate from old flat localStorage keys
    return [{
        ...createPlanDefaults(),
        itemId: localStorage.getItem('itemId') ?? 'Desc_Motor_C',
        rate: Number(localStorage.getItem('rate') ?? 10),
        recipeOverrides: JSON.parse(localStorage.getItem('recipeOverrides') ?? '{}'),
        doneNodes: JSON.parse(localStorage.getItem('doneNodes') ?? '{}'),
        collapsedNodes: JSON.parse(localStorage.getItem('collapsedNodes') ?? '{}'),
    }]
}

const initialPlans = loadPlans()
const initialActiveId = localStorage.getItem('activePlanId') ?? initialPlans[0].id

export const plans = writable<Plan[]>(initialPlans)
export const activePlanId = writable<string>(initialActiveId)

plans.subscribe(v => localStorage.setItem('plans', JSON.stringify(v)))
activePlanId.subscribe(v => localStorage.setItem('activePlanId', v))

export const activePlan = derived([plans, activePlanId], ([$plans, $id]) =>
    $plans.find(p => p.id === $id) ?? $plans[0]
)

export function addPlan() {
    let count = 0
    plans.subscribe(ps => count = ps.length)()
    const plan: Plan = { ...createPlanDefaults(), name: `Plan ${count + 1}`, id: crypto.randomUUID() }
    plans.update(ps => [...ps, plan])
    activePlanId.set(plan.id)
}

export function deletePlan(id: string) {
    let remaining: Plan[] = []
    plans.update(ps => {
        remaining = ps.filter(p => p.id !== id)
        if (remaining.length === 0) remaining = [createPlanDefaults()]
        return remaining
    })
    activePlanId.update(current => current === id ? remaining[0].id : current)
}

export function updatePlan(id: string, patch: Partial<Plan>) {
    plans.update(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
}
