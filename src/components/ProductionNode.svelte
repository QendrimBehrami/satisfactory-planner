<script lang="ts">
    import { Handle, Position } from "@xyflow/svelte";
    import { getIconPath } from "$lib/data";

    let { data } = $props();

    function formatNumber(n: number): string {
        const rounded = Math.round(n * 100) / 100;
        return Number.isInteger(rounded)
            ? rounded.toString()
            : rounded.toFixed(2);
    }
</script>

<Handle
    type="source"
    position={data.horizontalLayout ? Position.Right : Position.Top}
    style={data.hasParent ? "opacity: 1" : "opacity: 0; pointer-events: none"}
/>

<div
    class="node"
    class:resource={data.isResource}
    class:output={data.isOutput && !data.isByproduct}
    class:byproduct={data.isByproduct}
    class:horizontal={data.horizontal}
>
    <!-- Header: Icon + Name + Building -->
    <div class="header">
        <img
            src={getIconPath(data.label)}
            alt={data.label}
            loading="lazy"
            class="icon"
            onerror={(e) => (e.currentTarget.style.display = "none")}
        />
        <div class="header-text">
            <p class="name">{formatNumber(data.rate)} {data.label}</p>
            {#if !data.isResource && !data.isOutput}
                <p class="building">
                    {formatNumber(data.machines)}
                    {data.buildingName}
                </p>
            {/if}
        </div>
    </div>

    {#if !data.isResource && !data.isOutput && data.availableRecipes?.length > 1}
        <div class="recipe-select">
            <select
                value={data.recipeId}
                onchange={(e) => data.onRecipeChange?.(data.itemId, e.currentTarget.value)}
            >
                {#each data.availableRecipes as recipe}
                    <option value={recipe.value}>{recipe.label}</option>
                {/each}
            </select>
        </div>
    {/if}

    {#if !data.isResource && !data.isOutput}
        <!-- Inputs -->
        <div class="section">
            <p class="section-label">IN</p>
            {#each data.inputs as input}
                <div class="row">
                    <span class="item-name">{input.name}</span>
                    <span class="rate">{formatNumber(input.rate)}/min</span>
                </div>
            {/each}
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Output -->
        <!-- <div class="section">
            <p class="section-label">OUT</p>
            <div class="row">
                <span class="item-name">{data.label}</span>
                <span class="rate">{formatNumber(data.rate)}/min</span>
            </div>
        </div> -->

        <!-- Stats -->
        <!-- <div class="divider"></div>
        <div class="stats">
            <span>{formatNumber(data.machines)}×</span>
            <span>{formatNumber(data.power)} MW</span>
        </div> -->
        <!-- {:else}
        <div class="section">
            <div class="row">
                <span class="rate">{formatNumber(data.rate)}/min</span>
            </div>
        </div> -->
    {/if}
</div>

<Handle
    type="target"
    position={data.horizontalLayout ? Position.Left : Position.Bottom}
    style={data.isResource ? "opacity: 0" : "opacity: 1;"}
/>

<style>
    .node {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        min-width: 200px;
        font-size: 12px;
        font-family: var(--font-sans, Inter, sans-serif);
    }

    .resource {
        border-color: #f97316;
        background: #fff7ed;
    }

    .output {
        border-color: #22c55e;
        background: #f0fdf4;
    }

    .output .name {
        color: #166534;
    }

    .byproduct {
        border: 1px dashed #d97706;
        background: #fffbeb;
    }

    .byproduct .name {
        color: #92400e;
    }

    .recipe-select {
        padding: 4px 8px;
        border-bottom: 1px solid #e2e8f0;
    }

    .recipe-select select {
        width: 100%;
        font-size: 11px;
        color: #555;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 2px 4px;
        cursor: pointer;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-bottom: 1px solid #e2e8f0;
    }

    .resource .header {
        border-bottom-color: #fed7aa;
    }

    .icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .header-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .name {
        font-weight: 600;
        color: #1a1a1a;
    }

    .building {
        color: #888;
        font-size: 11px;
    }

    .section {
        padding: 6px 10px;
    }

    .section-label {
        font-size: 10px;
        font-weight: 600;
        color: #aaa;
        margin-bottom: 3px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
    }

    .item-name {
        color: #444;
    }

    .rate {
        color: #666;
        font-variant-numeric: tabular-nums;
    }

    .divider {
        height: 1px;
        background: #e2e8f0;
    }

    .stats {
        display: flex;
        justify-content: space-between;
        padding: 6px 10px;
        color: #888;
        font-size: 11px;
    }

    .horizontal {
        min-width: 160px;
        max-width: 160px;
    }
</style>
