// Rasterize the OG image source (public/og-image.svg) to public/og-image.png.
// Social scrapers (Twitter/X, Facebook, LinkedIn) require a raster image, not SVG.
// Run: node scripts/make-og.mjs   (regenerate whenever og-image.svg changes)
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public', 'og-image.svg'));

await sharp(svg, { density: 144 })
  .resize(1200, 630)
  .png()
  .toFile(join(root, 'public', 'og-image.png'));

console.log('✓ wrote public/og-image.png (1200×630)');
