// naruto-data-lib.mjs
// Lógica compartilhada entre generate-naruto-data.mjs (dataset do jogo) e
// generate-naruto-tiers.mjs (arquivos de validação em database/).
// Fonte: API pública Dattebayo (scrape da Narutopedia).

export const API = 'https://dattebayo-api.onrender.com/characters'

// ---------------------------------------------------------------------------
// Pool curado: apenas personagens conhecidos entram no jogo (evita filler
// obscuro como resposta do dia). Nomes exatamente como na wiki/API.
// ---------------------------------------------------------------------------
export const CURATED_NAMES = [
  // Konoha — times e senseis
  'Naruto Uzumaki', 'Sasuke Uchiha', 'Sakura Haruno', 'Kakashi Hatake',
  'Hinata Hyūga', 'Kiba Inuzuka', 'Shino Aburame', 'Kurenai Yūhi',
  'Shikamaru Nara', 'Ino Yamanaka', 'Chōji Akimichi', 'Asuma Sarutobi',
  'Rock Lee', 'Neji Hyūga', 'Tenten', 'Might Guy',
  'Sai', 'Yamato', 'Iruka Umino', 'Konohamaru Sarutobi',
  'Moegi Kazamatsuri', 'Udon Ise', 'Ebisu', 'Mizuki',
  // Konoha — geração dos pais / clãs
  'Hiashi Hyūga', 'Hanabi Hyūga', 'Shikaku Nara', 'Inoichi Yamanaka',
  'Chōza Akimichi', 'Fugaku Uchiha', 'Mikoto Uchiha', 'Might Duy',
  // Konoha — administração e jōnin
  'Hiruzen Sarutobi', 'Tsunade', 'Jiraiya', 'Minato Namikaze',
  'Kushina Uzumaki', 'Danzō Shimura', 'Shizune', 'Anko Mitarashi',
  'Ibiki Morino', 'Genma Shiranui', 'Hayate Gekkō', 'Kotetsu Hagane',
  'Izumo Kamizuki', 'Teuchi', 'Ayame', 'Dan Katō', 'Rin Nohara',
  'Shisui Uchiha', 'Itachi Uchiha', 'Obito Uchiha',
  // Fundadores / era antiga
  'Hashirama Senju', 'Tobirama Senju', 'Madara Uchiha', 'Izuna Uchiha',
  'Kaguya Ōtsutsuki', 'Hagoromo Ōtsutsuki', 'Hamura Ōtsutsuki',
  'Indra Ōtsutsuki', 'Asura Ōtsutsuki',
  // Akatsuki
  'Kisame Hoshigaki', 'Deidara', 'Sasori', 'Hidan', 'Kakuzu',
  'Nagato', 'Konan', 'Yahiko', 'White Zetsu', 'Black Zetsu',
  // Orochimaru e som
  'Orochimaru', 'Kabuto Yakushi', 'Kimimaro', 'Jūgo',
  'Suigetsu Hōzuki', 'Karin', 'Tayuya', 'Kidōmaru', 'Jirōbō',
  'Sakon and Ukon', 'Dosu Kinuta', 'Zaku Abumi', 'Kin Tsuchi',
  // Suna
  'Gaara', 'Kankurō', 'Temari', 'Chiyo', 'Baki', 'Rasa', 'Pakura',
  // Kiri
  'Zabuza Momochi', 'Haku', 'Mei Terumī', 'Chōjūrō', 'Ao',
  'Yagura Karatachi', 'Utakata', 'Mangetsu Hōzuki', 'Gengetsu Hōzuki',
  // Kumo
  'Killer B', 'A (Fourth Raikage)', 'A (Third Raikage)', 'Darui', 'C',
  'Omoi', 'Karui', 'Samui', 'Yugito Nii', 'Kinkaku', 'Ginkaku',
  // Iwa
  'Ōnoki', 'Kurotsuchi', 'Akatsuchi', 'Rōshi', 'Han', 'Gari', 'Mū',
  // Taki / outros
  'Fū', 'Hanzō', 'Mifune', 'Guren',
]

// Correções manuais aplicadas por cima das heurísticas (chave = nome exato).
// Use para consertar arco de estreia ou categorias quando a API for ambígua.
export const OVERRIDES = {
  'Killer B': { debutAnime: 'Naruto Shippūden Episode #142' },
  // Hagoromo/Hamura/Indra/Asura aparecem em flashbacks tardios da guerra
  'Hagoromo Ōtsutsuki': { debutAnime: 'Naruto Shippūden Episode #329' },
}

