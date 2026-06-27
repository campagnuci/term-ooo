#!/usr/bin/env node

/**
 * Script para extrair palavras do código ofuscado do Term.ooo
 * e gerar arquivos TypeScript corretos para nosso clone
 *
 * Quando re-executar: sempre que `database/term.ooo.js` for atualizado.
 * Como executar: `npm run extract` (ou `node extract-words.js`).
 *
 * Extrai:
 * - Rf: Set de palavras válidas para palpites (~10.000)
 * - Yf: Mapa de acentuação (sem_acento -> com_acento)
 * - Pf: Array de palavras de solução (~2.500)
 * - WB: Índices para Dueto
 * - $B: Índices para Quarteto
 *
 * Gera (src/game/):
 * - words-shared.ts : sharedAllowed + sharedAllowedSet (lista de palpites válidos,
 *                     ÚNICA e compartilhada pelos três modos — antes era triplicada)
 * - accent-map.ts   : accentMap (mapa global de acentuação do PT-BR)
 * - words-termo.ts  : termoSolutions (apenas as soluções do modo)
 * - words-dueto.ts  : duetoSolutions
 * - words-quarteto.ts : quartetoSolutions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'database', 'term.ooo.js');
const OUTPUT_DIR = path.join(__dirname, 'src', 'game');

console.log('🚀 Iniciando extração de palavras do Term.ooo...\n');

// Função de normalização idêntica ao original Term.ooo (função fh)
// Remove acentos e mantém minúsculas
function normalize(str) {
    return str.normalize('NFD').replace(/[^\w]/g, '').toLowerCase();
}

// Ler arquivo
const code = fs.readFileSync(INPUT_FILE, 'utf8');

// ============================================================================
// 1. EXTRAIR Rf (palavras válidas) - linha 3856
// ============================================================================
console.log('📖 Extraindo Rf (palavras válidas)...');

const rfMatch = code.match(/Rf = new Set\(\[([\s\S]*?)\]\)/);
if (!rfMatch) {
    console.error('❌ Não foi possível encontrar Rf');
    process.exit(1);
}

// Extrair palavras entre aspas e normalizar
const rfWordsRaw = rfMatch[1].match(/"([^"]+)"/g).map(w => w.slice(1, -1));
const rfWords = rfWordsRaw.map(w => normalize(w));
console.log(`   ✓ Encontradas ${rfWords.length.toLocaleString()} palavras base em Rf`);

// ============================================================================
// 2. EXTRAIR Yf (mapa de acentuação) - linha 13005
// ============================================================================
console.log('📖 Extraindo Yf (mapa de acentuação)...');

const yfMatch = code.match(/Yf = \{([\s\S]*?)\n {4}\},/);
if (!yfMatch) {
    console.error('❌ Não foi possível encontrar Yf');
    process.exit(1);
}

const accentMap = {};
const yfLines = yfMatch[1].match(/(\w+): "([^"]+)"/g);

for (const line of yfLines) {
    const match = line.match(/(\w+): "([^"]+)"/);
    if (match) {
        const key = normalize(match[1]); // Normalizar a chave!
        accentMap[key] = match[2];
    }
}
console.log(`   ✓ Encontrados ${Object.keys(accentMap).length.toLocaleString()} mapeamentos de acentos`);

// ============================================================================
// 3. EXTRAIR Pf (soluções) - linha 15149
// ============================================================================
console.log('📖 Extraindo Pf (palavras de solução)...');

const pfMatch = code.match(/Pf = \[([\s\S]*?)\],\s*Gf = B/);
if (!pfMatch) {
    console.error('❌ Não foi possível encontrar Pf');
    process.exit(1);
}

// Manter palavras de solução COM ACENTOS (não normalizar)
const pfWords = pfMatch[1].match(/"([^"]+)"/g).map(w => w.slice(1, -1));
console.log(`   ✓ Encontradas ${pfWords.length.toLocaleString()} palavras de solução`);

// ============================================================================
// IMPORTANTE: No original, Pf é adicionado ao Rf (linhas 16595-16600)
// Rf.add(qf) para cada palavra em Pf
// Então rfWords deve conter TANTO as palavras base QUANTO as soluções!
// ============================================================================
console.log('\n📝 Mesclando Pf em Rf (como no original)...');
const pfNormalized = pfWords.map(w => normalize(w));
const rfSet = new Set([...rfWords, ...pfNormalized]);
const rfFinal = Array.from(rfSet).sort();
console.log(`   ✓ Total de palavras válidas (Rf + Pf): ${rfFinal.length.toLocaleString()}`);

// ============================================================================
// 4. DECODIFICAR WB (Dueto) - linha 18808
// ============================================================================
console.log('📖 Decodificando WB (índices Dueto)...');

const wbMatch = code.match(/HB = window\.atob\(\s*"([^"]+)"\s*\)/);
if (!wbMatch) {
    console.error('❌ Não foi possível encontrar WB');
    process.exit(1);
}

const wbBase64 = wbMatch[1];
const wbBuffer = Buffer.from(wbBase64, 'base64');
const wbIndices = [];

for (let i = 0; i < wbBuffer.length; i += 2) {
    // Ler como uint16 little-endian (segundo parâmetro = 1 no código original)
    const index = wbBuffer.readUInt16LE(i);
    wbIndices.push(index);
}

// Mapear índices para palavras (mantém acentos das soluções originais)
const duetoSolutions = wbIndices.map(idx => pfWords[idx]);
console.log(`   ✓ Decodificados ${duetoSolutions.length.toLocaleString()} índices para Dueto`);

// ============================================================================
// 5. DECODIFICAR $B (Quarteto) - linha 18819
// ============================================================================
console.log('📖 Decodificando $B (índices Quarteto)...');

const xbMatch = code.match(/XB = window\.atob\(\s*"([^"]+)"\s*\)/);
if (!xbMatch) {
    console.error('❌ Não foi possível encontrar $B');
    process.exit(1);
}

const xbBase64 = xbMatch[1];
const xbBuffer = Buffer.from(xbBase64, 'base64');
const xbIndices = [];

for (let i = 0; i < xbBuffer.length; i += 2) {
    const index = xbBuffer.readUInt16LE(i);
    xbIndices.push(index);
}

// Mapear índices para palavras (mantém acentos das soluções originais)
const quartetoSolutions = xbIndices.map(idx => pfWords[idx]);
console.log(`   ✓ Decodificados ${quartetoSolutions.length.toLocaleString()} índices para Quarteto`);

// ============================================================================
// 6. GERAR ARQUIVOS TYPESCRIPT
// ============================================================================
console.log('\n📝 Gerando arquivos TypeScript...\n');

// Função helper para formatar array de strings
function formatArrayTS(name, words, comment) {
    const chunks = [];
    const wordsPerLine = 10;
    
    for (let i = 0; i < words.length; i += wordsPerLine) {
        const chunk = words.slice(i, i + wordsPerLine);
        chunks.push(`  ${chunk.map(w => `'${w}'`).join(', ')},`);
    }
    
    return `// ${comment}
export const ${name} = [
${chunks.join('\n')}
];`;
}

// Função para formatar objeto
function formatObjectTS(name, obj, comment) {
    const entries = Object.entries(obj);
    const lines = [];
    
    for (let i = 0; i < entries.length; i += 5) {
        const chunk = entries.slice(i, i + 5);
        lines.push(`  ${chunk.map(([k, v]) => `${k}: '${v}'`).join(', ')},`);
    }
    
    return `// ${comment}
export const ${name}: Record<string, string> = {
${lines.join('\n')}
};`;
}

// ============================================================================
// GERAR words-shared.ts (lista de palpites válidos — ÚNICA, compartilhada)
// ============================================================================
const sharedContent = `// src/game/words-shared.ts
// Lista de palavras válidas como palpite, compartilhada por TODOS os modos.
// Gerado automaticamente por extract-words.js
//
// Antes esta lista era duplicada em words-termo/dueto/quarteto.ts (idêntica nos
// três). Agora vive aqui uma única vez. O Set evita a busca O(n) de Array.includes.

${formatArrayTS('sharedAllowed', rfFinal, `Palavras válidas como palpite - NORMALIZADAS/sem acentos (${rfFinal.length} palavras = Rf + Pf)`)}

// Set para validação O(1) de palpites (em vez de Array.includes O(n)).
export const sharedAllowedSet: Set<string> = new Set(sharedAllowed);
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'words-shared.ts'), sharedContent);
console.log(`✅ words-shared.ts criado (${rfFinal.length} palavras válidas, compartilhadas)`);

// ============================================================================
// GERAR accent-map.ts (mapa global de acentuação do PT-BR)
// ============================================================================
const accentContent = `// src/game/accent-map.ts
// Mapa global de acentuação do PT-BR (normalizada → com acento).
// Gerado automaticamente por extract-words.js
//
// Estrutura do idioma, não específica de um modo — usada na validação de
// palpites e na exibição da palavra com acento em todos os modos.

${formatObjectTS('accentMap', accentMap, `Mapa: palavra_normalizada → palavra_com_acento (${Object.keys(accentMap).length} mapeamentos)`)}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'accent-map.ts'), accentContent);
console.log(`✅ accent-map.ts criado (${Object.keys(accentMap).length} mapeamentos)`);

// ============================================================================
// GERAR words-termo.ts (apenas soluções do modo)
// ============================================================================
const termoContent = `// src/game/words-termo.ts
// Palavras extraídas do Term.ooo original
// Gerado automaticamente por extract-words.js
//
// Palpites válidos: ver words-shared.ts. Acentuação: ver accent-map.ts.

${formatArrayTS('termoSolutions', pfWords, `Palavras que podem ser resposta no modo Termo - COM ACENTOS (${pfWords.length} palavras)`)}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'words-termo.ts'), termoContent);
console.log(`✅ words-termo.ts criado (${pfWords.length} soluções)`);

// ============================================================================
// GERAR words-dueto.ts (apenas soluções do modo)
// ============================================================================
const duetoContent = `// src/game/words-dueto.ts
// Palavras extraídas do Term.ooo original
// Gerado automaticamente por extract-words.js
//
// Palpites válidos: ver words-shared.ts.

${formatArrayTS('duetoSolutions', duetoSolutions, `Palavras que podem ser resposta no modo Dueto - COM ACENTOS (${duetoSolutions.length} palavras)`)}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'words-dueto.ts'), duetoContent);
console.log(`✅ words-dueto.ts criado (${duetoSolutions.length} soluções)`);

// ============================================================================
// GERAR words-quarteto.ts (apenas soluções do modo)
// ============================================================================
const quartetoContent = `// src/game/words-quarteto.ts
// Palavras extraídas do Term.ooo original
// Gerado automaticamente por extract-words.js
//
// Palpites válidos: ver words-shared.ts.

${formatArrayTS('quartetoSolutions', quartetoSolutions, `Palavras que podem ser resposta no modo Quarteto - COM ACENTOS (${quartetoSolutions.length} palavras)`)}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'words-quarteto.ts'), quartetoContent);
console.log(`✅ words-quarteto.ts criado (${quartetoSolutions.length} soluções)`);

// ============================================================================
// GERAR ESTATÍSTICAS
// ============================================================================
console.log('\n📊 Estatísticas:');
console.log(`   • Palavras base (Rf): ${rfWords.length.toLocaleString()}`);
console.log(`   • Soluções (Pf): ${pfWords.length.toLocaleString()}`);
console.log(`   • Total válidas (Rf + Pf): ${rfFinal.length.toLocaleString()}`);
console.log(`   • Mapeamentos de acentos (Yf): ${Object.keys(accentMap).length.toLocaleString()}`);
console.log(`   • Soluções Dueto (WB): ${duetoSolutions.length.toLocaleString()}`);
console.log(`   • Soluções Quarteto ($B): ${quartetoSolutions.length.toLocaleString()}`);

console.log('\n✨ Extração concluída com sucesso!\n');
console.log('📁 Arquivos gerados:');
console.log(`   • ${path.join(OUTPUT_DIR, 'words-shared.ts')}`);
console.log(`   • ${path.join(OUTPUT_DIR, 'accent-map.ts')}`);
console.log(`   • ${path.join(OUTPUT_DIR, 'words-termo.ts')}`);
console.log(`   • ${path.join(OUTPUT_DIR, 'words-dueto.ts')}`);
console.log(`   • ${path.join(OUTPUT_DIR, 'words-quarteto.ts')}`);
console.log('\n💡 Agora você pode usar essas palavras no seu clone!\n');

