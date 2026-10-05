// Descarga las fotos del catálogo desde la web antigua y las guarda optimizadas (WebP)
// en public/img/products, para que la web nueva no dependa de flordlotosegovia.com.
//
// Uso: npm run images            (descarga solo las que faltan)
//      npm run images -- --force (vuelve a descargarlas todas)
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const REMOTE = 'https://flordlotosegovia.com/assets/img/products/';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/img/products');
const MAX_WIDTH = 1400; // suficiente para la ficha de producto en pantallas retina
const force = process.argv.includes('--force');

// Misma regla que img() en src/data/products.ts
const localName = (src) => decodeURIComponent(src).replace(/\s+/g, '-').replace(/\.(jpe?g|png)$/i, '.webp');

const source = await fs.readFile(path.join(ROOT, 'src/data/products.ts'), 'utf8');
const sources = [...new Set([...source.matchAll(/img\('([^']+)'\)/g)].map((m) => m[1]))];
console.log(`${sources.length} imágenes en el catálogo`);

let ok = 0, skipped = 0;
const failed = [];
for (const src of sources) {
  const dest = path.join(OUT, localName(src));
  if (!force && (await fs.stat(dest).catch(() => null))) { skipped++; continue; }
  try {
    const res = await fetch(REMOTE + src, { headers: { 'User-Agent': 'Mozilla/5.0 (FlorDeLoto image sync)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp(buf).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
    ok++;
    process.stdout.write('.');
  } catch (e) {
    failed.push(`${src} (${e.message})`);
  }
}
console.log(`\nDescargadas: ${ok} · ya existían: ${skipped} · fallidas: ${failed.length}`);
if (failed.length) {
  console.log(failed.map((f) => '  - ' + f).join('\n'));
  process.exitCode = 1;
}
