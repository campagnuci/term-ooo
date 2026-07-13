// generate-smash-data.mjs
// Gera o dataset estático do jogo Smashdle (estilo Pokédle/Narutodle) com os
// lutadores de Super Smash Bros. Ultimate.
//
// Uso:  node generate-smash-data.mjs
// Saída: src/smash/data/characters.json
//
// Fontes:
//  • smashbrosapi.com/graphql/v1 — nome, ordem, disponibilidade (Starter/
//    Unlockable/Custom/Downloadable), séries (universo), imagens e alsoAppearsIn
//    (em quais SSB anteriores o lutador apareceu). A API cobre só 3 dos campos
//    do jogo (imagem, universo, estreia). O jogo NÃO consome a API em runtime.
//  • CURADORIA (abaixo) — gênero, espécie, peso, plataforma de origem e ano de
//    origem, ausentes na API. Mesmo padrão do Shinobi (lista curada + overrides).
//    Os PESOS são os valores oficiais de Ultimate (SmashWiki, página "Weight").
//
// "Everyone is Here": Ultimate trouxe de volta TODOS os lutadores jogáveis dos
// SSB anteriores, então o elenco de Ultimate É o conjunto histórico completo —
// nenhum veterano jogável ficou de fora.

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT = join(ROOT, 'src', 'smash', 'data', 'characters.json')
const ENDPOINT = 'https://smashbrosapi.com/graphql/v1'

// ---------------------------------------------------------------------------
// Dicionários pt-BR / derivações
// ---------------------------------------------------------------------------

// Disponibilidade em Ultimate (como o lutador é obtido).
const AVAILABILITY_PT = {
  Starter: 'Inicial',
  Unlockable: 'Desbloqueável',
  Custom: 'Mii',
  Downloadable: 'DLC',
}

// Ordem cronológica dos SSB. alsoAppearsIn traz os jogos ANTERIORES em que o
// lutador apareceu; a estreia é o mais antigo (ou "Ultimate" se a lista vazia).
const GAME_ORDER = ['SSB', 'Melee', 'Brawl', 'SSB4', 'Ultimate']
const GAME_LABEL = {
  SSB: 'Smash 64',
  Melee: 'Melee',
  Brawl: 'Brawl',
  SSB4: 'Smash 4',
  Ultimate: 'Ultimate',
}

// A API omite "Melee" no alsoAppearsIn de vários veteranos de Melee (2001):
// Bowser/Peach/Ice Climbers/Sheik/Zelda vêm como estreia em Brawl e Dr. Mario
// em Smash 4 — todos eram jogáveis em Melee. Override corrige a fonte.
const FIRST_GAME_OVERRIDE = {
  'Bowser': 'Melee',
  'Peach': 'Melee',
  'Ice Climbers': 'Melee',
  'Sheik': 'Melee',
  'Zelda': 'Melee',
  'Dr. Mario': 'Melee',
}

/** Estreia no SSB: jogo mais antigo em alsoAppearsIn; vazio ⇒ estreou em Ultimate. */
function deriveFirstGame(name, alsoAppearsIn) {
  const forced = FIRST_GAME_OVERRIDE[name]
  const set = new Set(forced ? [forced, ...(alsoAppearsIn || [])] : alsoAppearsIn || [])
  for (let i = 0; i < GAME_ORDER.length; i++) {
    if (set.has(GAME_ORDER[i])) return { firstGame: GAME_LABEL[GAME_ORDER[i]], firstGameOrder: i }
  }
  return { firstGame: GAME_LABEL.Ultimate, firstGameOrder: GAME_ORDER.length - 1 }
}

