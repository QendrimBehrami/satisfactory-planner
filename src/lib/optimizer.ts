import HiGHS from 'highs'
import highsWasmUrl from 'highs/runtime?url'
import { recipes, items } from './data'

export interface ResourceLimit {
    itemId: string
    rate: number // per minute
}

export interface OptimizeResult {
    rate: number
    recipeOverrides: Record<string, string>
}

const BIG_M = 100000

/**
 * Given a target item and resource limits, find the maximum achievable rate
 * using the provided set of allowed recipe IDs (unlocked alternates + defaults).
 * Uses MIP (Mixed Integer Programming) to enforce at most one recipe per output item.
 */
export async function optimize(
    targetItemId: string,
    resourceLimits: ResourceLimit[],
    unlockedAlternateIds: Set<string>,
): Promise<OptimizeResult> {
    const highs = await HiGHS({ locateFile: () => highsWasmUrl })

    // Collect candidate recipes: default (non-alternate) + unlocked alternates
    // SAM converter recipes are treated like alternates (must be explicitly unlocked)
    const SAM_INGOT_ID = 'Desc_SAMIngot_C'
    const candidateRecipes = recipes.filter(r => {
        const isSamConverter = r.inputs.some((i: { item: string }) => i.item === SAM_INGOT_ID)
        if (isSamConverter) return unlockedAlternateIds.has(r.id)
        if (r.alternate) return unlockedAlternateIds.has(r.id)
        return true
    })

    // Continuous variables: rate of each recipe (machines equivalent)
    const varNames = candidateRecipes.map((_, i) => `r${i}`)
    // Binary variables: whether each recipe is used at all
    const binVarNames = candidateRecipes.map((_, i) => `b${i}`)

    // Collect all items that appear in candidate recipes
    const allItemIds = new Set<string>()
    for (const r of candidateRecipes) {
        for (const o of r.outputs) allItemIds.add(o.item)
        for (const inp of r.inputs) allItemIds.add(inp.item)
    }

    // Build flow balance constraints
    const rows: { name: string; lb: number; coeffs: Record<string, number> }[] = []

    for (const itemId of allItemIds) {
        const item = items[itemId]
        const isResource = item?.isResource ?? false
        const limit = resourceLimits.find(l => l.itemId === itemId)

        const coeffs: Record<string, number> = {}
        for (let i = 0; i < candidateRecipes.length; i++) {
            const recipe = candidateRecipes[i]
            const ratePerMin = 60 / recipe.time
            const outputAmt = recipe.outputs.find((o: { item: string }) => o.item === itemId)?.amount ?? 0
            const inputAmt = recipe.inputs.find((inp: { item: string }) => inp.item === itemId)?.amount ?? 0
            const net = (outputAmt - inputAmt) * ratePerMin
            if (net !== 0) coeffs[varNames[i]] = net
        }

        if (Object.keys(coeffs).length === 0) continue

        if (isResource) {
            // Consumption <= limit (unlisted resources = 0, i.e. not available)
            const rate = limit?.rate ?? 0
            rows.push({ name: itemId, lb: -rate, coeffs })
        } else if (itemId !== targetItemId) {
            // Intermediate items: net flow >= 0
            rows.push({ name: itemId, lb: 0, coeffs })
        }
        // targetItem: unconstrained, it's the objective
    }

    // Objective: maximize net production of target item
    const objCoeffs: string[] = []
    for (let i = 0; i < candidateRecipes.length; i++) {
        const recipe = candidateRecipes[i]
        const ratePerMin = 60 / recipe.time
        const outputAmt = recipe.outputs.find((o: { item: string }) => o.item === targetItemId)?.amount ?? 0
        const inputAmt = recipe.inputs.find((inp: { item: string }) => inp.item === targetItemId)?.amount ?? 0
        const net = (outputAmt - inputAmt) * ratePerMin
        if (net !== 0) objCoeffs.push(`${net} ${varNames[i]}`)
    }

    if (objCoeffs.length === 0) {
        return { rate: 0, recipeOverrides: {} }
    }

    // Group recipes by primary output item to enforce "one recipe per item" constraint
    const recipesByOutput = new Map<string, number[]>()
    for (let i = 0; i < candidateRecipes.length; i++) {
        const primaryOutput = candidateRecipes[i].outputs[0].item
        if (!recipesByOutput.has(primaryOutput)) recipesByOutput.set(primaryOutput, [])
        recipesByOutput.get(primaryOutput)!.push(i)
    }

    function termsStr(coeffs: Record<string, number>): string {
        return Object.entries(coeffs)
            .map(([v, c], idx) => {
                if (idx === 0) return `${c} ${v}`
                return c >= 0 ? `+ ${c} ${v}` : `- ${Math.abs(c)} ${v}`
            })
            .join(' ')
    }

    function objStr(terms: string[]): string {
        return terms
            .map((t, i) => i === 0 ? t : (t.startsWith('-') ? t : `+ ${t}`))
            .join(' ')
    }

    // Flow balance constraints
    const flowConstraints = rows
        .map((row, i) => `  c${i}: ${termsStr(row.coeffs)} >= ${row.lb}`)
        .join('\n')

    // Big-M constraints: r_i <= M * b_i
    const bigMConstraints = candidateRecipes
        .map((_, i) => `  bm${i}: ${varNames[i]} - ${BIG_M} ${binVarNames[i]} <= 0`)
        .join('\n')

    // One recipe per output item: sum of b_i for same output <= 1
    const oneRecipeConstraints = [...recipesByOutput.entries()]
        .filter(([_, indices]) => indices.length > 1)
        .map(([_, indices], i) =>
            `  or${i}: ${indices.map(j => binVarNames[j]).join(' + ')} <= 1`
        )
        .join('\n')

    const lpStr = `\\Problem
Maximize
 obj: ${objStr(objCoeffs)}
Subject To
${flowConstraints}
${bigMConstraints}
${oneRecipeConstraints}
Bounds
${varNames.map(v => `  0 <= ${v}`).join('\n')}
${binVarNames.map(v => `  0 <= ${v} <= 1`).join('\n')}
General
${binVarNames.map(v => `  ${v}`).join('\n')}
End`

    console.log('LP:\n', lpStr)
    const result = highs.solve(lpStr, {})
    console.log('HiGHS result:', result.Status)

    if (result.Status !== 'Optimal') {
        return { rate: 0, recipeOverrides: {} }
    }

    // Extract which recipe is used per output item
    const recipeOverrides: Record<string, string> = {}
    for (let i = 0; i < candidateRecipes.length; i++) {
        const val = result.Columns[varNames[i]]?.Primal ?? 0
        if (val > 0.001) {
            const recipe = candidateRecipes[i]
            console.log(`Active: ${recipe.name} = ${val}`)
            if (recipe.alternate) {
                const primaryOutput = recipe.outputs[0].item
                recipeOverrides[primaryOutput] = recipe.id
            }
        }
    }

    // Compute achieved target rate
    let targetRate = 0
    for (let i = 0; i < candidateRecipes.length; i++) {
        const val = result.Columns[varNames[i]]?.Primal ?? 0
        if (val > 0.001) {
            const recipe = candidateRecipes[i]
            const ratePerMin = 60 / recipe.time
            const outputAmt = recipe.outputs.find((o: { item: string }) => o.item === targetItemId)?.amount ?? 0
            targetRate += outputAmt * ratePerMin * val
        }
    }

    return { rate: Math.round(targetRate * 100) / 100, recipeOverrides }
}