<script lang="ts">
  import { SvelteFlow, Background, MarkerType, type Node, type Edge } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { calculate } from "./lib/calculator";
  import { treeToGraph } from "./lib/graph";
  import ProductionNode from "./components/ProductionNode.svelte";
  import WelcomeModal from "./components/WelcomeModal.svelte";
  import TopBar from "./components/TopBar.svelte";
  import { graphOptions } from "$lib/settings";
  import { activePlan, updatePlan } from "$lib/plans";

  const nodeTypes = { production: ProductionNode };

  const callbacks = {
    onRecipeChange: (itemId: string, recipeId: string) =>
      updatePlan($activePlan.id, {
        recipeOverrides: { ...$activePlan.recipeOverrides, [itemId]: recipeId },
      }),
    onToggleDone: (itemId: string) =>
      updatePlan($activePlan.id, {
        doneNodes: { ...$activePlan.doneNodes, [itemId]: !$activePlan.doneNodes[itemId] },
      }),
    onToggleCollapse: (itemId: string) =>
      updatePlan($activePlan.id, {
        collapsedNodes: { ...$activePlan.collapsedNodes, [itemId]: !$activePlan.collapsedNodes[itemId] },
      }),
  }

  let graph = $state<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
  let selectedNodeId = $state<string | null>(null);

  $effect(() => {
    if (!$activePlan?.itemId || $activePlan.rate <= 0) {
      graph = { nodes: [], edges: [] };
      return;
    }
    treeToGraph(
      calculate($activePlan.itemId, $activePlan.rate, $activePlan.recipeOverrides),
      $graphOptions,
      callbacks,
      { doneNodes: $activePlan.doneNodes, collapsedNodes: $activePlan.collapsedNodes },
    ).then(g => { graph = g });
  });

  let edges = $derived(
    selectedNodeId
      ? graph.edges.map(edge => {
          const color = edge.target === selectedNodeId
            ? '#fb923c'
            : edge.source === selectedNodeId
            ? '#4ade80'
            : null
          return {
            ...edge,
            style: color ? `stroke: ${color}; stroke-width: 2` : '',
            markerEnd: color
              ? { type: MarkerType.Arrow, width: 20, height: 20, color }
              : edge.markerEnd,
          }
        })
      : graph.edges
  );
</script>

<WelcomeModal />

<div class="layout">
  <TopBar />
  <div class="canvas">
    <SvelteFlow
      nodes={graph.nodes}
      edges={edges}
      {nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      proOptions={{ hideAttribution: true }}
      onnodeclick={({ node }) => selectedNodeId = node.id}
      onpaneclick={() => selectedNodeId = null}
    >
      <Background />
    </SvelteFlow>
  </div>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .canvas {
    flex: 1;
    overflow: hidden;
  }
</style>
