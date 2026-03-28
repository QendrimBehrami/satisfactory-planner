<script lang="ts">
  import { SvelteFlow, Background } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { calculate } from "./lib/calculator";
  import { treeToGraph } from "./lib/graph";
  import ProductionNode from "./components/ProductionNode.svelte";

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

  const nodeTypes = { production: ProductionNode };

  let itemId = $state("Desc_Motor_C");
  let rate = $state(10);

  let tree = $derived(calculate(itemId, rate));
  let graph = $derived(treeToGraph(tree));
</script>

<Provider class="" style="">
  <Root class="" style="">
    <Header class="" style="">
      <p class="font-semibold text-sm px-2">Satisfactory Planner</p>
    </Header>

    <Content class="" style="">
      <Group class="" style="">
        <GroupLabel class="" style="">Target</GroupLabel>
        <GroupContent class="" style="">
          <div class="flex flex-col gap-2 px-2">
            <input
              type="text"
              bind:value={itemId}
              placeholder="Item ID"
              class="border rounded px-2 py-1 text-sm w-full"
            />
            <input
              type="number"
              bind:value={rate}
              placeholder="Rate/min"
              class="border rounded px-2 py-1 text-sm w-full"
            />
          </div>
        </GroupContent>
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
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
      </SvelteFlow>
    </div>
  </Inset>
</Provider>
