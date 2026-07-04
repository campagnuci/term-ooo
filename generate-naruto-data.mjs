// generate-naruto-data.mjs
// Gera o dataset estático do jogo Shinobi (Narutodle) a partir da API pública
// Dattebayo (https://dattebayo-api.onrender.com/characters).
//
// Uso:  node generate-naruto-data.mjs
// Saída: src/naruto/data/characters.json
//
// O jogo NÃO consome a API em runtime (free tier hiberna e derrubaria o jogo);
// este script roda offline/manual e o JSON versionado é a fonte de verdade.
// A lógica de normalização/curadoria vive em naruto-data-lib.mjs (compartilhada
// com generate-naruto-tiers.mjs).

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API, ARCS, CURATED_NAMES, fetchAll, normalizeCharacter } from './naruto-data-lib.mjs'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'src', 'naruto', 'data', 'characters.json')

const all = await fetchAll()
const byName = new Map(all.map(c => [c.name, c]))

const characters = []
const skipped = []
const missing = []

for (const name of CURATED_NAMES) {
  const raw = byName.get(name)
  if (!raw) { missing.push(name); continue }
  const result = normalizeCharacter(raw, { requireArc: true })
  if (result.skipped) skipped.push(result.skipped)
  else characters.push(result.char)
}

characters.sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({
  generatedFrom: API,
  arcs: ARCS.map(a => a.name),
  characters,
}, null, 2))

console.log(`\n✔ ${characters.length} personagens gravados em ${OUT}`)
if (missing.length) console.warn(`\n⚠ Nomes não encontrados na API (${missing.length}):\n  - ${missing.join('\n  - ')}`)
if (skipped.length) console.warn(`\n⚠ Pulados (${skipped.length}):\n  - ${skipped.join('\n  - ')}`)
