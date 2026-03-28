import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import data from './src/data/data.json'

const OUTPUT_DIR = join(process.cwd(), 'public/icons')
const WIKI_BASE = 'https://satisfactory.wiki.gg/images'

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
}

function itemNameToFilename(name: string): string {
    return name.replace(/ /g, '_') + '.png'
}

async function fetchIcon(name: string): Promise<boolean> {
    const filename = itemNameToFilename(name)
    const url = `${WIKI_BASE}/${filename}`
    const outputPath = join(OUTPUT_DIR, filename)

    try {
        const res = await fetch(url)
        if (!res.ok) {
            console.warn(`  ✗ ${name} (${res.status})`)
            return false
        }
        const buffer = await res.arrayBuffer()
        writeFileSync(outputPath, Buffer.from(buffer))
        console.log(`  ✓ ${name}`)
        return true
    } catch (err) {
        console.warn(`  ✗ ${name} (network error)`)
        return false
    }
}

async function main() {
    const items = Object.values(data.items)
    console.log(`Fetching icons for ${items.length} items...\n`)

    let success = 0
    let failed = 0
    const failedItems: string[] = []

    for (const item of items) {
        const ok = await fetchIcon(item.name)
        if (ok) success++
        else { failed++; failedItems.push(item.name) }
        await sleep(5000) // Pause between requests to be polite to the wiki server
    }

    console.log(`\nDone! ${success} succeeded, ${failed} failed.`)

    if (failedItems.length > 0) {
        console.log('\nFailed items:')
        failedItems.forEach(name => console.log(`  - ${name}`))
    }
}

main()