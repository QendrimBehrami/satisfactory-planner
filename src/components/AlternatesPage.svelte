<script lang="ts">
    import { recipes, items, getIconPath } from '$lib/data'
    import { unlockedAlternates } from '$lib/settings'

    const alternates = recipes.filter(r => r.alternate)

    // Group by primary output item
    const grouped: { itemId: string; itemName: string; recipes: typeof alternates }[] = []
    const seen = new Map<string, number>()

    for (const recipe of alternates) {
        const primaryOutput = recipe.outputs[0].item
        if (!seen.has(primaryOutput)) {
            seen.set(primaryOutput, grouped.length)
            grouped.push({
                itemId: primaryOutput,
                itemName: items[primaryOutput]?.name ?? primaryOutput,
                recipes: [],
            })
        }
        grouped[seen.get(primaryOutput)!].recipes.push(recipe)
    }

    grouped.sort((a, b) => a.itemName.localeCompare(b.itemName))

    function toggle(recipeId: string) {
        unlockedAlternates.update(set => {
            const next = new Set(set)
            if (next.has(recipeId)) next.delete(recipeId)
            else next.add(recipeId)
            return next
        })
    }

    function toggleAll(recipeIds: string[], value: boolean) {
        unlockedAlternates.update(set => {
            const next = new Set(set)
            for (const id of recipeIds) {
                if (value) next.add(id)
                else next.delete(id)
            }
            return next
        })
    }

    const allIds = alternates.map(r => r.id)
    let allChecked = $derived(allIds.every(id => $unlockedAlternates.has(id)))

    let search = $state('')
    let filteredGroups = $derived(
        search.trim() === ''
            ? grouped
            : grouped
                .map(g => ({
                    ...g,
                    recipes: g.recipes.filter(r =>
                        r.name.toLowerCase().includes(search.toLowerCase()) ||
                        g.itemName.toLowerCase().includes(search.toLowerCase())
                    ),
                }))
                .filter(g => g.recipes.length > 0)
    )
</script>

<div class="page">
    <div class="header">
        <h1>Alternate Recipes</h1>
        <input
            class="search"
            type="text"
            placeholder="Search..."
            bind:value={search}
        />
        <label class="toggle-all">
            <input
                type="checkbox"
                checked={allChecked}
                onchange={(e) => toggleAll(allIds, e.currentTarget.checked)}
            />
            Select all
        </label>
    </div>

    <div class="groups">
        {#each filteredGroups as group}
            <div class="group">
                <div class="group-header">
                    <img
                        src={getIconPath(group.itemName)}
                        alt=""
                        class="group-icon"
                        onerror={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <span class="group-name">{group.itemName}</span>
                </div>
                <div class="group-recipes">
                    {#each group.recipes as recipe}
                        {@const checked = $unlockedAlternates.has(recipe.id)}
                        <label class="recipe-row" class:checked>
                            <input
                                type="checkbox"
                                {checked}
                                onchange={() => toggle(recipe.id)}
                            />
                            <span class="recipe-name">{recipe.name}</span>
                            <span class="recipe-io">
                                {recipe.inputs.map(i => `${items[i.item]?.name ?? i.item} ×${i.amount}`).join(', ')}
                                → {recipe.outputs.map(o => `${items[o.item]?.name ?? o.item} ×${o.amount}`).join(', ')}
                            </span>
                        </label>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .page {
        padding: 24px 32px;
        overflow-y: auto;
        height: 100%;
        box-sizing: border-box;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
    }

    h1 {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
    }

    .search {
        padding: 6px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        outline: none;
        width: 200px;
    }

    .search:focus {
        border-color: #94a3b8;
    }

    .toggle-all {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #666;
        cursor: pointer;
    }

    .groups {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .group {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
    }

    .group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
    }

    .group-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
    }

    .group-name {
        font-size: 13px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .group-recipes {
        display: flex;
        flex-direction: column;
    }

    .recipe-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        font-size: 12px;
        cursor: pointer;
        border-bottom: 1px solid #e2e8f0;
    }

    .recipe-row:last-child {
        border-bottom: none;
    }

    .recipe-row:hover {
        background: #f1f5f9;
    }

    .recipe-row.checked {
        background: #f0fdf4;
    }

    .recipe-name {
        font-weight: 500;
        color: #1a1a1a;
        white-space: nowrap;
        min-width: 200px;
    }

    .recipe-io {
        color: #666;
        font-size: 11px;
    }
</style>
