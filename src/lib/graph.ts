import { type Node, type Edge, MarkerType, Position } from '@xyflow/svelte'
import type { GraphOptions, ProductionNode } from './types'
import { recipesByOutput } from './data'
import dagre from 'dagre'

const NODE_WIDTH = 240
const NODE_HEIGHT = 120

function buildNodesAndEdges(
    node: ProductionNode,
    nodes: Node[],
    edges: Edge[],
    parentId: string | null,
    options?: GraphOptions,
    onRecipeChange?: (itemId: string, recipeId: string) => void
): void {
    const id = `${node.itemId}-${nodes.length}`

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
            horizontalLayout: options?.horizontalLayout ?? false,
            itemId: node.itemId,
            recipeId: node.recipe?.id ?? null,
            availableRecipes: (recipesByOutput[node.itemId] ?? []).map(r => ({ value: r.id, label: r.name })),
            onRecipeChange,
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
            animated: options?.animatedEdges ?? false,
        })
    }

    // Add output nodes for byproducts
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
                horizontalLayout: options?.horizontalLayout ?? false,
            },
            type: 'production',
        })
        edges.push({
            id: `${id}-${bpId}`,
            source: id,
            target: bpId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.Arrow, width: 20, height: 20 },
            animated: options?.animatedEdges ?? false,
        })
    }

    for (const input of node.inputs) {
        buildNodesAndEdges(input, nodes, edges, id, options, onRecipeChange)
    }
}

function mergeNodes(nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
    // Group nodes by itemId, keep the first as representative
    const repById = new Map<string, string>() // itemId → representative node id
    const toRemove = new Set<string>()

    for (const node of nodes) {
        if (node.data.isOutput) continue
        const itemId = node.data.itemId as string
        const existing = repById.get(itemId)
        if (!existing) {
            repById.set(itemId, node.id)
        } else {
            // Merge this node into the representative
            const rep = nodes.find(n => n.id === existing)!
            rep.data = {
                ...rep.data,
                rate: (rep.data.rate as number) + (node.data.rate as number),
                machines: (rep.data.machines as number) + (node.data.machines as number),
                power: (rep.data.power as number) + (node.data.power as number),
                inputs: mergeInputs(
                    rep.data.inputs as { name: string; rate: number }[],
                    node.data.inputs as { name: string; rate: number }[]
                ),
            }
            toRemove.add(node.id)
        }
    }

    // Redirect edges from removed nodes to their representative (skip output nodes)
    const redirectedEdges = edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        const newSource = !sourceNode?.data.isOutput
            ? (repById.get(sourceNode?.data.itemId as string) ?? edge.source)
            : edge.source
        const newTarget = !targetNode?.data.isOutput
            ? (repById.get(targetNode?.data.itemId as string) ?? edge.target)
            : edge.target
        return { ...edge, source: newSource, target: newTarget }
    })

    // Remove self-loops and duplicate edges
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

export function treeToGraph(tree: ProductionNode, options?: GraphOptions, onRecipeChange?: (itemId: string, recipeId: string) => void): { nodes: Node[], edges: Edge[] } {
    let nodes: Node[] = []
    let edges: Edge[] = []

    // Add output node as the final sink
    const outputId = `output-${tree.itemId}`
    nodes.push({
        id: outputId,
        position: { x: 0, y: 0 },
        data: {
            label: tree.itemName,
            rate: tree.rate,
            horizontalLayout: options?.horizontalLayout ?? false,
            itemId: tree.itemId,
            isOutput: true,
            hasParent: false,
            inputs: [],
            availableRecipes: [],
        },
        type: 'production',
    })

    buildNodesAndEdges(tree, nodes, edges, outputId, options, onRecipeChange)

    if (options?.autoMerge) {
        ;({ nodes, edges } = mergeNodes(nodes, edges))
    }

    const horizontal = options?.horizontalLayout ?? false
    const direction = horizontal ? 'LR' : 'BT'

    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 })

    for (const node of nodes) {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    }
    for (const edge of edges) {
        g.setEdge(edge.source, edge.target)
    }

    dagre.layout(g)

    for (const node of nodes) {
        const dagreNode = g.node(node.id)
        node.position = {
            x: dagreNode.x - NODE_WIDTH / 2,
            y: dagreNode.y - NODE_HEIGHT / 2,
        }
        node.sourcePosition = horizontal ? Position.Right : Position.Top
        node.targetPosition = horizontal ? Position.Left : Position.Bottom
    }

    return { nodes, edges }
}