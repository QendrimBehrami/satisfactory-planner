# satisfactory-planner

A production chain calculator for Satisfactory 1.0. Plan your factories with an interactive node graph.

## Live Demo

https://qendrimbehrami.github.io/satisfactory-planner/

## Setup
```bash
npm install
npm run dev
```

## Updating Recipe Data

Recipes are parsed from Satisfactory's `en-US.json` file located at:
`Steam/steamapps/common/Satisfactory/CommunityResources/Docs/en-US.json`

Copy `en-US.json` into the project root and run:
```bash
npm run parse
```

To fetch item icons from the Satisfactory Wiki:
```bash
npm run fetch-icons
npm run convert-icons # Converts png files to webp
```

## Deploy to GitHub Pages
```bash
npm run deploy
```

## Stack

- Vite + Svelte + TypeScript
- Tailwind CSS + shadcn-svelte
- Svelte Flow + Dagre

## Credits

<p>
Game assets and item icons are property of
<strong class="text-foreground">Coffee Stain Studios</strong>.
This is an unofficial community tool, not affiliated with Coffee Stain Studios.
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