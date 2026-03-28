import type { Node, Edge } from '@xyflow/svelte'
import type { ProductionNode } from './calculator'

const NODE_WIDTH = 180
const NODE_HEIGHT = 80
const H_GAP = 60
const V_GAP = 40

function countLeaves(node: ProductionNode): number {
    if (node.inputs.length === 0) return 1
    return node.inputs.reduce((sum, input) => sum + countLeaves(input), 0)
}

function buildGraph(
    node: ProductionNode,
    nodes: Node[],
    edges: Edge[],
    x: number,
    y: number,
    parentId: string | null
): void {
    const id = `${node.itemId}-${nodes.length}`

    nodes.push({
        id,
        position: { x, y },
        data: {
            label: node.itemName,
            rate: node.rate,
            machines: node.machines,
            power: node.power,
            isResource: node.recipe === null,
        },
        type: 'production',
    })

    if (parentId) {
        edges.push({
            id: `${parentId}-${id}`,
            source: parentId,
            target: id,
        })
    }

    if (node.inputs.length === 0) return

    const totalLeaves = countLeaves(node)
    const totalWidth = totalLeaves * NODE_WIDTH + (totalLeaves - 1) * H_GAP
    let offsetX = x - totalWidth / 2 + NODE_WIDTH / 2

    for (const input of node.inputs) {
        const leaves = countLeaves(input)
        const childWidth = leaves * NODE_WIDTH + (leaves - 1) * H_GAP
        const childX = offsetX + childWidth / 2 - NODE_WIDTH / 2
        buildGraph(input, nodes, edges, childX, y + NODE_HEIGHT + V_GAP, id)
        offsetX += childWidth + H_GAP
    }
}

export function treeToGraph(tree: ProductionNode): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []
    buildGraph(tree, nodes, edges, 0, 0, null)
    return { nodes, edges }
}