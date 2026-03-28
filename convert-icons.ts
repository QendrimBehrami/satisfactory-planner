// convert-icons.ts
import sharp from 'sharp'
import { readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const ICONS_DIR = join(process.cwd(), 'public/icons')

const files = readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'))
console.log(`Converting ${files.length} PNGs to WebP...`)

for (const file of files) {
    const input = join(ICONS_DIR, file)
    const output = join(ICONS_DIR, file.replace('.png', '.webp'))
    await sharp(input)
        .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90 })
        .toFile(output)
    unlinkSync(input) // PNG löschen
    console.log(`  ✓ ${file}`)
}

console.log('Done!')