// ---------------------------------------------------------------------------
// Arcos (ordenados). Faixas de episódios do anime → nome do arco em pt-BR.
// ---------------------------------------------------------------------------
export const ARCS = [
  // Naruto clássico (eps 1–220)
  { series: 'naruto', from: 1, to: 19, name: 'Terra das Ondas' },
  { series: 'naruto', from: 20, to: 67, name: 'Exames Chūnin' },
  { series: 'naruto', from: 68, to: 80, name: 'Invasão de Konoha' },
  { series: 'naruto', from: 81, to: 100, name: 'Busca por Tsunade' },
  { series: 'naruto', from: 101, to: 106, name: 'Missões de Konoha (filler)' },
  { series: 'naruto', from: 107, to: 135, name: 'Resgate do Sasuke' },
  { series: 'naruto', from: 136, to: 220, name: 'Missões Especiais (filler)' },
  // Naruto Shippūden (eps 1–500)
  { series: 'shippuden', from: 1, to: 32, name: 'Resgate do Kazekage' },
  { series: 'shippuden', from: 33, to: 53, name: 'Ponte Tenchi' },
  { series: 'shippuden', from: 54, to: 71, name: 'Doze Ninjas Guardiões (filler)' },
  { series: 'shippuden', from: 72, to: 88, name: 'Imortais da Akatsuki' },
  { series: 'shippuden', from: 89, to: 112, name: 'Aparição do Sanbi (filler)' },
  { series: 'shippuden', from: 113, to: 143, name: 'Perseguição a Itachi' },
  { series: 'shippuden', from: 144, to: 151, name: 'Fúria do Rokubi (filler)' },
  { series: 'shippuden', from: 152, to: 175, name: 'Invasão de Pain' },
  { series: 'shippuden', from: 176, to: 196, name: 'História de Konoha (filler)' },
  { series: 'shippuden', from: 197, to: 222, name: 'Cúpula dos Cinco Kages' },
  { series: 'shippuden', from: 223, to: 242, name: 'Paraíso a Bordo (filler)' },
  { series: 'shippuden', from: 243, to: 270, name: 'Controle do Kyūbi' },
  { series: 'shippuden', from: 271, to: 321, name: '4ª Guerra: Confronto' },
  { series: 'shippuden', from: 322, to: 348, name: '4ª Guerra: Madara' },
  { series: 'shippuden', from: 349, to: 361, name: 'Kakashi ANBU (filler)' },
  { series: 'shippuden', from: 362, to: 393, name: '4ª Guerra: Obito' },
  { series: 'shippuden', from: 394, to: 413, name: 'Exames Chūnin do Passado (filler)' },
  { series: 'shippuden', from: 414, to: 458, name: '4ª Guerra: Final' },
  { series: 'shippuden', from: 459, to: 479, name: 'Kaguya' },
  { series: 'shippuden', from: 480, to: 500, name: 'Epílogo' },
]

export function findArc(debutAnime) {
  if (typeof debutAnime !== 'string') return null
  // Ex.: "Naruto Episode #1", "Naruto Shippūden Episode #32"
  const m = debutAnime.match(/^Naruto( Shipp[ūu]den)? Episode #(\d+)/i)
  if (!m) return null
  const series = m[1] ? 'shippuden' : 'naruto'
  const ep = parseInt(m[2], 10)
  const idx = ARCS.findIndex(a => a.series === series && ep >= a.from && ep <= a.to)
  if (idx === -1) return null
  return { name: ARCS[idx].name, order: idx }
}

// ---------------------------------------------------------------------------
// Normalização de campos
// ---------------------------------------------------------------------------

// A API mistura string e array; anotações como "(Anime only)" viram ruído.
function toCleanArray(value) {
  const arr = value == null ? [] : Array.isArray(value) ? value : [value]
  return [...new Set(
    arr
      .map(s => String(s).replace(/\s*\((Anime|Manga|Movie|Game|Novel) only\)\s*/gi, '').trim())
      .filter(Boolean)
  )]
}

const NATURE_PT = {
  Fire: 'Fogo', Wind: 'Vento', Lightning: 'Relâmpago', Earth: 'Terra', Water: 'Água',
  Yin: 'Yin', Yang: 'Yang', 'Yin–Yang': 'Yin-Yang', 'Yin-Yang': 'Yin-Yang',
  Lava: 'Lava', Magnet: 'Magnetismo', Boil: 'Vapor', Wood: 'Madeira', Ice: 'Gelo',
  Explosion: 'Explosão', Scorch: 'Chama Ardente', Dust: 'Poeira', Storm: 'Tempestade',
  Crystal: 'Cristal', Blaze: 'Blaze', Swift: 'Velocidade', Steel: 'Aço', Dark: 'Trevas',
}

function normalizeNatures(natureType) {
  return toCleanArray(natureType).map(raw => {
    const base = raw.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*Release\s*$/i, '').trim()
    return NATURE_PT[base] ?? base
  }).filter((v, i, a) => a.indexOf(v) === i)
}

const ATTRIBUTE_PT = {
  'Jinchūriki': 'Jinchūriki',
  'Pseudo-Jinchūriki': 'Jinchūriki',
  'Sage': 'Sábio',
  'Sensor Type': 'Sensor',
  'Missing-nin': 'Ninja Renegado',
  'Medical-nin': 'Ninja Médico',
  'Hunter-nin': 'Caçador ANBU',
  'Mercenary Ninja': 'Mercenário',
  'S-rank': 'Rank S',
  'A-rank': 'Rank A',
  'B-rank': 'Rank B',
  'Kenjutsu Master': 'Mestre em Kenjutsu',
  'Summon': 'Invocação',
}

