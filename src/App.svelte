<script lang="ts">
  import { SvelteFlow, Background } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { calculate } from "./lib/calculator";
  import { treeToGraph } from "./lib/graph";
  import ProductionNode from "./components/ProductionNode.svelte";
  import WelcomeModal from "./components/WelcomeModal.svelte";
  import {
    Provider,
    Root,
    Header,
    Content,
    Group,
    GroupLabel,
    GroupContent,
    Footer,
    Inset,
  } from "$lib/components/ui/sidebar";
  import Combobox from "./components/Combobox.svelte";
  import { itemOptions } from "$lib/data";
  import { graphOptions, recipeOverrides, doneNodes, collapsedNodes } from "$lib/settings";

  const nodeTypes = { production: ProductionNode };

  let itemId = $state(localStorage.getItem("itemId") ?? "Desc_Motor_C");
  let rate = $state(Number(localStorage.getItem("rate") ?? 10));

  $effect(() => {
    localStorage.setItem("itemId", itemId);
    localStorage.setItem("rate", String(rate));
  });

  const callbacks = {
    onRecipeChange: (changedItemId: string, recipeId: string) =>
      recipeOverrides.update(o => ({ ...o, [changedItemId]: recipeId })),
    onToggleDone: (changedItemId: string) =>
      doneNodes.update(o => ({ ...o, [changedItemId]: !o[changedItemId] })),
    onToggleCollapse: (changedItemId: string) =>
      collapsedNodes.update(o => ({ ...o, [changedItemId]: !o[changedItemId] })),
  }

  let graph = $derived(
    itemId && rate > 0
      ? treeToGraph(
          calculate(itemId, rate, $recipeOverrides),
          $graphOptions,
          callbacks,
          { doneNodes: $doneNodes, collapsedNodes: $collapsedNodes },
        )
      : { nodes: [], edges: [] },
  );
</script>

<WelcomeModal />

<Provider class="" style="">
  <Root class="" style="">
    <Header class="" style="">
      <p class="font-semibold text-sm px-2">Satisfactory Planner</p>
    </Header>

    <Content class="" style="">
      <Group class="" style="">
        <GroupLabel>Target</GroupLabel>
        <GroupContent class="" style="">
          <div class="flex flex-col gap-2 px-2">
            <Combobox
              bind:value={itemId}
              options={itemOptions}
              placeholder="Select item..."
            />
            <GroupLabel>Rate</GroupLabel>
            <input
              type="number"
              bind:value={rate}
              placeholder="Items/min"
              class="border rounded px-2 py-1 text-sm w-full"
            />
          </div>
        </GroupContent>
      </Group>
      <Group>
        <GroupLabel>Options</GroupLabel>
        <label class="flex items-center gap-2 px-2 text-sm">
          <input type="checkbox" bind:checked={$graphOptions.animatedEdges} />
          Animated edges
        </label>
        <label class="flex items-center gap-2 px-2 text-sm">
          <input
            type="checkbox"
            bind:checked={$graphOptions.horizontalLayout}
          />
          Horizontal layout
        </label>
        <label class="flex items-center gap-2 px-2 text-sm">
          <input type="checkbox" bind:checked={$graphOptions.autoMerge} />
          Auto-merge nodes
        </label>
      </Group>
    </Content>

    <Footer class="" style=""></Footer>
  </Root>

  <Inset class="" style="">
    <div style="height: 100vh;">
      <SvelteFlow
        nodes={graph.nodes}
        edges={graph.edges}
        {nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </SvelteFlow>
    </div>
  </Inset>
</Provider>
