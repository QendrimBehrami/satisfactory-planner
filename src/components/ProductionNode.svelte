<script lang="ts">
    import { Handle, Position } from "@xyflow/svelte";

    let { data } = $props();
</script>

{#if data.hasParent}
    <Handle type="target" position={Position.Top} />
{/if}

<div class="node" class:resource={data.isResource}>
    {#if !data.isResource}
        <p class="stat">{data.buildingName}</p>
    {/if}
    <p class="name">{data.label}</p>
    <p class="stat">{data.rate.toFixed(1)}/min</p>
    {#if !data.isResource}
        <p class="stat">{data.machines.toFixed(2)} machines</p>
        <p class="stat">{data.power.toFixed(1)} MW</p>
    {/if}
</div>

{#if !data.isResource}
    <Handle type="source" position={Position.Bottom} />
{/if}

<style>
    .node {
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 160px;
        font-size: 12px;
    }
    .resource {
        border-color: #22c55e;
        background: #f0fdf4;
    }
    .name {
        font-weight: 600;
        margin-bottom: 4px;
    }
    .stat {
        color: #666;
    }
</style>
