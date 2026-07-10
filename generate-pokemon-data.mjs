// generate-pokemon-data.mjs
// Gera src/pokemon/data/pokemon.json a partir da PokeAPI (endpoint GraphQL),
// no schema consumido pelo jogo Pokédle. Um único conjunto contém todas as
// gerações (1-9) e as formas regionais (Alola/Galar/Hisui/Paldea); o jogo
// filtra o pool conforme o modo escolhido.
//
// Uso:  node generate-pokemon-data.mjs
//
// Estratégia: pagina pokemon_v2_pokemonspecies trazendo, por espécie, cor,
// habitat, geração, o elo anterior de evolução e todas as variedades (com
// tipos/altura/peso). O estágio de evolução é calculado subindo a cadeia via
// evolves_from_species_id. Valores de categoria (tipo/cor/habitat) são
// traduzidos para pt-BR por dicionários locais — nomes de Pokémon ficam em
// inglês (universais), como no dataset do Shinobi.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(ROOT, 'src', 'pokemon', 'data')
const CACHE_FILE = join(ROOT, '.pokemon-graphql-cache.json')
const ENDPOINT = 'https://beta.pokeapi.co/graphql/v1beta'

// ---------------------------------------------------------------------------
// Dicionários pt-BR
// ---------------------------------------------------------------------------

const TYPE_PT = {
  normal: 'Normal', fire: 'Fogo', water: 'Água', grass: 'Planta',
  electric: 'Elétrico', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso',
  ground: 'Terrestre', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
  rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
  steel: 'Aço', fairy: 'Fada',
}

const COLOR_PT = {
  black: 'Preto', blue: 'Azul', brown: 'Marrom', gray: 'Cinza', green: 'Verde',
  pink: 'Rosa', purple: 'Roxo', red: 'Vermelho', white: 'Branco', yellow: 'Amarelo',
}

const REGION_PT = { alola: 'Alola', galar: 'Galar', hisui: 'Hisui', paldea: 'Paldea' }
const REGION_TOKENS = Object.keys(REGION_PT)

// Marcadores de formas de batalha/cosméticas que NÃO são formas regionais,
// mesmo quando o nome contém um token de região (ex.: darmanitan-galar-zen).
const NON_REGIONAL_MARKERS = ['zen', 'gmax', 'mega', 'totem', 'ash', 'cap', 'gorging', 'gulping']
// Descritores redundantes removidos do nome exibido da forma.
const DROP_DESCRIPTORS = new Set(['breed', 'standard'])

// ---------------------------------------------------------------------------
// GraphQL com cache local
// ---------------------------------------------------------------------------

async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

const SPECIES_QUERY = `
query Species($limit: Int!, $offset: Int!) {
  pokemon_v2_pokemonspecies(limit: $limit, offset: $offset, order_by: {id: asc}) {
    id
    name
    generation_id
    evolves_from_species_id
    is_legendary
    is_mythical
    pokemon_v2_pokemoncolor { name }
    pokemon_v2_pokemons {
      id
      name
      height
      weight
      is_default
      pokemon_v2_pokemontypes(order_by: {slot: asc}) {
        slot
        pokemon_v2_type { name }
      }
      pokemon_v2_pokemonabilities {
        is_hidden
        pokemon_v2_ability { name }
      }
      pokemon_v2_pokemonstats {
        base_stat
      }
    }
  }
}`

async function fetchAllSpecies() {
  if (existsSync(CACHE_FILE)) {
    console.log('• Usando cache local (.pokemon-graphql-cache.json)')
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  }
  const all = []
  const limit = 60
  for (let offset = 0; ; offset += limit) {
    const data = await gql(SPECIES_QUERY, { limit, offset })
    const page = data.pokemon_v2_pokemonspecies
    all.push(...page)
    process.stdout.write(`\r• Baixando espécies: ${all.length}`)
    if (page.length < limit) break
  }
  process.stdout.write('\n')
  writeFileSync(CACHE_FILE, JSON.stringify(all))
  return all
}

// ---------------------------------------------------------------------------
// Transformação
// ---------------------------------------------------------------------------

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const displayBase = name => name.split('-').map(cap).join(' ')

/** Estágio de evolução: nº de saltos em evolves_from + 1 (base = 1). */
function buildStageResolver(species) {
  const evolvesFrom = new Map(species.map(s => [s.id, s.evolves_from_species_id]))
  const memo = new Map()
  const stageOf = id => {
    if (memo.has(id)) return memo.get(id)
    const prev = evolvesFrom.get(id)
    const stage = prev == null ? 1 : stageOf(prev) + 1
    memo.set(id, stage)
    return stage
  }
  return stageOf
}

