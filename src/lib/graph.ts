import { type Node, type Edge, MarkerType, Position } from '@xyflow/svelte'
import type { GraphOptions, ProductionNode } from './types'
import { recipesByOutput } from './data'
import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()
const NODE_WIDTH = 240

function estimateNodeHeight(data: Record<string, unknown>): number {
    if (data.isOutput || data.isByproduct) return 52  // only header
    if (data.isResource) return 52                     // only header

    const inputs = (data.inputs as unknown[])?.length ?? 0
    const hasRecipeSelect = (data.availableRecipes as unknown[])?.length > 1

    const header = 48          // padding 8+8 + icon 32
    const headerBorder = 1
    const recipeSelect = hasRecipeSelect ? 29 : 0    // padding 4+4 + select 21
    const collapsedIndicator = (data.isCollapsed && (data.hiddenInputCount as number) > 0) ? 22 : 0
    const sectionPadding = 12  // padding 6+6
    const sectionLabel = 18    // font 10px + margin 3 + letter-spacing
    const inputRows = inputs * 20  // row height ~20px

    return header + headerBorder + recipeSelect + collapsedIndicator + sectionPadding + sectionLabel + inputRows
}

interface GraphCallbacks {
    onRecipeChange?: (itemId: string, recipeId: string) => void
    onToggleDone?: (itemId: string) => void
    onToggleCollapse?: (itemId: string) => void
}

interface GraphState {
    doneNodes: Record<string, boolean>
    collapsedNodes: Record<string, boolean>
}

function buildNodesAndEdges(
    node: ProductionNode,
    nodes: Node[],
    edges: Edge[],
    parentId: string | null,
    options: GraphOptions,
    callbacks: GraphCallbacks,
    state: GraphState,
): void {
    const id = `${node.itemId}-${nodes.length}`
    const isCollapsed = state.collapsedNodes[node.itemId] ?? false
    const isDone = state.doneNodes[node.itemId] ?? false

    nodes.push({
        id,
        position: { x: 0, y: 0 },
        data: {
            label: node.itemName,
            rate: node.rate,
            machines: node.machines,
            power: node.power,
            isResource: node.recipe === null,
            hasParent: parentId !== null,
            buildingName: node.buildingName,
            inputs: node.inputs.map(input => ({
                name: input.itemName,
                rate: input.rate,
            })),
            horizontalLayout: options.horizontalLayout ?? false,
            itemId: node.itemId,
            recipeId: node.recipe?.id ?? null,
            availableRecipes: (recipesByOutput[node.itemId] ?? []).map(r => ({ value: r.id, label: r.name })),
            isDone,
            isCollapsed,
            hiddenInputCount: isCollapsed ? node.inputs.length : 0,
            ...callbacks,
        },
        type: 'production',
    })

    if (parentId) {
        edges.push({
            id: `${parentId}-${id}`,
            source: id,
            target: parentId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.Arrow, width: 20, height: 20 },
            animated: options.animatedEdges ?? false,
        })
    }

    for (const bp of node.byproducts) {
        const bpId = `byproduct-${bp.itemId}-${nodes.length}`
        nodes.push({
            id: bpId,
            position: { x: 0, y: 0 },
            data: {
                label: bp.itemName,
                rate: bp.rate,
                itemId: bp.itemId,
                isOutput: true,
                isByproduct: true,
                hasParent: false,
                inputs: [],
                availableRecipes: [],
                horizontalLayout: options.horizontalLayout ?? false,
            },
            type: 'production',
        })
        edges.push({
            id: `${id}-${bpId}`,
            source: id,
            target: bpId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.Arrow, width: 20, height: 20 },
            animated: options.animatedEdges ?? false,
        })
    }

    if (!isCollapsed) {
        for (const input of node.inputs) {
            buildNodesAndEdges(input, nodes, edges, id, options, callbacks, state)
        }
    }
}

