<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";

    let open = $state(!localStorage.getItem("welcomed"));

    function dismiss() {
        localStorage.setItem("welcomed", "true");
        open = false;
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title>Satisfactory Planner</Dialog.Title>
            <Dialog.Description>
                A production chain calculator for Satisfactory 1.2
            </Dialog.Description>
        </Dialog.Header>

        <div class="text-sm text-muted-foreground space-y-3 py-2">
            <p>
                Game assets and item icons are property of
                <strong class="text-foreground">Coffee Stain Studios</strong>.
                This is an unofficial community tool, not affiliated with Coffee
                Stain Studios.
            </p>
            <p>
                Node graph powered by <a
                    href="https://svelteflow.dev"
                    target="_blank"
                    class="underline">Svelte Flow</a
                >
                by the
                <a href="https://xyflow.com" target="_blank" class="underline"
                    >xyflow</a
                > team.
            </p>
        </div>

        <Dialog.Footer>
            <Button onclick={dismiss}>Got it!</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
