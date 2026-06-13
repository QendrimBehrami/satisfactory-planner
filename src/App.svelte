<script lang="ts">
  import { untrack } from 'svelte';
  import {
    SvelteFlow,
    Background,
    MarkerType,
    type Node,
    type Edge,
  } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { calculate } from "./lib/calculator";
  import { treeToGraph, buildGraph } from "./lib/graph";
  import ProductionNode from "./components/ProductionNode.svelte";
  import WelcomeModal from "./components/WelcomeModal.svelte";
  import TopBar from "./components/TopBar.svelte";
  import AlternatesPage from "./components/AlternatesPage.svelte";
  import { graphOptions } from "$lib/settings";
  import { activePlan, updatePlan } from "$lib/plans";

  let currentView = $state<'planner' | 'alternates'>('planner');

  const nodeTypes = { production: ProductionNode };

  const callbacks = {
    onRecipeChange: (itemId: string, recipeId: string) =>
      updatePlan($activePlan.id, {
        recipeOverrides: { ...$activePlan.recipeOverrides, [itemId]: recipeId },
      }),
    onToggleDone: (itemId: string) =>
      updatePlan($activePlan.id, {
        doneNodes: {
          ...$activePlan.doneNodes,
          [itemId]: !$activePlan.doneNodes[itemId],
        },
      }),
    onToggleCollapse: (itemId: string) =>
      updatePlan($activePlan.id, {
        collapsedNodes: {
          ...$activePlan.collapsedNodes,
          [itemId]: !$activePlan.collapsedNodes[itemId],
        },
      }),
  };

  let graph = $state<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  let selectedNodeId = $state<string | null>(null);

  // Tracks changes that require a full ELK re-layout
  let layoutKey = '';

  $effect(() => {
    if (!$activePlan?.itemId || $activePlan.rate <= 0) {
      graph = { nodes: [], edges: [] };
      layoutKey = '';
      return;
    }

    const newLayoutKey = [
      $activePlan.id,
      $activePlan.itemId,
      JSON.stringify($activePlan.recipeOverrides),
      JSON.stringify($activePlan.collapsedNodes),
      $graphOptions.autoMerge,
      $graphOptions.horizontalLayout,
    ].join('|');

    const tree = calculate($activePlan.itemId, $activePlan.rate, $activePlan.recipeOverrides);
    const state = { doneNodes: $activePlan.doneNodes, collapsedNodes: $activePlan.collapsedNodes };

    const prevGraph = untrack(() => graph);
    if (newLayoutKey === layoutKey && prevGraph.nodes.length > 0) {
      // Only rate or doneNodes changed — rebuild node data, keep existing positions
      const { nodes, edges } = buildGraph(tree, $graphOptions, callbacks, state);
      const posById = new Map(prevGraph.nodes.map(n => [n.id, n.position]));
      for (const node of nodes) {
        const pos = posById.get(node.id);
        if (pos) node.position = pos;
      }
      graph = { nodes, edges };
      return;
    }

    layoutKey = newLayoutKey;
    treeToGraph(tree, $graphOptions, callbacks, state).then(g => { graph = g; });
  });

  let edges = $derived(
    selectedNodeId
      ? graph.edges.map((edge) => {
          const color =
            edge.target === selectedNodeId
              ? "#fb923c"
              : edge.source === selectedNodeId
                ? "#4ade80"
                : null;
          return {
            ...edge,
            style: color ? `stroke: ${color}; stroke-width: 2` : "",
            markerEnd: color
              ? { type: MarkerType.Arrow, width: 20, height: 20, color }
              : edge.markerEnd,
          };
        })
      : graph.edges,
  );
</script>

<WelcomeModal />

<div class="layout">
  <TopBar bind:currentView />
  {#if currentView === 'alternates'}
    <AlternatesPage />
  {:else}
  <div class="canvas">
    <SvelteFlow
      nodes={graph.nodes}
      {edges}
      {nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      proOptions={{ hideAttribution: true }}
      onnodeclick={({ node }) => (selectedNodeId = node.id)}
      onpaneclick={() => (selectedNodeId = null)}
    >
      <Background />
    </SvelteFlow>
  </div>
  {/if}
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
