# satisfactory-planner

A production chain calculator for Satisfactory 1.0.

## Setup
```bash
npm install
npm run dev
```

## Data

Recipes are parsed from Satisfactory's `en-US.json` file located at:
`Steam/steamapps/common/Satisfactory/CommunityResources/Docs/en-US.json`

To update recipe data after a game update, copy `en-US.json` into the project root and run:
```bash
node parse.js
```

## Stack

- Vite + Svelte
- Tailwind CSS
- Svelte Flow