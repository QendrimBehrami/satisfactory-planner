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
    class:done={data.isDone}
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
        {#if !data.isResource && !data.isOutput && !data.isByproduct}
            <div class="actions">
                <button
                    class="action-btn"
                    class:active={data.isDone}
                    title={data.isDone ? "Mark as not done" : "Mark as done"}
                    onclick={() => data.onToggleDone?.(data.itemId)}
                >✓</button>
                <button
                    class="action-btn"
                    class:active={data.isCollapsed}
                    title={data.isCollapsed ? "Expand" : "Collapse"}
                    onclick={() => data.onToggleCollapse?.(data.itemId)}
                >{data.isCollapsed ? "▶" : "▼"}</button>
            </div>
        {/if}
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

    {#if data.isCollapsed && data.hiddenInputCount > 0}
        <div class="collapsed-indicator">
            {data.hiddenInputCount} input{data.hiddenInputCount > 1 ? "s" : ""} hidden
        </div>
    {/if}

    {#if !data.isResource && !data.isOutput}
        <!-- Inputs -->
        <div class="section">
            <p class="section-label">IN</p>
            {#each data.inputs as input}
                <div class="row">
                    <div class="input-label">
                        <img
                            src={getIconPath(input.name)}
                            alt={input.name}
                            class="input-icon"
                            onerror={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <span class="item-name">{input.name}</span>
                    </div>
                    <span class="rate">{formatNumber(input.rate)}/min</span>
                </div>
            {/each}
        </div>

    {/if}
</div>

<Handle
    type="target"
    position={data.horizontalLayout ? Position.Left : Position.Bottom}
    style={data.isResource || data.isCollapsed ? "opacity: 0; pointer-events: none" : "opacity: 1;"}
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

    .done {
        opacity: 0.5;
    }

    .actions {
        display: flex;
        gap: 2px;
        margin-left: auto;
        flex-shrink: 0;
    }

    .action-btn {
        width: 20px;
        height: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
        font-size: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #aaa;
        padding: 0;
    }

    .action-btn:hover {
        border-color: #cbd5e1;
        color: #555;
    }

    .action-btn.active {
        background: #f0fdf4;
        border-color: #22c55e;
        color: #16a34a;
    }

    .collapsed-indicator {
        padding: 4px 10px;
        font-size: 10px;
        color: #aaa;
        font-style: italic;
        border-top: 1px solid #e2e8f0;
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

    .input-label {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }

    .input-icon {
        width: 14px;
        height: 14px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .item-name {
        color: #444;
    }

    .rate {
        color: #666;
        font-variant-numeric: tabular-nums;
    }

</style>
