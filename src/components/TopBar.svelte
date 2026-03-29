<script lang="ts">
    import {
        plans,
        activePlanId,
        activePlan,
        addPlan,
        deletePlan,
        updatePlan,
    } from "$lib/plans";
    import { graphOptions } from "$lib/settings";
    import { getIconPath, itemOptions, items } from "$lib/data";
    import Combobox from "./Combobox.svelte";

    let settingsOpen = $state(false);
    let editingPlanId = $state<string | null>(null);
    let editingName = $state("");

    function startRename(planId: string, currentName: string) {
        editingPlanId = planId;
        editingName = currentName;
    }

    function commitRename(planId: string) {
        if (editingName.trim())
            updatePlan(planId, { name: editingName.trim() });
        editingPlanId = null;
    }

    function handleRenameKeydown(e: KeyboardEvent, planId: string) {
        if (e.key === "Enter") commitRename(planId);
        if (e.key === "Escape") editingPlanId = null;
    }

    function focusEl(node: HTMLElement) {
        node.focus();
    }
</script>

<svelte:window
    onclick={() => {
        if (settingsOpen) settingsOpen = false;
    }}
/>

<div class="topbar">
    <div class="brand">
        <span class="brand-name">Satisfactory Planner</span>
    </div>

    <div class="divider-v"></div>

    <div class="tabs">
        {#each $plans as plan (plan.id)}
            {@const isActive = plan.id === $activePlanId}
            {@const iconId = plan.iconItemId ?? plan.itemId}
            <div
                class="tab"
                class:active={isActive}
                role="button"
                tabindex="0"
                onclick={() => activePlanId.set(plan.id)}
                onkeydown={(e) => e.key === 'Enter' && activePlanId.set(plan.id)}
            >
                <img
                    src={getIconPath(items[iconId]?.name ?? "")}
                    alt=""
                    class="tab-icon"
                    onerror={(e) => (e.currentTarget.style.display = "none")}
                />
                {#if editingPlanId === plan.id}
                    <input
                        class="tab-input"
                        bind:value={editingName}
                        onblur={() => commitRename(plan.id)}
                        onkeydown={(e) => handleRenameKeydown(e, plan.id)}
                        onclick={(e) => e.stopPropagation()}
                        use:focusEl
                    />
                {:else}
                    <span
                        class="tab-name"
                        ondblclick={(e) => {
                            e.stopPropagation();
                            startRename(plan.id, plan.name);
                        }}>{plan.name}</span
                    >
                {/if}
                {#if $plans.length > 1}
                    <button
                        class="tab-close"
                        onclick={(e) => {
                            e.stopPropagation();
                            deletePlan(plan.id);
                        }}
                        aria-label="Delete plan">×</button
                    >
                {/if}
            </div>
        {/each}
        <button class="tab-add" onclick={addPlan} aria-label="Add plan"
            >+</button
        >
    </div>

    <div class="divider-v"></div>

    {#if $activePlan}
        <div class="controls">
            <Combobox
                value={$activePlan.itemId}
                onchange={(val) => updatePlan($activePlan.id, { itemId: val })}
                options={itemOptions}
                placeholder="Select item..."
            />
            <div class="rate-wrap">
                <span class="rate-label">Rate</span>
                <input
                    type="number"
                    value={$activePlan.rate}
                    oninput={(e) =>
                        updatePlan($activePlan.id, {
                            rate: Number(e.currentTarget.value),
                        })}
                    class="rate-input"
                    min="0"
                />
                <span class="rate-unit">/min</span>
            </div>
        </div>
    {/if}

    <div class="spacer"></div>

    <div class="settings-wrap">
        <button
            class="settings-btn"
            class:active={settingsOpen}
            onclick={(e) => {
                e.stopPropagation();
                settingsOpen = !settingsOpen;
            }}
            aria-label="Settings">⚙</button
        >
        {#if settingsOpen}
            <div class="settings-popover" onclick={(e) => e.stopPropagation()}>
                <label>
                    <input
                        type="checkbox"
                        bind:checked={$graphOptions.animatedEdges}
                    />
                    Animated edges
                </label>
                <label>
                    <input
                        type="checkbox"
                        bind:checked={$graphOptions.horizontalLayout}
                    />
                    Horizontal layout
                </label>
                <label>
                    <input
                        type="checkbox"
                        bind:checked={$graphOptions.autoMerge}
                    />
                    Auto-merge nodes
                </label>
            </div>
        {/if}
    </div>
</div>

<style>
    .topbar {
        height: 56px;
        display: flex;
        align-items: center;
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 0 12px;
        gap: 8px;
        flex-shrink: 0;
        position: relative;
        z-index: 10;
    }

    .brand-name {
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
        white-space: nowrap;
    }

    .divider-v {
        width: 1px;
        height: 24px;
        background: #e2e8f0;
        flex-shrink: 0;
    }

    .tabs {
        display: flex;
        align-items: center;
        gap: 2px;
        overflow-x: auto;
        max-width: 500px;
    }

    .tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: #666;
        white-space: nowrap;
    }

    .tab:hover {
        background: #f1f5f9;
    }

    .tab.active {
        background: #f1f5f9;
        border-color: #e2e8f0;
        color: #1a1a1a;
        font-weight: 500;
    }

    .tab-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .tab-name {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tab-input {
        width: 90px;
        font-size: 12px;
        border: none;
        outline: 1px solid #94a3b8;
        border-radius: 3px;
        padding: 1px 4px;
        background: white;
    }

    .tab-close {
        font-size: 14px;
        color: #bbb;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0 2px;
        line-height: 1;
    }

    .tab-close:hover {
        color: #ef4444;
    }

    .tab-add {
        font-size: 16px;
        color: #aaa;
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .tab-add:hover {
        background: #f1f5f9;
        color: #555;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .rate-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        color: #888;
    }

    .rate-wrap:focus-within {
        border-color: #94a3b8;
    }

    .rate-label {
        font-size: 11px;
        color: #aaa;
    }

    .rate-unit {
        font-size: 11px;
        color: #aaa;
    }

    .rate-input {
        width: 50px;
        border: none;
        outline: none;
        font-size: 13px;
        color: #1a1a1a;
        padding: 0;
    }

    .spacer {
        flex: 1;
    }

    .settings-wrap {
        position: relative;
    }

    .settings-btn {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
    }

    .settings-btn:hover,
    .settings-btn.active {
        background: #f1f5f9;
        border-color: #e2e8f0;
    }

    .settings-popover {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        white-space: nowrap;
        z-index: 100;
    }

    .settings-popover label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #444;
        cursor: pointer;
    }
</style>