// ---------------------------------------------------------------------------
// Curadoria (chave = nome EXATO da API)
//   gender:    Masculino | Feminino | Selecionável | Outro
//              (Selecionável = lutador com variantes M/F escolhíveis: Miis,
//               Villager, Robin, Corrin, WFT, Inkling, Byleth, Steve, Treinador)
//   species:   espécie em pt-BR (Humano, Pokémon, Kong, Robô, ...)
//   weight:    peso de SSB Ultimate (SmashWiki). Pokémon Trainer usa 96 (Ivysaur,
//              o valor do meio entre Squirtle 75 / Ivysaur 96 / Charizard 116).
//   platform:  console de estreia do jogo de origem do personagem
//   originYear:ano de lançamento do jogo de estreia do personagem
//
// Chamadas de julgamento (ajustáveis aqui): encarnações de Link (Link 1986 /
// Young Link OoT 1998 / Toon Link WW 2002), plataforma da Bayonetta (Xbox 360),
// peso do Pokémon Trainer, e os gêneros "Selecionável".
// ---------------------------------------------------------------------------
const CURATED = {
  'Mario':            { gender: 'Masculino',    species: 'Humano',      weight: 98,  platform: 'Arcade',          originYear: 1981 },
  'Donkey Kong':      { gender: 'Masculino',    species: 'Kong',        weight: 127, platform: 'Arcade',          originYear: 1981 },
  'Link':             { gender: 'Masculino',    species: 'Hyliano',     weight: 104, platform: 'NES',             originYear: 1986 },
  'Samus':            { gender: 'Feminino',     species: 'Humano',      weight: 108, platform: 'NES',             originYear: 1986 },
  'Dark Samus':       { gender: 'Feminino',     species: 'Outro',       weight: 108, platform: 'GameCube',        originYear: 2002 },
  'Yoshi':            { gender: 'Masculino',    species: 'Yoshi',       weight: 104, platform: 'SNES',            originYear: 1990 },
  'Kirby':            { gender: 'Masculino',    species: 'Outro',       weight: 79,  platform: 'Game Boy',        originYear: 1992 },
  'Fox':              { gender: 'Masculino',    species: 'Raposa',      weight: 77,  platform: 'SNES',            originYear: 1993 },
  'Pikachu':          { gender: 'Outro',        species: 'Pokémon',     weight: 79,  platform: 'Game Boy',        originYear: 1996 },
  'Luigi':            { gender: 'Masculino',    species: 'Humano',      weight: 97,  platform: 'Arcade',          originYear: 1983 },
  'Ness':             { gender: 'Masculino',    species: 'Humano',      weight: 94,  platform: 'SNES',            originYear: 1994 },
  'Captain Falcon':   { gender: 'Masculino',    species: 'Humano',      weight: 104, platform: 'SNES',            originYear: 1990 },
  'Jigglypuff':       { gender: 'Outro',        species: 'Pokémon',     weight: 68,  platform: 'Game Boy',        originYear: 1996 },
  'Peach':            { gender: 'Feminino',     species: 'Humano',      weight: 89,  platform: 'NES',             originYear: 1985 },
  'Daisy':            { gender: 'Feminino',     species: 'Humano',      weight: 89,  platform: 'Game Boy',        originYear: 1989 },
  'Bowser':           { gender: 'Masculino',    species: 'Koopa',       weight: 135, platform: 'NES',             originYear: 1985 },
  'Ice Climbers':     { gender: 'Outro',        species: 'Humano',      weight: 92,  platform: 'NES',             originYear: 1985 },
  'Sheik':            { gender: 'Feminino',     species: 'Hyliano',     weight: 78,  platform: 'Nintendo 64',     originYear: 1998 },
  'Zelda':            { gender: 'Feminino',     species: 'Hyliano',     weight: 85,  platform: 'NES',             originYear: 1986 },
  'Dr. Mario':        { gender: 'Masculino',    species: 'Humano',      weight: 98,  platform: 'NES',             originYear: 1990 },
  'Pichu':            { gender: 'Outro',        species: 'Pokémon',     weight: 62,  platform: 'Game Boy Color',  originYear: 1999 },
  'Falco':            { gender: 'Masculino',    species: 'Falcão',      weight: 82,  platform: 'SNES',            originYear: 1993 },
  'Marth':            { gender: 'Masculino',    species: 'Humano',      weight: 90,  platform: 'NES',             originYear: 1990 },
  'Lucina':           { gender: 'Feminino',     species: 'Humano',      weight: 90,  platform: 'Nintendo 3DS',    originYear: 2012 },
  'Young Link':       { gender: 'Masculino',    species: 'Hyliano',     weight: 88,  platform: 'Nintendo 64',     originYear: 1998 },
  'Ganondorf':        { gender: 'Masculino',    species: 'Gerudo',      weight: 118, platform: 'Nintendo 64',     originYear: 1998 },
  'Mewtwo':           { gender: 'Outro',        species: 'Pokémon',     weight: 79,  platform: 'Game Boy',        originYear: 1996 },
  'Roy':              { gender: 'Masculino',    species: 'Humano',      weight: 95,  platform: 'Game Boy Advance',originYear: 2002 },
  'Chrom':            { gender: 'Masculino',    species: 'Humano',      weight: 95,  platform: 'Nintendo 3DS',    originYear: 2012 },
  'Mr. Game & Watch': { gender: 'Outro',        species: 'Outro',       weight: 75,  platform: 'Game & Watch',    originYear: 1980 },
  'Meta Knight':      { gender: 'Masculino',    species: 'Outro',       weight: 80,  platform: 'NES',             originYear: 1993 },
  'Pit':              { gender: 'Masculino',    species: 'Anjo',        weight: 96,  platform: 'NES',             originYear: 1986 },
  'Dark Pit':         { gender: 'Masculino',    species: 'Anjo',        weight: 96,  platform: 'Nintendo 3DS',    originYear: 2012 },
  'Zero Suit Samus':  { gender: 'Feminino',     species: 'Humano',      weight: 80,  platform: 'NES',             originYear: 1986 },
  'Wario':            { gender: 'Masculino',    species: 'Humano',      weight: 107, platform: 'Game Boy',        originYear: 1992 },
  'Snake':            { gender: 'Masculino',    species: 'Humano',      weight: 106, platform: 'MSX2',            originYear: 1987 },
  'Ike':              { gender: 'Masculino',    species: 'Humano',      weight: 107, platform: 'GameCube',        originYear: 2005 },
  'Pokémon Trainer':  { gender: 'Selecionável', species: 'Pokémon',     weight: 96,  platform: 'Game Boy',        originYear: 1996 },
  'Diddy Kong':       { gender: 'Masculino',    species: 'Kong',        weight: 90,  platform: 'SNES',            originYear: 1994 },
  'Lucas':            { gender: 'Masculino',    species: 'Humano',      weight: 94,  platform: 'Game Boy Advance',originYear: 2006 },
  'Sonic':            { gender: 'Masculino',    species: 'Ouriço',      weight: 86,  platform: 'Mega Drive',      originYear: 1991 },
  'King Dedede':      { gender: 'Masculino',    species: 'Outro',       weight: 127, platform: 'Game Boy',        originYear: 1992 },
  'Olimar':           { gender: 'Masculino',    species: 'Alienígena',  weight: 79,  platform: 'GameCube',        originYear: 2001 },
  'Lucario':          { gender: 'Outro',        species: 'Pokémon',     weight: 92,  platform: 'Nintendo DS',     originYear: 2006 },
  'R.O.B.':           { gender: 'Outro',        species: 'Robô',        weight: 106, platform: 'NES',             originYear: 1985 },
  'Toon Link':        { gender: 'Masculino',    species: 'Hyliano',     weight: 91,  platform: 'GameCube',        originYear: 2002 },
  'Wolf':             { gender: 'Masculino',    species: 'Lobo',        weight: 92,  platform: 'Nintendo 64',     originYear: 1997 },
  'Villager':         { gender: 'Selecionável', species: 'Humano',      weight: 92,  platform: 'Nintendo 64',     originYear: 2001 },
  'Mega Man':         { gender: 'Masculino',    species: 'Robô',        weight: 102, platform: 'NES',             originYear: 1987 },
  'Wii Fit Trainer':  { gender: 'Selecionável', species: 'Humano',      weight: 96,  platform: 'Wii',             originYear: 2007 },
  'Rosalina & Luma':  { gender: 'Feminino',     species: 'Humano',      weight: 82,  platform: 'Wii',             originYear: 2007 },
  'Little Mac':       { gender: 'Masculino',    species: 'Humano',      weight: 87,  platform: 'NES',             originYear: 1987 },
  'Greninja':         { gender: 'Outro',        species: 'Pokémon',     weight: 88,  platform: 'Nintendo 3DS',    originYear: 2013 },
  'Mii Brawler':      { gender: 'Selecionável', species: 'Mii',         weight: 94,  platform: 'Wii',             originYear: 2006 },
  'Mii Swordfighter': { gender: 'Selecionável', species: 'Mii',         weight: 100, platform: 'Wii',             originYear: 2006 },
  'Mii Gunner':       { gender: 'Selecionável', species: 'Mii',         weight: 104, platform: 'Wii',             originYear: 2006 },
  'Palutena':         { gender: 'Feminino',     species: 'Deusa',       weight: 91,  platform: 'NES',             originYear: 1986 },
  'Pac-Man':          { gender: 'Masculino',    species: 'Outro',       weight: 95,  platform: 'Arcade',          originYear: 1980 },
  'Robin':            { gender: 'Selecionável', species: 'Humano',      weight: 95,  platform: 'Nintendo 3DS',    originYear: 2012 },
  'Shulk':            { gender: 'Masculino',    species: 'Humano',      weight: 97,  platform: 'Wii',             originYear: 2010 },
  'Bowser Jr.':       { gender: 'Masculino',    species: 'Koopa',       weight: 108, platform: 'GameCube',        originYear: 2002 },
  'Duck Hunt':        { gender: 'Outro',        species: 'Animal',      weight: 86,  platform: 'NES',             originYear: 1984 },
  'Ryu':              { gender: 'Masculino',    species: 'Humano',      weight: 103, platform: 'Arcade',          originYear: 1987 },
  'Ken':              { gender: 'Masculino',    species: 'Humano',      weight: 103, platform: 'Arcade',          originYear: 1987 },
  'Cloud':            { gender: 'Masculino',    species: 'Humano',      weight: 100, platform: 'PlayStation',     originYear: 1997 },
  'Corrin':           { gender: 'Selecionável', species: 'Humano',      weight: 98,  platform: 'Nintendo 3DS',    originYear: 2015 },
  'Bayonetta':        { gender: 'Feminino',     species: 'Bruxa',       weight: 81,  platform: 'Xbox 360',        originYear: 2009 },
  'Inkling':          { gender: 'Selecionável', species: 'Inkling',     weight: 94,  platform: 'Wii U',           originYear: 2015 },
  'Ridley':           { gender: 'Masculino',    species: 'Alienígena',  weight: 107, platform: 'NES',             originYear: 1986 },
  'Simon':            { gender: 'Masculino',    species: 'Humano',      weight: 107, platform: 'NES',             originYear: 1986 },
  'Richter':          { gender: 'Masculino',    species: 'Humano',      weight: 107, platform: 'PC Engine',       originYear: 1993 },
  'King K. Rool':     { gender: 'Masculino',    species: 'Crocodilo',   weight: 133, platform: 'SNES',            originYear: 1994 },
  'Isabelle':         { gender: 'Feminino',     species: 'Cão',         weight: 88,  platform: 'Nintendo 3DS',    originYear: 2012 },
  'Incineroar':       { gender: 'Outro',        species: 'Pokémon',     weight: 116, platform: 'Nintendo 3DS',    originYear: 2016 },
  'Piranha Plant':    { gender: 'Outro',        species: 'Planta',      weight: 112, platform: 'NES',             originYear: 1985 },
  'Joker':            { gender: 'Masculino',    species: 'Humano',      weight: 93,  platform: 'PlayStation 4',   originYear: 2016 },
  'Hero':             { gender: 'Masculino',    species: 'Humano',      weight: 101, platform: 'PlayStation 4',   originYear: 2017 },
  'Banjo & Kazooie':  { gender: 'Outro',        species: 'Animal',      weight: 106, platform: 'Nintendo 64',     originYear: 1998 },
  'Terry':            { gender: 'Masculino',    species: 'Humano',      weight: 108, platform: 'Neo Geo',         originYear: 1991 },
  'Byleth':           { gender: 'Selecionável', species: 'Humano',      weight: 97,  platform: 'Nintendo Switch', originYear: 2019 },
  'Min Min':          { gender: 'Feminino',     species: 'Humano',      weight: 104, platform: 'Nintendo Switch', originYear: 2017 },
  'Steve':            { gender: 'Selecionável', species: 'Humano',      weight: 92,  platform: 'PC',              originYear: 2011 },
  'Sephiroth':        { gender: 'Masculino',    species: 'Humano',      weight: 79,  platform: 'PlayStation',     originYear: 1997 },
  'Pyra':             { gender: 'Feminino',     species: 'Outro',       weight: 98,  platform: 'Nintendo Switch', originYear: 2017 },
  'Mythra':           { gender: 'Feminino',     species: 'Outro',       weight: 92,  platform: 'Nintendo Switch', originYear: 2017 },
  'Kazuya':           { gender: 'Masculino',    species: 'Humano',      weight: 113, platform: 'Arcade',          originYear: 1994 },
  'Sora':             { gender: 'Masculino',    species: 'Humano',      weight: 85,  platform: 'PlayStation 2',   originYear: 2002 },
}