function normalizeAttributes(personal) {
  const attrs = toCleanArray(personal?.classification).map(c => ATTRIBUTE_PT[c] ?? c)
  return [...new Set(attrs)]
}

// "Allied Shinobi Forces" abrange quase todo o elenco da guerra — só faz ruído
// na comparação de afiliações do jogo.
const AFFILIATION_DROP = new Set(['Allied Shinobi Forces'])

function normalizeAffiliations(personal) {
  return toCleanArray(personal?.affiliation).filter(a => !AFFILIATION_DROP.has(a))
}

// Kekkei genkai elementais viram "Estilo X" (pt-BR); dōjutsu e nomes próprios ficam.
const KEKKEI_PT = {
  "Jūgo's Clan's Kekkei Genkai": 'Kekkei Genkai do Clã de Jūgo',
  "Sakon and Ukon's Kekkei Genkai": 'Kekkei Genkai de Sakon e Ukon',
}

function normalizeKekkei(personal) {
  return toCleanArray(personal?.kekkeiGenkai).map(k => {
    const clean = k.replace(/\s*\([^)]*\)\s*/g, '').trim()
    if (KEKKEI_PT[clean]) return KEKKEI_PT[clean]
    const m = clean.match(/^(.+?) Release$/)
    if (m) return `Estilo ${NATURE_PT[m[1]] ?? m[1]}`
    return clean
  }).filter((v, i, a) => a.indexOf(v) === i)
}

// Tipos de jutsu não existem na API — derivamos do nome das técnicas.
const JUTSU_TYPE_RULES = [
  { type: 'Genjutsu', re: /genjutsu|demonic illusion|tsukuyomi|infinite tsukuyomi|kotoamatsukami|izanami|izanagi/i },
  { type: 'Taijutsu', re: /strong fist|gentle fist|eight gates|leaf (whirlwind|hurricane|great|rising|coiling)|dynamic (entry|action)|frog kata|combo|barrage|drunken|morning peacock|daytime tiger|evening elephant|night guy|lariat/i },
  { type: 'Kenjutsu', re: /sword(?! of kagutsuchi)|blade|kenjutsu|katana|sabre|dance of the/i },
  { type: 'Shurikenjutsu', re: /shuriken/i },
  { type: 'Senjutsu', re: /sage (mode|art|transformation)|senjutsu/i },
  { type: 'Fūinjutsu', re: /seal(ing)? (technique|jutsu)|fūinjutsu|four symbols|dead demon|torii seal|contract seal/i },
  { type: 'Ninjutsu Médico', re: /mystical palm|healing|medical|chakra scalpel|creation rebirth|strength of a hundred/i },
  { type: 'Marionetes', re: /puppet/i },
]

function deriveJutsuTypes(jutsu) {
  const list = toCleanArray(jutsu)
  if (list.length === 0) return []
  const joined = list.join('\n')
  const types = ['Ninjutsu'] // quem tem qualquer técnica listada usa ninjutsu no jogo
  for (const rule of JUTSU_TYPE_RULES) {
    if (rule.re.test(joined)) types.push(rule.type)
  }
  return types
}

const GENDER_PT = { Male: 'Masculino', Female: 'Feminino' }

/**
 * Converte um personagem cru da API para o schema do jogo.
 * Com `requireArc: true` (dataset do jogo), retorna { skipped } quando a
 * estreia no anime não é parseável; com false (arquivos de validação),
 * mantém o personagem com debutArc/arcOrder nulos.
 */
export function normalizeCharacter(raw, { requireArc = true } = {}) {
  const override = OVERRIDES[raw.name] ?? {}
  const arc = findArc(override.debutAnime ?? raw.debut?.anime)
  if (!arc && requireArc) {
    return { skipped: `${raw.name} (sem estreia no anime parseável: ${raw.debut?.anime ?? 'n/d'})` }
  }

  const personal = raw.personal ?? {}
  return {
    char: {
      id: raw.id,
      name: raw.name,
      image: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : null,
      gender: override.gender ?? GENDER_PT[personal.sex] ?? 'Desconhecido',
      affiliations: override.affiliations ?? normalizeAffiliations(personal),
      jutsuTypes: override.jutsuTypes ?? deriveJutsuTypes(raw.jutsu),
      kekkeiGenkai: override.kekkeiGenkai ?? normalizeKekkei(personal),
      natureTypes: override.natureTypes ?? normalizeNatures(raw.natureType),
      attributes: override.attributes ?? normalizeAttributes(personal),
      debutArc: arc ? arc.name : null,
      arcOrder: arc ? arc.order : null,
    },
  }
}

// ---------------------------------------------------------------------------
export async function fetchAll() {
  const all = []
  let page = 1
  for (;;) {
    const res = await fetch(`${API}?page=${page}&limit=500`)
    if (!res.ok) throw new Error(`HTTP ${res.status} na página ${page}`)
    const data = await res.json()
    all.push(...data.characters)
    console.log(`página ${page}: ${data.characters.length} personagens (total ${all.length}/${data.total})`)
    if (all.length >= data.total || data.characters.length === 0) break
    page++
  }
  return all
}
