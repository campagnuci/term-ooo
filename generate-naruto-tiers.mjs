// generate-naruto-tiers.mjs
// Gera em database/ cinco datasets no MESMO schema do jogo Shinobi, um por
// nível de filtragem, para validação amostral de qual pool usar:
//
//   tier 1: API completa (todos os personagens)
//   tier 2: sem personagens que estreiam apenas em Boruto
//   tier 3: apenas quem tem estreia parseável no anime Naruto/Shippūden
//   tier 4: "jogáveis" (tier 3 + imagem + gênero + afiliação + jutsu/natureza)
//   tier 5: pool curado atual do jogo (mesmo conteúdo de src/naruto/data)
//
// Uso:  node generate-naruto-tiers.mjs
//
// Os arquivos incluem um campo extra `debutAnime` (string crua da API) para
// facilitar a conferência; o jogo em si não usa esse campo.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API, ARCS, CURATED_NAMES, fetchAll, findArc, normalizeCharacter, OVERRIDES } from './naruto-data-lib.mjs'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'database')

const all = await fetchAll()

const arr = v => (v == null ? [] : Array.isArray(v) ? v : [v])
const debutAnimeOf = raw => OVERRIDES[raw.name]?.debutAnime ?? raw.debut?.anime ?? null

// Predicados progressivos (cada tier é um subconjunto do anterior)
const notBorutoOnly = raw => !/^Boruto/i.test(debutAnimeOf(raw) ?? '')
const hasParseableArc = raw => findArc(debutAnimeOf(raw)) != null
const isPlayable = raw =>
  hasParseableArc(raw) &&
  Array.isArray(raw.images) && raw.images.length > 0 &&
  (raw.personal?.sex === 'Male' || raw.personal?.sex === 'Female') &&
  arr(raw.personal?.affiliation).length > 0 &&
  (arr(raw.jutsu).length > 0 || arr(raw.natureType).length > 0)
const curatedSet = new Set(CURATED_NAMES)
const isCurated = raw => curatedSet.has(raw.name) && hasParseableArc(raw)

const TIERS = [
  {
    file: 'naruto-tier1-api-completa.json',
    criteria: 'Todos os personagens da API, sem filtro. debutArc/arcOrder ficam nulos quando a estreia não é um episódio de Naruto/Shippūden.',
    filter: () => true,
  },
  {
    file: 'naruto-tier2-sem-boruto.json',
    criteria: 'Remove personagens cuja estreia no anime é em Boruto (fora do escopo Naruto/Shippūden).',
    filter: notBorutoOnly,
  },
  {
    file: 'naruto-tier3-estreia-no-anime.json',
    criteria: 'Apenas personagens com estreia parseável em episódio de Naruto ou Naruto Shippūden (categoria "Estreia" sempre presente).',
    filter: hasParseableArc,
  },
  {
    file: 'naruto-tier4-jogaveis.json',
    criteria: 'Tier 3 + imagem + gênero definido + afiliação + (jutsu ou natureza de chakra): mínimo para as dicas não virarem um mar de "Nenhum".',
    filter: isPlayable,
  },
  {
    file: 'naruto-tier5-pool-atual.json',
    criteria: 'Pool curado manualmente usado hoje pelo jogo (nomes notáveis; mesmo conteúdo de src/naruto/data/characters.json).',
    filter: isCurated,
  },
]

mkdirSync(OUT_DIR, { recursive: true })

for (const tier of TIERS) {
  const characters = all
    .filter(tier.filter)
    .map(raw => {
      const { char } = normalizeCharacter(raw, { requireArc: false })
      return { ...char, debutAnime: debutAnimeOf(raw) }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const out = join(OUT_DIR, tier.file)
  writeFileSync(out, JSON.stringify({
    generatedFrom: API,
    criteria: tier.criteria,
    count: characters.length,
    arcs: ARCS.map(a => a.name),
    characters,
  }, null, 2))
  console.log(`✔ ${tier.file}: ${characters.length} personagens`)
}