// ---------------------------------------------------------------------------
// GraphQL
// ---------------------------------------------------------------------------

const QUERY = `{
  characters {
    name
    order
    availability
    alsoAppearsIn
    series { name }
    images { icon portrait }
  }
}`

async function fetchCharacters() {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data.characters
}

// ---------------------------------------------------------------------------
// Montagem do dataset
// ---------------------------------------------------------------------------

const raw = await fetchCharacters()
const missing = []
const characters = []

raw.forEach((c, i) => {
  const cur = CURATED[c.name]
  if (!cur) {
    missing.push(c.name)
    return
  }
  const { firstGame, firstGameOrder } = deriveFirstGame(c.name, c.alsoAppearsIn)
  characters.push({
    id: i + 1, // índice estável na ordem da API (order tem "4e", "33-35" etc.)
    name: c.name,
    icon: c.images?.icon ?? null,
    portrait: c.images?.portrait ?? null,
    universe: c.series?.name ?? 'Desconhecido',
    gender: cur.gender,
    species: cur.species,
    weight: cur.weight,
    firstGame,
    firstGameOrder,
    platform: cur.platform,
    originYear: cur.originYear,
    availability: AVAILABILITY_PT[c.availability] ?? c.availability,
  })
})

if (missing.length) {
  console.error(`\n✖ ${missing.length} lutador(es) da API sem entrada curada — adicione em CURATED:`)
  console.error('  - ' + missing.join('\n  - '))
  process.exit(1)
}

// Distribuições para conferência rápida
const dist = (key) => characters.reduce((m, c) => ((m[c[key]] = (m[c[key]] ?? 0) + 1), m), {})

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({
  generatedFrom: `${ENDPOINT} + curadoria + SmashWiki (pesos)`,
  generatedAt: new Date().toISOString().slice(0, 10),
  counts: {
    total: characters.length,
    byGender: dist('gender'),
    byFirstGame: dist('firstGame'),
    byAvailability: dist('availability'),
    universes: Object.keys(dist('universe')).length,
    species: Object.keys(dist('species')).length,
    platforms: Object.keys(dist('platform')).length,
  },
  characters,
}, null, 2))

console.log(`\n✔ ${characters.length} lutadores gravados em ${OUT}`)
console.log('  gênero:', dist('gender'))
console.log('  estreia:', dist('firstGame'))
console.log('  disponibilidade:', dist('availability'))
console.log(`  universos: ${Object.keys(dist('universe')).length} · espécies: ${Object.keys(dist('species')).length} · plataformas: ${Object.keys(dist('platform')).length}`)