function mergeNodes(nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
    const repById = new Map<string, string>()
    const toRemove = new Set<string>()

    for (const node of nodes) {
        if (node.data.isOutput && !node.data.isByproduct) continue
        const key = node.data.isByproduct
            ? `byproduct-${node.data.itemId as string}`
            : node.data.itemId as string
        const existing = repById.get(key)
        if (!existing) {
            repById.set(key, node.id)
        } else {
            const rep = nodes.find(n => n.id === existing)!
            rep.data = {
                ...rep.data,
                rate: (rep.data.rate as number) + (node.data.rate as number),
            }
            toRemove.add(node.id)
        }
    }

    const redirectedEdges = edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        const getKey = (n: typeof sourceNode) => n?.data.isByproduct
            ? `byproduct-${n.data.itemId as string}`
            : n?.data.itemId as string
        const newSource = (!sourceNode?.data.isOutput || sourceNode?.data.isByproduct)
            ? (repById.get(getKey(sourceNode)) ?? edge.source)
            : edge.source
        const newTarget = (!targetNode?.data.isOutput || targetNode?.data.isByproduct)
            ? (repById.get(getKey(targetNode)) ?? edge.target)
            : edge.target
        return { ...edge, source: newSource, target: newTarget }
    })

    const seenEdges = new Set<string>()
    const dedupedEdges = redirectedEdges.filter(edge => {
        if (edge.source === edge.target) return false
        const key = `${edge.source}-${edge.target}`
        if (seenEdges.has(key)) return false
        seenEdges.add(key)
        return true
    })

    return {
        nodes: nodes.filter(n => !toRemove.has(n.id)),
        edges: dedupedEdges,
    }
}

function mergeInputs(a: { name: string; rate: number }[] | undefined, b: { name: string; rate: number }[] | undefined): { name: string; rate: number }[] {
    const map = new Map<string, number>()
    for (const input of [...(a ?? []), ...(b ?? [])]) {
        map.set(input.name, (map.get(input.name) ?? 0) + input.rate)
    }
    return Array.from(map.entries()).map(([name, rate]) => ({ name, rate }))
}

export async function treeToGraph(
    tree: ProductionNode,
    options: GraphOptions = {},
    callbacks: GraphCallbacks = {},
    state: GraphState = { doneNodes: {}, collapsedNodes: {} },
): Promise<{ nodes: Node[], edges: Edge[] }> {
    let nodes: Node[] = []
    let edges: Edge[] = []

    const outputId = `output-${tree.itemId}`
    nodes.push({
        id: outputId,
        position: { x: 0, y: 0 },
        data: {
            label: tree.itemName,
            rate: tree.rate,
            horizontalLayout: options.horizontalLayout ?? false,
            itemId: tree.itemId,
            isOutput: true,
            hasParent: false,
            inputs: [],
            availableRecipes: [],
        },
        type: 'production',
    })

    buildNodesAndEdges(tree, nodes, edges, outputId, options, callbacks, state)

    if (options?.autoMerge) {
        ; ({ nodes, edges } = mergeNodes(nodes, edges))
    }

    const horizontal = options?.horizontalLayout ?? false
    const direction = horizontal ? 'RIGHT' : 'UP'

    const elkGraph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': direction,
            'elk.spacing.nodeNode': '64',
            'elk.layered.spacing.nodeNodeBetweenLayers': '128',
            'elk.edgeRouting': 'POLYLINE',
            'elk.layered.unnecessaryBendpoints': 'true',
            'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
            'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        },
        children: nodes.map(n => {
            const data = n.data as Record<string, unknown>
            const layerConstraint = (data.isOutput || data.isByproduct)
                ? 'LAST'
                : data.isResource
                    ? 'FIRST'
                    : 'NONE'
            return {
                id: n.id,
                width: NODE_WIDTH,
                height: estimateNodeHeight(data),
                layoutOptions: {
                    'elk.layered.layering.layerConstraint': layerConstraint,
                },
            }
        }),
        edges: edges.map(e => ({
            id: e.id,
            sources: [e.source],
            targets: [e.target],
        })),
    }

    const layout = await elk.layout(elkGraph)

    const nodeById = new Map(nodes.map(n => [n.id, n]))
    for (const child of layout.children ?? []) {
        const node = nodeById.get(child.id)
        if (node && child.x !== undefined && child.y !== undefined) {
            node.position = { x: child.x, y: child.y }
            node.sourcePosition = horizontal ? Position.Right : Position.Top
            node.targetPosition = horizontal ? Position.Left : Position.Bottom
        }
    }

    return { nodes, edges }
}
