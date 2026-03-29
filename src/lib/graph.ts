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

    for (const input of node.inputs) {
        buildNodesAndEdges(input, nodes, edges, id, options, onRecipeChange)
    }
}

export function treeToGraph(tree: ProductionNode, options?: GraphOptions, onRecipeChange?: (itemId: string, recipeId: string) => void): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []

    buildNodesAndEdges(tree, nodes, edges, null, options, onRecipeChange)

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