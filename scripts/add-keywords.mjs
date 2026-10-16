// Genera palabras clave para el buscador a partir de lo que cada producto YA dice (nombre, categoría,
// tipo, ocasiones, composición y descripción). No inventa colores ni flores que no aparezcan.
// Solo rellena los productos que tienen la lista vacía y solo escribe la columna `keywords`.
//
// Uso:  npm run db:keywords            → vista previa (no escribe nada)
//       npm run db:keywords -- --apply → guarda las palabras clave
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) { console.error('Falta DATABASE_URL.'); process.exit(1); }
const apply = process.argv.includes('--apply');
const sql = neon(process.env.DATABASE_URL);

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Si el texto del producto contiene el patrón, se añaden estas palabras.
const RULES = [
  [/\brosa/, ['rosa', 'rosas']],
  [/clavel/, ['clavel', 'claveles']],
  [/girasol/, ['girasol', 'girasoles']],
  [/lirio/, ['lirio', 'lirios']],
  [/orquidea|phalaenopsis/, ['orquídea', 'orquídeas']],
  [/bonsai/, ['bonsái', 'bonsai', 'árbol en miniatura']],
  [/ficus/, ['ficus']],
  [/croton/, ['croton', 'planta de hoja colorida']],
  [/anthurium|anturio/, ['anthurium', 'anturio']],
  [/terrari/, ['terrario']],
  [/novia|boda/, ['novia', 'boda', 'bodas']],
  [/preservad/, ['preservada', 'eterna', 'dura mucho tiempo']],
  [/\bpack\b/, ['pack', 'regalo']],
  [/amor|pasion|te amo/, ['amor', 'romántico']],
  [/blanc[oa]/, ['blanco', 'blanca']],
  [/\bcupula|cupula\b/, ['cúpula']],
  [/gerbera/, ['gerbera', 'gerberas']],
  [/margarita/, ['margarita', 'margaritas']],
  [/eucalipto/, ['eucalipto', 'aroma']],
  [/cesta/, ['cesta']],
  [/centro funerario|centro de laurel/, ['centro funerario', 'centro de flores']],
  [/corona/, ['corona']],
];
const CATEGORY = {
  // El nombre corto de la categoría («Rosas», «Plantas»…) ya se busca por sí solo.
  rosas: ['regalo', 'flores'],
  ramos: ['ramo', 'ramo de flores', 'flores'],
  plantas: ['planta'],
  funerales: ['funerario', 'pésame', 'difuntos', 'luto', 'tanatorio', 'condolencias'],
};
const OCCASION = [
  [/san valentin/, ['san valentín', 'enamorados', 'amor', 'regalo romántico']],
  [/aniversario/, ['aniversario', 'regalo de aniversario']],
  [/cumple/, ['cumpleaños', 'cumple']],
  [/animo/, ['ánimo', 'alegría']],
  [/felicita/, ['felicitación', 'felicitaciones']],
  [/nacimiento/, ['nacimiento', 'bebé', 'recién nacido']],
  [/agradecimiento/, ['agradecimiento', 'gracias']],
  [/declaracion/, ['declaración de amor']],
  [/celebracion/, ['celebración', 'fiesta']],
  [/\bamor\b/, ['amor', 'romántico']],
  [/recuerdo/, ['recuerdo']],
];

const rows = await sql`
  select p.id, p.slug, p.name, p.category_id, p.subcategory, p.description, p.composition, p.occasions, p.keywords
    from products p order by p.category_id, p.name`;

const unique = (list) => {
  const seen = new Set(); const out = [];
  for (const k of list) { const n = norm(k); if (!seen.has(n)) { seen.add(n); out.push(k); } }
  return out;
};

let changed = 0;
for (const p of rows) {
  if (p.keywords.length) { console.log(`= ${p.name}: ya tiene palabras clave, se respeta.`); continue; }
  const own = norm([p.name, p.subcategory ?? '', p.description, p.composition.join(' ')].join(' '));
  const occ = norm(p.occasions.join(' '));
  const kw = [...(CATEGORY[p.category_id] ?? [])];
  for (const [re, add] of RULES) if (re.test(own)) kw.push(...add);
  for (const [re, add] of OCCASION) if (re.test(occ)) kw.push(...add);
  if (p.subcategory) kw.push(p.subcategory.toLowerCase());
  // Quita las que ya son el propio nombre.
  const name = norm(p.name);
  const final = unique(kw).filter((k) => norm(k) !== name).slice(0, 20);
  console.log(`+ ${p.name} [${p.category_id}] → ${final.join(', ')}`);
  if (apply) { await sql`update products set keywords = ${final} where id = ${p.id}`; changed++; }
}
console.log(apply ? `\nGuardadas palabras clave en ${changed} productos.` : '\nVista previa: no se ha escrito nada. Usa --apply para guardar.');
