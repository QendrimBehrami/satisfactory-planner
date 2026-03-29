<script lang="ts">
    import { tick } from "svelte";
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { Button } from "$lib/components/ui/button/index.js";

    let {
        value = $bindable(""),
        options = [],
        placeholder = "Search...",
        onchange,
    }: {
        value: string;
        options: { value: string; label: string }[];
        placeholder?: string;
        onchange?: (value: string) => void;
    } = $props();

    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);

    const selectedLabel = $derived(
        options.find((o) => o.value === value)?.label,
    );

    function closeAndFocusTrigger() {
        open = false;
        tick().then(() => {
            triggerRef.focus();
        });
    }
</script>

<Popover.Root bind:open>
    <Popover.Trigger bind:ref={triggerRef}>
        {#snippet child({ props })}
            <Button
                {...props}
                variant="outline"
                class="w-full justify-between"
                role="combobox"
                aria-expanded={open}
            >
                {selectedLabel || placeholder}
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-[300px] p-0">
        <Command.Root
            filter={(itemValue, search) => {
                const label =
                    options.find((o) => o.value === itemValue)?.label ?? "";
                return label.toLowerCase().includes(search.toLowerCase())
                    ? 1
                    : 0;
            }}
        >
            <Command.Input {placeholder} />
            <Command.List>
                <Command.Empty>No results found.</Command.Empty>
                <Command.Group>
                    {#each options as option (option.value)}
                        <Command.Item
                            value={option.value}
                            onSelect={() => {
                                value = option.value;
                                onchange?.(option.value);
                                closeAndFocusTrigger();
                            }}
                        >
                            {option.label}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
