<script lang="ts">
  import { SvelteFlow, Background } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { calculate } from "./lib/calculator";
  import { treeToGraph } from "./lib/graph";
  import ProductionNode from "./components/ProductionNode.svelte";

  const nodeTypes = { production: ProductionNode };

  const tree = calculate("Desc_Motor_C", 10);
  const { nodes: initialNodes, edges: initialEdges } = treeToGraph(tree);

  const nodes = $state(initialNodes);
  const edges = $state(initialEdges);
</script>

<div style="height: 100vh;">
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    fitView
    fitViewOptions={{ padding: 0.2 }}
  >
    <Background />
  </SvelteFlow>
</div>
