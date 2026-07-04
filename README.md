# `termo.enresshou.dev` - Term.ooo Clone

[![Version](https://img.shields.io/badge/version-0.5.1-blue.svg)](https://github.com/arthr/term-ooo/releases/tag/v0.5.1)
[![License](https://img.shields.io/badge/license-Educational-green.svg)](LICENSE)
[![Deploy](https://github.com/arthr/term-ooo/actions/workflows/deploy.yml/badge.svg)](https://github.com/arthr/term-ooo/actions)

`termo.enresshou.dev` é um clone completo e funcional do jogo [Term.ooo](https://term.ooo), desenvolvido com React, TypeScript e Tailwind CSS.

🌐 **[Jogue agora!](https://termo.enresshou.dev/)** 🎮

---

## 📋 Índice

- [Sobre o Jogo](#-sobre-o-jogo)
- [Modos de Jogo](#-modos-de-jogo)
- [Features Implementadas](#-features-implementadas)
- [Modo Treino](#-modo-treino)
- [Multiplayer: Salas](#-multiplayer-salas)
- [Arcanum: Jogo da Memória](#-arcanum-jogo-da-memória)
- [Shinobi: Narutodle](#-shinobi-narutodle)
- [Compartilhamento](#-compartilhamento)
- [Sistema de Efeitos Sonoros](#-sistema-de-efeitos-sonoros)
- [Dialogs Responsivos](#-dialogs-responsivos)
- [Hooks Customizados](#-hooks-customizados)
- [Início Rápido](#-início-rápido)
- [Deploy Automático](#-deploy-automático-github-actions)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Versionamento](#-versionamento)
- [A História Por Trás Deste Clone](#-a-história-por-trás-deste-clone)

---

## 🎮 Sobre o Jogo

Adivinhe a palavra do dia em português! Cada palpite revela dicas sobre as letras:

- 🟩 **Verde**: Letra correta na posição correta
- 🟨 **Amarelo**: Letra correta na posição errada
- ⬛ **Cinza**: Letra não existe na palavra
- 🔳 **Branco**: Tile não utilizado

---

## 🕹️ Modos de Jogo

> 🧭 A raiz `/` é o **hub** (landing page) com um card para cada jogo. Rotas antigas (`/2`, `/4`, `/6`, `/seis`) e caminhos desconhecidos redirecionam para o hub.

### Jogos de palavras (single player)

| Modo | Tabuleiros | Letras | Tentativas | Rota |
|------|-----------|--------|-----------|------|
| **Termo** | 1 palavra | 5 | 6 | `/termo` |
| **Dueto** | 2 palavras | 5 | 7 | `/dueto` |
| **Quarteto** | 4 palavras | 5 | 9 | `/quarteto` |
| **🔠 Modo 6** | 1 palavra | **6** | 6 | `/modo-seis` |
| **🎮 Treino** | 1 palavra (aleatória, ilimitado) | 5 | 6 | `/treino` |
| **🕰️ Arquivo** | qualquer modo, dias anteriores | — | — | `?dia=N` |

> 🔠 **Modo 6** usa palavras de **6 letras**, com dicionário próprio gerado do `br-utf8.txt` e soluções curadas por frequência (ver [`termooo-builder`](../termooo-builder) e `src/game/words-seis.ts`). O engine é genérico no tamanho da palavra (`wordLength`), então o "5" deixou de ser fixo.

### Multiplayer (Salas)

| Tipo | Como funciona | Rota |
|------|---------------|------|
| **🤝 Cooperativo** | O anfitrião joga e todos sugerem no chat | `/sala`, `/sala/:code` |
| **🏆 Competição** | Cada jogador tem o próprio tabuleiro; **partida de N rodadas** somando tempo — vence o **menor tempo total** | `/sala`, `/sala/:code` |
| **⏱️ Time Trial** | Tempo fixo no relógio (escolhido pelo host); **partida de N rodadas** somando **pontos** (rapidez + menos tentativas) — vence o **maior total** | `/sala`, `/sala/:code` |

> 🔁 Competição e Time Trial são **multi-rodada** (3/5/10 ou personalizado, 1–20): a pontuação **acumula** a cada rodada e cada rodada começa com uma **contagem regressiva 5→1 "Vai!"** (animada e com som), igual para todos.

### Outros jogos do hub

| Jogo | Como funciona | Rota |
|------|---------------|------|
| **🃏 Arcanum** | Jogo da memória: encontre os pares de sígilos arcanos em 3 dificuldades (4×4, 6×4, 6×6), com sequências, estrelas e pontuação | `/memoria` |
| **🥷 Shinobi** | Estilo **Narutodle**: adivinhe o **personagem de Naruto do dia** com dicas por categoria (gênero, afiliações, jutsus, kekkei genkai, naturezas, atributos e arco de estreia); palpites ilimitados | `/shinobi` |

---

## ✨ Features Implementadas

### 🎯 Core do Jogo
- Palavra do dia determinística (mesma para todos no mesmo dia)
- 10.589 palavras extraídas do Term.ooo original
- Normalização automática de acentos (digite sem acentos!)
- Avaliação precisa em 2 passos (correct → present → absent)
- Sistema de validação com dicionário completo
- Hard Mode: use as dicas reveladas nas próximas tentativas
- Persistência de estado e estatísticas no localStorage
- Single player 100% client-side (multiplayer usa backend WebSocket dedicado)

### 🎨 Interface e UX
- **Navegação avançada com cursor:**
  - Setas ← → para navegar entre posições
  - Space para pular para próxima vazia
  - Click direto nos tiles para posicionar cursor
  - Edição não-linear (substitui ao invés de inserir)

- **Animações 3D extraídas do código original:**
  - 🔄 Flip rotateY ao revelar tiles
  - ✨ Pop ao digitar letra
  - 🎊 Happy jump ao acertar palavra
  - 📳 Shake em tentativas inválidas

- **Teclado visual inteligente:**
  - Cores por estado de letra em cada board
  - Gradiente linear 50/50 no Dueto
  - Gradiente conic (pizza) no Quarteto
  - Estados: correct/present/absent/unused

- **Estatísticas detalhadas:**
  - Medalhas de ouro, prata, bronze e caveira (🥇🥈🥉💀)
  - Distribuição de tentativas
  - Porcentagem de vitórias, streak atual e melhor
  - ⏱️ Tempo médio por solução (média do tempo das vitórias cronometradas)
  - Separadas por modo de jogo (Treino e Arquivo não contam para a streak diária)

### 📱 Recursos Adicionais
- 🔠 **Modo 6** — palavras de 6 letras (engine genérico no tamanho da palavra; dicionário próprio do `br-utf8.txt`)
- 🎮 **Modo Treino** ilimitado com palavras aleatórias
- 🃏 **Arcanum** — jogo da memória com 3 dificuldades, estrelas, streaks e áudio sintetizado (Web Audio)
- 🥷 **Shinobi** — Narutodle: personagem de Naruto do dia com dicas por categoria e palpites ilimitados
- 🏆 **Salas multiplayer** (Cooperativo, Competição e Time Trial) via WebSocket
- 🔁 **Partidas multi-rodada** competitivas com pontuação/tempo **acumulados** entre rodadas (3/5/10 ou personalizado)
- 🚦 **Contagem regressiva 5→1 "Vai!"** antes de cada rodada — animada (Framer Motion), com som sintetizado e sincronizada entre os jogadores
- 💬 **Chat em tempo real** dentro das salas
- 🔌 **Reconexão resiliente nas salas** — quedas de rede/reload não fazem perder o tabuleiro: reconexão automática + tabuleiro competitivo salvo no `localStorage` e reidratado ao voltar (o servidor preserva lugar/host/placar por ~20s)
- 🎵 **Efeitos sonoros e memes** durante o jogo
- 📱 **Interface 100% responsiva** (Dialog desktop / Sheet mobile)
- 📅 **Arquivo de Dias Anteriores** (últimos 30 dias)
- 📤 **Compartilhamento** como texto (grid de emojis) e como **imagem PNG** estilizada
- ⏱️ **Cronômetro de resolução em tempo real** — discreto, em todos os modos (Termo/Dueto/Quarteto/Modo 6/Treino) e também nas **salas**, sincronizado entre os jogadores
- ⏱️ Countdown visual para próxima palavra
- 🎨 Modo de alto contraste (acessibilidade)
- 💡 Palavras reveladas ao finalizar (para todos os membros, no multiplayer)
- 🔽 Toggle TopTabs (economiza espaço na tela)
- ℹ️ AboutDialog com história épica e animações
- 🐐 Botão Bodão com áudio (Béééééé!)
- ⭐ Fundo animado com estrelas
- 🏷️ Versionamento semântico visível na UI

### 🎮 Dev Mode (Easter Egg)
Pressione o Konami Code: `↑ ↑ ↓ ↓ ← → ← → B A`

**Ferramentas disponíveis:**
- 👁️ Revelar soluções do dia
- 🏆 Vitória instantânea (auto-complete)
- 🔄 Recarregar página rapidamente
- 🗑️ Limpar localStorage (com confirmação dupla)

Dica: abra as Configurações para lembrar o código! 😉

---

## 🎮 Modo Treino

Modo single player **ilimitado**, sem vínculo com o dia — ideal para praticar sem esperar 24h.

- 🎲 Palavra **aleatória** do dicionário a cada partida (base do Termo, 5 letras, 6 tentativas)
- 🔁 Botão **"Jogar de novo"** ao terminar (no diálogo de resultado e como botão flutuante)
- 📊 **Estatísticas de sessão** (jogos, % de vitórias, sequência, melhor) — mantidas em memória e **não** poluem a streak diária
- 🔓 Retoma uma partida em andamento ao recarregar; partidas concluídas geram uma palavra nova
- 🚪 Acesse pela aba **🎮 Treino** ou pela rota `/treino`

**Arquivos principais:** `useGameMode`, `usePersistentGameState`, `useStatsTracker`, `TrainingResultDialog`, `engine.getRandomDayNumber()`

---

## 🏆 Multiplayer: Salas

Salas multiplayer em tempo real via WebSocket. O **tipo da sala é escolhido na criação** e fixo durante toda a sua vida.

### 🤝 Cooperativo
- O **anfitrião** joga e transmite o tabuleiro em tempo real
- Os demais **assistem** e participam pelo **chat** (sugerindo palpites)
- Digitação ao vivo do host visível para os espectadores
- ⏱️ **Cronômetro compartilhado**: inicia na 1ª tecla do host e congela ao terminar — o mesmo valor para todos
- Ao fim da rodada a palavra é **revelada para todos**

### 🏆 Competição (corrida de tempo, multi-rodada)
- **Todos jogam** o próprio tabuleiro na **mesma palavra** por rodada (Termo, Dueto ou Quarteto)
- O anfitrião escolhe o **nº de rodadas** (presets 3/5/10 ou 1–20) e o modo, e **inicia a partida** (mínimo de **2 jogadores**)
- 🏁 **Pontuação = tempo acumulado:** soma-se o tempo de resolução de cada rodada; **vence quem somar MENOS tempo**
- Quem **não resolve** uma rodada recebe `(tempo do solver mais lento da rodada) + 1 min`; se **ninguém** resolve, a rodada é **anulada** (todos +0, sem afetar o ranking)
- A lista de membros vira um **ranking acumulado** (tempo total) com medalhas 🥇🥈🥉 ao final; durante a rodada cada linha mostra ✅ resolveu / 💀 não / ⏳ jogando, além das tentativas usadas
- **Fim de cada rodada:** quando todos terminam, **ou** quando o pódio (1º/2º/3º) está completo e resta apenas 1 jogador
- A palavra é **revelada** ao fim de cada rodada; ao fim da última, a classificação final é congelada

### ⏱️ Time Trial (contra o relógio, multi-rodada)
- Variante competitiva **contra o relógio**: o anfitrião escolhe **tempo fixo** (presets 1/2/3/5 min ou personalizado, 30s–15min), **nº de rodadas** e o **modo**, e dá a largada
- Um **cronômetro regressivo compartilhado** roda em cada rodada (destaque de urgência nos segundos finais)
- **Pontuação** (só quem resolve pontua): `1000 + tempo restante (até +1000) + 150 × tentativas não usadas`, **somada entre as rodadas** — vence o **maior total** (desempate pelo menor tempo total); quem não resolve fica com 0 na rodada
- **Fim de cada rodada:** o tempo esgota (encerramento autoritativo do servidor via *alarm*) **ou** todos terminam
- Ranking acumulado por **pontos**; pontos/tempo da rodada exibidos ao terminar

### 🚦 Rodadas e largada sincronizada
- Cada rodada (inclusive a 1ª) abre com uma **contagem regressiva 5→1 "Vai!"** mostrada a **todos** — animada (mola via Framer Motion + onda de energia) e com **bipes sintetizados via Web Audio** (respeitando o ajuste de som). Entre rodadas, a contagem exibe a **classificação acumulada**
- A largada é **autoritativa do servidor**: `roundStartedAt` é ancorado no **futuro** (`agora + 5s`), então o relógio do Time Trial e a medição de tempo só contam **após** o "Vai!" — ninguém é pego de surpresa
- As rodadas **avançam automaticamente** (sem ação do host): ao fim de uma, o servidor já prepara a próxima e transmite `round-advanced`
- Quem **entra no meio** da partida assiste e só joga na próxima; quem **sai** tem o placar congelado
- O **modo** e o **tempo** (Time Trial) são fixados na largada e valem para todas as rodadas
- O painel de resultado/fim aparece como **overlay escopado à coluna do jogo** (não cobre o chat) e usa o verde do tema

### Autoridade e modelo de rede
- O **servidor** (Cloudflare Durable Object) é autoridade sobre membros, host, modo, seed e `roundId`
- Os clientes derivam a palavra de `(modo, seed)` localmente via `getDailyWords`
- **Coop:** o host roda o engine e transmite o `GameState`; o servidor retransmite/persiste
- **Competição:** cada cliente roda seu próprio engine e reporta quando termina; o servidor controla o ranking e o fim de cada rodada
- **Time Trial:** como a competição, mas o servidor define o limite de tempo, **pontua** cada acerto e arma um *alarm* (Durable Object) que encerra a **rodada** no fim do relógio mesmo sem mensagens
- **Multi-rodada:** o servidor acumula os placares (`room.competition.cumulative`), avança automaticamente entre rodadas e ancora cada largada no futuro (`roundStartedAt = agora + 5s`) para a contagem regressiva. O conjunto de competidores é fixado na largada
- ⏱️ **Cronômetro autoritativo:** o servidor marca início/fim da rodada (`roundStartedAt`/`roundEndedAt`) e envia um bloco `timer` nas mensagens; cada cliente ancora no próprio relógio e conta localmente (sem broadcasts por segundo), mantendo os jogadores sincronizados com latência mínima
- Migração de host automática se o anfitrião sai (de fato); reconexão com re-sincronização (inclusive do cronômetro)

### 🔌 Resiliência a quedas (reconexão)

Um blip de rede ou reload no meio da partida **não** faz você perder o tabuleiro nem ser expulso da sala:

- **Reconexão automática robusta:** o `useChatConnection` reconecta com backoff exponencial (1→2→4→8→16s) e **tenta novamente mesmo após erros transitórios** (antes, um `onerror` cancelava a reconexão); detecta também conexões "meio-abertas" (ping sem pong) e força o reconnect.
- **Tabuleiro competitivo persistido:** em Competição/Time Trial cada palpite é salvo no `localStorage` (chave por rodada `room-<code>-<roundId>`) e **reidratado** ao reconectar — o servidor nunca vê seus palpites, então a recuperação é local. No Cooperativo o tabuleiro do host é recuperado via `game-state` do servidor.
- **Janela de tolerância no servidor (~20s):** ao cair você fica em *soft-disconnect* (mantém lugar, host e placar); voltar dentro da janela é transparente. Os outros veem **"caiu — reconectando…"** (`user-disconnected`) e **"voltou"** (`user-reconnected`) em vez de "saiu/entrou", e a rodada não termina à toa.
- **Identidade estável:** o `userId` no `localStorage` permite ao servidor reconhecer a mesma pessoa ao reconectar.

**Backend:** pacote separado `ws-cloudflare/` (Cloudflare Workers + Durable Objects).
**Componentes:** `RoomLobby`, `RoomScreen`, `RoomHeader`, `RoomSidebar`, `RoomInfoPanel`, `RoomChatPanel`, `RoundEndControls`, `CompetitionPanel`, `TimeTrialPanel`, `RoomTimer`, `RoundCountdown` (contagem regressiva), `MatchScore` (seletor de rodadas + ranking acumulado).
**Helpers:** `src/game/standings.ts` (ordenação do ranking acumulado).
**Hook orquestrador:** `useGameRoom` (sobre `useChatConnection`).

---

## 🃏 Arcanum: Jogo da Memória

Jogo da memória single player na rota `/memoria` — encontre os pares de **sígilos arcanos**.

- 🎚️ **3 dificuldades:** Aprendiz (4×4, 8 pares), Adepto (6×4, 12 pares) e Mestre (6×6, 18 pares), com prévia das cartas na largada
- 🔥 **Sequências (streaks)** com fanfarra, banner e explosão de partículas
- ⭐ **Avaliação por estrelas** derivada só da **precisão** (pares ÷ jogadas: ≥ 62,5% → 3★) — o tempo nunca muda as estrelas
- 🧮 **Pontuação 0–1000** = `700 × precisão + 300 × bônus de tempo` (bônus integral até o tempo-alvo da dificuldade: 40s/65s/100s, decaindo pela metade a cada tempo-alvo extra)
- 🎵 **Áudio 100% sintetizado via Web Audio** (música ambiente + efeitos, sem arquivos de áudio) com toggle persistido
- 🎉 Confete da vitória via `canvas-confetti` (Web Worker/OffscreenCanvas, fora do thread principal); partículas e starfield em canvas otimizado (60fps)
- 📦 **Módulo isolado** em `src/memory/` (CSS Modules, não interfere nos jogos de palavras) e carregado em **chunk separado** (lazy) — o bundle inicial não muda

**Arquivos principais:** `src/memory/MemoryGame.tsx`, `useMemoryGame.ts`, `MemoryCard.tsx`, `Starfield.tsx`, `audio.ts`, `particles.ts`, `confetti.ts`

---

## 🥷 Shinobi: Narutodle

Jogo diário estilo [Narutodle](https://narutodle.net/classic) na rota `/shinobi`: adivinhe o **personagem de Naruto/Naruto Shippūden do dia** com **palpites ilimitados**.

### Mecânica
- Cada palpite compara **7 categorias** com o personagem do dia: **gênero, afiliações, tipos de jutsu, kekkei genkai, naturezas de chakra, atributos e arco de estreia**
- 🟩 **Verde** = categoria idêntica · 🟨 **Amarelo** = interseção parcial · 🟥 **Vermelho** = nada em comum
- Na **Estreia**, setas **↑/↓** indicam se o personagem do dia aparece num arco **posterior/anterior** ao chutado (linha do tempo de 27 arcos, de "Terra das Ondas" a "Epílogo")
- 🔎 Busca com **autocomplete** (retratos + navegação por teclado) e normalização de diacríticos ("hyuga" encontra "Hyūga")
- 🎲 Personagem sorteado **deterministicamente** pelo `dayNumber` (PRNG mulberry32) — **mesmo personagem para todos**, 100% client-side, sem repetir o do dia anterior
- 💾 Persistência por dia + **sequência de vitórias** no `localStorage`; compartilhamento em grid de emojis (🟩🟨🟥🔼🔽); countdown para o próximo shinobi; "personagem de ontem"; tutorial na 1ª visita

### Dataset (offline, sem API em runtime)
- **122 personagens curados** (elenco notável de Naruto/Shippūden) em `src/naruto/data/characters.json`, versionado no repo
- Gerado offline pela **Dattebayo API** (Narutopedia) — a API **não** é consumida em runtime (free tier hiberna e derrubaria o jogo)
- Campos derivados por heurística + overrides manuais: **tipos de jutsu** (palavras-chave nas técnicas) e **arco de estreia** (episódio de estreia → faixa de arco)
- Pipeline: `naruto-data-lib.mjs` (normalização compartilhada) → `node generate-naruto-data.mjs` (dataset do jogo) e `node generate-naruto-tiers.mjs` (5 datasets progressivos em `database/` para validação de pool: 1431 → 1164 → 871 → 369 → 122)

**Arquivos principais:** `src/naruto/NarutoGame.tsx`, `useNarutoGame.ts`, `naruto-engine.ts`, `GuessGrid.tsx`, `CharacterSearch.tsx`, `CharacterAvatar.tsx`, `data/characters.json` — módulo isolado, **chunk lazy** próprio

---

## 📤 Compartilhamento

Compartilhe seu resultado em texto ou imagem — tudo com a paleta da marca (`night` / `eucalyptus` / `pistachio`).

### Como texto
- Grid de emojis (🟩🟨⬛) + cabeçalho `termo.enresshou.dev - Dia #N`
- Destinos: WhatsApp, X/Twitter, menu nativo do sistema e "Copiar texto"

### Como imagem (PNG)
- Card estilizado (`ShareCard`) renderizado para PNG via **html-to-image**
- Logo, estatísticas e distribuição de tentativas na paleta atual
- Web Share API no mobile (Instagram/Stories) com fallback de download no desktop

**Arquivos:** `ShareDropdown`, `ShareCard`, `useShareImage`, `lib/share-config.ts`, `engine.generateShareText()`.

---

## 🎵 Sistema de Efeitos Sonoros

Sistema de áudio com memes que tocam em momentos específicos do jogo (vitória, derrota, primeira tentativa, palavra inválida, compartilhamento e inatividade).

### Features de Áudio
- 🎵 **Hook `useSoundEffects`** - Sistema principal
- 📦 **Cache de HTMLAudioElement** - Performance otimizada
- ⚡ **Preload inteligente** - Sons críticos carregados na inicialização
- 🎚️ **Controle de volume** - Volume configurável por evento
- ⏱️ **Timer de inatividade** - Som após 15s sem jogar
- 🔇 **Toggle global** - Ativar/desativar no SettingsDialog
- 💾 **Persistência** - Preferência salva no localStorage

**Arquitetura:**
```
src/lib/sounds/
├── types.ts           # Tipos TypeScript
├── config.ts          # Mapeamento eventos → arquivos
└── useSoundEffects.ts # Hook principal
```

---

## 📱 Dialogs Responsivos

Sistema unificado de dialogs que se adaptam ao dispositivo!

### Como Funciona
- 🖥️ **Desktop**: Dialog modal centralizado
- 📱 **Mobile**: Sheet (drawer) da direita, 100% altura
- 🔄 **Automático**: Detecta breakpoint `md` (768px)
- 🎨 **Props separadas**: `desktopClassName` e `mobileClassName`
- 📜 **Scroll inteligente**: `ResponsiveScrollArea` contextual

### Componentes Responsivos
- `ResponsiveDialog` / `ResponsiveDialogContent` / `ResponsiveDialogHeader` / `ResponsiveDialogTitle` / `ResponsiveDialogDescription`
- `ResponsiveScrollArea` - Área de scroll contextual
- `DialogShell` - Base reutilizável para todos os dialogs

### Dialogs Implementados
- `HelpDialog` - Como jogar
- `StatsDialog` - Estatísticas
- `SettingsDialog` - Configurações
- `AboutDialog` - História do projeto
- `DevModeDialog` - Ferramentas de desenvolvedor
- `ArchiveDialog` - Dias anteriores
- `TrainingResultDialog` - Resultado do Modo Treino

### Features
- ✅ Abertura automática do `HelpDialog` em modos não iniciados
- ✅ Abertura automática do `StatsDialog` em jogos concluídos
- ✅ Gerenciamento centralizado com `useDialogManager`
- ✅ Animações com Framer Motion, fechamento com ESC e lock de scroll

---

## 🎣 Hooks Customizados

Arquitetura clean baseada em hooks reutilizáveis (`src/hooks/`).

### Multiplayer & Chat
| Hook | Responsabilidade |
|------|------------------|
| `useGameRoom` | Estado da sala, jogo, chat, host, competição e cronômetro sincronizado da rodada; persiste/reidrata o tabuleiro competitivo no `localStorage` ao (re)conectar |
| `useChatConnection` | Conexão WebSocket genérica, reconexão robusta (retry em erros transitórios + detecção de conexão meio-aberta) e heartbeat |

### UI
| Hook | Responsabilidade |
|------|------------------|
| `useDialogManager` | Gerenciamento centralizado de dialogs |
| `useDialogAnimations` | Animações de dialogs (Framer Motion) |
| `useBodyScrollLock` | Lock de scroll quando modal aberto |
| `useEscapeKey` | Fechar dialogs com tecla ESC |
| `useMediaQuery` | Detecção de breakpoints (mobile/desktop) |
| `useTemporaryState` | Estados temporários (ex: "Copiado!") |

### Jogo
| Hook | Responsabilidade |
|------|------------------|
| `useGameMode` | Modo de jogo e detecção de Treino/Arquivo via rota |
| `useGameAnimations` | Animações do jogo (flip, shake, happy, pop) |
| `useKeyboardInput` | Input de teclado físico e virtual |
| `usePersistentGameState` | Estado persistente + nova partida de Treino |
| `useStatsTracker` | Rastreamento de estatísticas diárias (inclui tempo médio de solução) |

### Compartilhamento & Áudio
| Hook | Responsabilidade |
|------|------------------|
| `useShareImage` | Geração de PNG via html-to-image + Web Share API |
| `useSoundEffects` | Sistema de efeitos sonoros (`src/lib/sounds/`) |

---

## 🚀 Início Rápido

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento (porta 5175)
pnpm run dev

# Build para produção
pnpm run build

# Preview do build de produção
pnpm run preview

# Lint do código
pnpm run lint
```

> O backend multiplayer fica no pacote `ws-cloudflare/` (Cloudflare Workers).
> Configure `VITE_CHAT_WS_URL` e `VITE_CHAT_ENABLED` (veja `.env.example`) para habilitar as salas.

---

## 🚀 Deploy Automático (GitHub Actions)

O frontend usa **GitHub Actions** + **GitHub Pages** com domínio customizado **[termo.enresshou.dev](https://termo.enresshou.dev)**, publicando a cada push na branch `main`.

### 🔄 Como Funciona

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

### 📋 Pipeline de Deploy

| Etapa | Ação |
|-------|------|
| 1️⃣ **Checkout** | Clone do repositório |
| 2️⃣ **Setup pnpm + Node 20** | Toolchain com cache |
| 3️⃣ **Install** | `pnpm install --frozen-lockfile` |
| 4️⃣ **Build** | `pnpm build` (Vite) com `VITE_CHAT_WS_URL` / `VITE_CHAT_ENABLED` |
| 5️⃣ **Upload + Deploy** | `actions/upload-pages-artifact` → `actions/deploy-pages` |

### 🔗 URLs

- **Production:** https://termo.enresshou.dev/
- **Actions Dashboard:** https://github.com/arthr/term-ooo/actions
- **Workflow File:** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

### ⚙️ Configuração do Vite

`vite.config.ts` usa `base: '/'` (domínio customizado na raiz) e serve o dev na porta **5175**.

---

## 🛠️ Stack Tecnológico

### Core
- **Vite 5** - Build tool ultrarrápido
- **React 18** - UI framework
- **TypeScript 5** - Type safety e IntelliSense
- **React Router 6** - Navegação SPA (rotas de modo, treino e salas)

### UI/Styling
- **Tailwind CSS 3** - Utility-first CSS (paleta `night`/`eucalyptus`/`pistachio`)
- **shadcn/ui** - Componentes acessíveis (Radix UI)
- **Framer Motion / Motion** - Animações fluidas e interativas
- **Lucide React** - Ícones SVG modernos
- **class-variance-authority** + **tailwind-merge** + **clsx** - Composição de classes
- **Animate UI** - Componentes animados (StarsBackground)

### Real-time, Áudio & Imagem
- **WebSocket nativo** no cliente, **Cloudflare Workers + Durable Objects** no backend (`ws-cloudflare/`)
- **HTMLAudioElement API** - Sistema de efeitos sonoros
- **html-to-image** - Geração de imagem PNG para compartilhamento

### Libs Auxiliares
- **react-countdown** - Countdown visual
- **react-day-picker** - Calendário do ArchiveDialog

### Ferramentas Dev
- **ESLint 9** (flat config) + **TypeScript ESLint**
- **PostCSS** - Processamento CSS

---

## 📁 Arquitetura do Projeto

```
term-ooo/
├── public/                       # Assets estáticos (sons, og-image, etc.)
├── database/                     # Código original (referência/estudo) + datasets de validação do Shinobi (tiers)
├── .github/workflows/deploy.yml  # GitHub Actions CI/CD
├── src/
│   ├── components/
│   │   ├── Chat/                 # Chat das salas
│   │   │   ├── ChatButton.tsx
│   │   │   ├── ChatMessageList.tsx
│   │   │   ├── ChatMessageItem.tsx
│   │   │   ├── ChatMessageInput.tsx
│   │   │   └── ChatNicknameForm.tsx
│   │   ├── Room/                 # 🆕 Salas multiplayer
│   │   │   ├── RoomLobby.tsx
│   │   │   ├── RoomScreen.tsx
│   │   │   ├── RoomHeader.tsx
│   │   │   ├── RoomSidebar.tsx
│   │   │   ├── RoomInfoPanel.tsx     # lista de membros / ranking
│   │   │   ├── RoomChatPanel.tsx
│   │   │   ├── RoundEndControls.tsx  # fim de rodada (coop)
│   │   │   ├── CompetitionPanel.tsx  # 🆕 competição (corrida de tempo, multi-rodada)
│   │   │   ├── TimeTrialPanel.tsx    # 🆕 Time Trial (pontos, multi-rodada)
│   │   │   ├── RoomTimer.tsx         # 🆕 cronômetro sincronizado da sala
│   │   │   ├── RoundCountdown.tsx    # 🆕 contagem regressiva 5→1 "Vai!" (animada + som)
│   │   │   └── MatchScore.tsx        # 🆕 seletor de rodadas + ranking acumulado
│   │   ├── new/                  # Board/Tile atuais (estilo Figma)
│   │   │   ├── GameBoard.tsx
│   │   │   └── Tile.tsx
│   │   ├── animate-ui/           # Componentes animados (stars)
│   │   ├── ui/                   # shadcn/ui + responsive-dialog, dropdown, etc.
│   │   ├── AboutDialog.tsx
│   │   ├── ArchiveDialog.tsx
│   │   ├── DevModeDialog.tsx
│   │   ├── DialogShell.tsx
│   │   ├── GameLayout.tsx
│   │   ├── GameTimer.tsx         # 🆕 cronômetro de resolução (single + salas)
│   │   ├── Header.tsx
│   │   ├── HelpDialog.tsx
│   │   ├── Keyboard.tsx
│   │   ├── SettingsDialog.tsx
│   │   ├── ShareCard.tsx         # card -> imagem PNG
│   │   ├── ShareDropdown.tsx     # menu de compartilhamento
│   │   ├── StatsDialog.tsx
│   │   ├── TopTabs.tsx           # abas Termo/Dueto/Quarteto/Modo 6/Treino
│   │   └── TrainingResultDialog.tsx  # 🆕 resultado do Treino
│   ├── hooks/                    # Hooks customizados (ver seção acima)
│   ├── game/
│   │   ├── engine.ts             # Motor (avaliação, validação, palavra aleatória)
│   │   ├── mode-config.ts        # Config por modo (tentativas, boards, wordLength, dicionários)
│   │   ├── storage.ts            # Interface com localStorage
│   │   ├── types.ts              # Tipos do jogo
│   │   ├── room-types.ts         # 🆕 Protocolo das salas (coop + competição + Time Trial, multi-rodada)
│   │   ├── standings.ts          # 🆕 Ordenação/medalhas do ranking acumulado
│   │   ├── chat-types.ts         # Tipos do chat
│   │   ├── share-utils.ts        # Render do grid de compartilhamento
│   │   ├── words-{termo,dueto,quarteto}.ts  # Dicionários (5 letras)
│   │   └── words-seis.ts         # 🆕 Modo 6 (palpites + soluções + acentos, 6 letras)
│   ├── lib/
│   │   ├── sounds/               # Sistema de áudio
│   │   ├── chat-config.ts / chat-utils.ts
│   │   ├── room-config.ts        # 🆕 Config das salas (URL WS, limites)
│   │   ├── share-config.ts       # Branding/cores da imagem de share
│   │   ├── dates.ts              # Módulo central de datas
│   │   ├── routes.ts             # Paths nomeados de todas as rotas/jogos
│   │   ├── utils.ts / z-index.ts / version.ts
│   ├── memory/                   # 🃏 Arcanum — jogo da memória (módulo isolado, chunk lazy)
│   ├── naruto/                   # 🥷 Shinobi — Narutodle (módulo isolado, chunk lazy)
│   │   ├── NarutoGame.tsx / GuessGrid.tsx / CharacterSearch.tsx / CharacterAvatar.tsx
│   │   ├── naruto-engine.ts / useNarutoGame.ts
│   │   └── data/characters.json  # Dataset estático (gerado offline da Dattebayo API)
│   ├── App.tsx                   # Rotas + state manager do jogo
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Estilos globais + animações
├── ws-cloudflare/                # 🆕 Backend WebSocket (Cloudflare Workers + DO)
├── naruto-data-lib.mjs           # 🥷 Normalização compartilhada do dataset do Shinobi
├── generate-naruto-data.mjs      # 🥷 Gera src/naruto/data/characters.json (offline)
├── generate-naruto-tiers.mjs     # 🥷 Gera datasets de validação em database/
├── changelog.md
├── ROADMAP_FEATURES.md
├── vite.config.ts / tailwind.config.cjs / eslint.config.js
├── package.json
└── README.md                     # Este arquivo
```

---

## 🎯 Mecânicas Implementadas

### Avaliação de Palavras (2-Pass Algorithm)
```
Pass 1: Marca corretas (verdes)
Pass 2: Marca presentes (amarelas) considerando frequência
Restantes: Marca ausentes (cinzas)
```

### Palavra do Dia
- Algoritmo determinístico baseado em dias desde 01/01/2022
- Índice da palavra = `dayNumber % totalWords` — mesma palavra para todos
- **Treino** usa um índice aleatório; **Arquivo** usa o `dayNumber` de uma data passada

### Hard Mode
- Letra correta (verde) deve ser usada na mesma posição
- Letra presente (amarela) deve ser usada em alguma posição

### Cursor Inteligente
- Edição não-linear, navegação livre, Space pula para a próxima vazia

---

## 📦 Versionamento

Este projeto segue o [Semantic Versioning](https://semver.org/lang/pt-BR/) (SemVer).

### Versão Atual: **v0.6.0**

**Destaques desde a v0.4.x:**
- 🧭 **Hub de jogos** na raiz (`/`) com card para cada jogo
- 🃏 **Arcanum** (jogo da memória) e 🥷 **Shinobi** (Narutodle) — novos jogos em chunks lazy próprios
- 🔠 **Modo 6** (palavras de 6 letras; engine genérico no `wordLength`)
- 🎮 Modo Treino (jogo ilimitado com palavras aleatórias)
- 🏆 Salas multiplayer: Cooperativo, Competição e Time Trial
- 🔁 Partidas competitivas **multi-rodada** (pontuação/tempo **acumulados**) com **contagem regressiva 5→1 "Vai!"** sincronizada
- 🖼️ Compartilhamento como imagem (PNG) além do texto
- 📅 Arquivo de dias anteriores + layout mobile aprimorado
- 🌐 Rebranding para `termo.enresshou.dev`

**Histórico de Releases:**
- **v0.6.x** - Hub de jogos na raiz, **Arcanum** (jogo da memória) e **Shinobi** (Narutodle)
- **v0.5.x** - Treino, salas multiplayer (coop + competição + Time Trial), partidas multi-rodada com contagem regressiva, **Modo 6 (6 letras)**, share como imagem
- **v0.4.1** (2024-12-02) - Som de inatividade + fix settings
- **v0.4.0** (2024-12-02) - Sistema de efeitos sonoros
- **v0.2.0** (2024-11-30) - Chat WebSocket + Arquivo
- **v0.1.0** (2024-11-15) - Implementação inicial

**Documentação:** [changelog.md](changelog.md) · **Badge de versão:** visível no canto inferior da aplicação

---

## 🗺️ Features Futuras

Veja o [ROADMAP_FEATURES.md](ROADMAP_FEATURES.md) para a lista completa.

**Próximas ideias:**
1. 📊 Estatísticas avançadas com gráficos
2. 🌈 Temas customizáveis
3. 🏅 Sistema de conquistas
4. 🌍 Múltiplos idiomas

---

## 🤝 Contribuindo

Este é um projeto educativo. Sugestões e melhorias são bem-vindas!

---

## 📜 Créditos e Referências

### Jogo Original
- **Term.ooo**: [https://term.ooo](https://term.ooo)
- **Criador**: [Fernando Serboncini](https://www.linkedin.com/in/ferserboncini/)

### Inspiração
- **Wordle**: [https://www.nytimes.com/games/wordle/](https://www.nytimes.com/games/wordle/)
- **Criador**: Josh Wardle

### Agradecimentos
Este clone foi desenvolvido exclusivamente para **fins educacionais** e de aprendizado, sem objetivos comerciais.

As palavras, mecânicas e animações foram estudadas e replicadas do jogo original com respeito e admiração pelo trabalho do Fernando Serboncini.

---

## 📄 Licença

Projeto educativo sem fins comerciais.