function typesOf(pokemon) {
  const slots = [...pokemon.pokemon_v2_pokemontypes].sort((a, b) => a.slot - b.slot)
  const t1 = slots[0] ? TYPE_PT[slots[0].pokemon_v2_type.name] ?? cap(slots[0].pokemon_v2_type.name) : null
  const t2 = slots[1] ? TYPE_PT[slots[1].pokemon_v2_type.name] ?? cap(slots[1].pokemon_v2_type.name) : null
  return { type1: t1, type2: t2 }
}

/** Nome da habilidade oculta (slug -> "Title Case") ou "Nenhuma" se não houver. */
function hiddenAbilityOf(pokemon) {
  const h = pokemon.pokemon_v2_pokemonabilities.find(a => a.is_hidden)
  return h ? h.pokemon_v2_ability.name.split('-').map(cap).join(' ') : 'Nenhuma'
}

/** Soma dos atributos base (BST). */
function bstOf(pokemon) {
  return pokemon.pokemon_v2_pokemonstats.reduce((sum, s) => sum + s.base_stat, 0)
}

/** Nome de exibição de uma forma regional a partir do slug do pokémon. */
function regionalName(pokemonName, speciesDisplay, regionToken) {
  const speciesTokenCount = speciesDisplay.split(' ').length
  const parts = pokemonName.split('-')
  // Tokens após a espécie, tirando o token de região e descritores redundantes.
  const extras = parts
    .slice(speciesTokenCount)
    .filter(p => p !== regionToken && !DROP_DESCRIPTORS.has(p))
  const region = REGION_PT[regionToken]
  return extras.length
    ? `${speciesDisplay} de ${region} (${extras.map(cap).join(' ')})`
    : `${speciesDisplay} de ${region}`
}

function regionTokenOf(pokemonName) {
  const parts = pokemonName.split('-')
  if (parts.some(p => NON_REGIONAL_MARKERS.includes(p))) return null
  return parts.find(p => REGION_TOKENS.includes(p)) ?? null
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  fetchAllSpecies().then(species => {
    const stageOf = buildStageResolver(species)
    const entries = []

    for (const sp of species) {
      const speciesDisplay = displayBase(sp.name)
      const gen = sp.generation_id
      const color = COLOR_PT[sp.pokemon_v2_pokemoncolor?.name] ?? 'Desconhecido'
      const stage = stageOf(sp.id)
      // Lendários e míticos entram num único flag (nível de espécie).
      const legendary = sp.is_legendary || sp.is_mythical

      const varieties = sp.pokemon_v2_pokemons
      const base = varieties.find(p => p.is_default) ?? varieties[0]
      if (!base) continue

      // Entrada base (espécie canônica)
      const baseTypes = typesOf(base)
      entries.push({
        id: base.id,
        name: speciesDisplay,
        gen,
        type1: baseTypes.type1,
        type2: baseTypes.type2,
        hiddenAbility: hiddenAbilityOf(base),
        color,
        stage,
        height: base.height / 10, // decímetros -> metros
        weight: base.weight / 10, // hectogramas -> kg
        bst: bstOf(base),
        legendary,
        form: null,
      })

      // Formas regionais (para o modo ultra-hard): habilidade/BST/tipos são
      // próprios da forma; cor/estágio/lendário vêm da espécie.
      for (const v of varieties) {
        if (v.is_default) continue
        const regionToken = regionTokenOf(v.name)
        if (!regionToken) continue
        const t = typesOf(v)
        entries.push({
          id: v.id,
          name: regionalName(v.name, speciesDisplay, regionToken),
          gen,
          type1: t.type1,
          type2: t.type2,
          hiddenAbility: hiddenAbilityOf(v),
          color,
          stage,
          height: v.height / 10,
          weight: v.weight / 10,
          bst: bstOf(v),
          legendary,
          form: REGION_PT[regionToken],
        })
      }
    }

    entries.sort((a, b) => a.id - b.id)

    const baseCount = entries.filter(e => e.form == null).length
    const formCount = entries.length - baseCount
    const legendaryCount = entries.filter(e => e.legendary).length
    const noHiddenCount = entries.filter(e => e.hiddenAbility === 'Nenhuma').length
    const byGen = {}
    for (const e of entries) if (e.form == null) byGen[e.gen] = (byGen[e.gen] ?? 0) + 1

    const out = join(OUT_DIR, 'pokemon.json')
    writeFileSync(out, JSON.stringify({
      generatedFrom: ENDPOINT,
      generatedAt: new Date().toISOString().slice(0, 10),
      counts: { total: entries.length, base: baseCount, regionalForms: formCount, byGeneration: byGen },
      entries,
    }))

    console.log(`✔ ${out}`)
    console.log(`  ${entries.length} entradas (${baseCount} espécies + ${formCount} formas regionais)`)
    console.log(`  lendários/míticos: ${legendaryCount} · sem habilidade oculta: ${noHiddenCount}`)
    console.log(`  por geração:`, byGen)
  }).catch(err => {
    console.error('✖ Falha ao gerar dataset:', err.message)
    process.exit(1)
  })
}

main()
