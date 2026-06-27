# 🗺️ Roadmap de Features

Features bônus sugeridas para expansão do Term.ooo Clone.

---

## 🎯 Prioridade Alta

### 1. 🎮 Modo Treino/Prática
**Status:** ✅ Concluído (Jun 2026)

**Descrição:**
- Modo de jogo **ilimitado** sem vinculação ao dia
- Palavras aleatórias do dicionário
- Botão "Jogar de novo" após cada partida
- Estatísticas separadas (ou sem estatísticas)

**Benefícios:**
- Permite treinar sem esperar 24h
- Aumenta engajamento e tempo no app
- Ideal para novos jogadores praticarem

**Complexidade:** ⭐⭐ Média

**Implementação final:**
- Variante single player do Termo (1 tabuleiro, 5 letras, 6 tentativas)
- ✅ `src/App.tsx` - Rota `/treino`, sessão de treino, botão "Jogar de novo" e wiring dos dialogs
- ✅ `src/game/engine.ts` - `getRandomDayNumber()` para sortear palavra aleatória
- ✅ `src/hooks/useGameMode.ts` - Detecta a rota `/treino` (flag `isTraining`, ignora `?dia`)
- ✅ `src/hooks/usePersistentGameState.ts` - Estado em `treino` (localStorage), retoma partida em andamento e `startNewTrainingGame()`
- ✅ `src/hooks/useStatsTracker.ts` - Treino NÃO conta para estatísticas/streak diárias
- ✅ `src/components/TopTabs.tsx` - Nova aba "🎮 Treino"
- ✅ `src/components/Header.tsx` - Badge "🎮 Modo Treino" + botão Home para sair
- ✅ `src/components/TrainingResultDialog.tsx` - Resultado com palavra, estatísticas da sessão (não persistidas) e "Jogar de novo"

**Detalhes:**
- Palavra sorteada do dicionário a cada partida, sem vínculo com o dia
- "Jogar de novo" disponível no dialog de resultado E como botão flutuante na tela principal
- Estatísticas de sessão (jogos, % vitórias, sequência, melhor) em memória — resetam ao recarregar
- Refresh durante uma partida em andamento retoma o jogo; após concluir, sorteia nova palavra

---

### 2. 📱 Layout Responsivo Mobile
**Status:** ✅ Concluído (Nov 2025)

**Descrição:**
- Otimização completa do layout para dispositivos móveis
- Tiles com aspect-ratio e tamanhos dinâmicos
- Grid 2x2 inteligente para Quarteto em mobile
- Espaçamentos ajustados (gap menor em mobile)
- Botões do Header otimizados (alguns ocultos em mobile)
- Keyboard com padding responsivo
- Font-size fluido usando clamp()

**Implementação:**
- ✅ `src/components/Tile.tsx` - aspect-square, min-w/h responsivo, font fluido
- ✅ `src/components/GameBoard.tsx` - Grid cols-5 para tiles, className prop
- ✅ `src/components/GameLayout.tsx` - Layouts específicos por modo
  - Termo: w-11/12 md:max-w-xs centralizado
  - Dueto: space-x-3 md:space-x-8
  - Quarteto: grid cols-2 em mobile, flex em desktop
- ✅ `src/components/Keyboard.tsx` - gap/padding otimizados
- ✅ `src/components/Header.tsx` - max-w-2xl, botões hidden em mobile
- ✅ `src/App.tsx` - Removido max-w excessivo

**Benefícios:**
- Experiência fluida em telas pequenas (320px+)
- Melhor uso do espaço disponível
- UX consistente entre mobile e desktop
- Performance mantida

**Complexidade:** ⭐⭐⭐ Média-Alta

---

### 3. 📅 Arquivo de Dias Anteriores (Time Machine)
**Status:** ✅ Concluído (Nov 2025)

**Descrição:**
- Jogar desafios de dias anteriores
- Seletor de data (calendário ou input)
- Indicador visual "Você está jogando o dia #X"
- Estatísticas separadas (ou marcadas como "Arquivo")
- Não conta para streak do dia atual

**Benefícios:**
- **MUITO demandado pela comunidade** (similar ao Wordle Archive)
- Permite jogadores novos experimentarem palavras antigas
- Perfeito para quem perdeu dias ou quer praticar específicos
- Aumenta drasticamente o engajamento e tempo no app
- Possibilita "maratonas" de múltiplos dias

**Complexidade:** ⭐⭐ Média

**Implementação sugerida:**
- Usar query param: `/termo?dia=123` ou `/termo/arquivo/123`
- Modificar `getDailyWords()` para aceitar `dayNumber` customizado
- UI: Botão "📅 Arquivo" no Header
- Dialog com calendário ou lista de dias
- Badge visual: "🕰️ Dia #123 - Arquivo"
- localStorage separado: `archive-termo-123`, `archive-dueto-123`, etc.

**Implementado:**
- ✅ `src/lib/dates.ts` - Módulo central de datas (88 linhas)
- ✅ `src/components/ArchiveDialog.tsx` - Calendar do shadcn/ui
- ✅ `src/App.tsx` - Query param `?dia=X` com validações
- ✅ `src/components/Header.tsx` - Botão Calendar (📅) e Home (🏠)
- ✅ `src/game/engine.ts` - Re-exporta funções de dates.ts
- ✅ `src/components/StatsDialog.tsx` - Detecta e marca "(Arquivo)"

**Implementação final:**
- ✅ Calendar visual com dark theme integrado
- ✅ Limite de 30 dias no passado (configurável)
- ✅ Stats de arquivo NÃO contam para streak
- ✅ Validação de segurança: bloqueia dias futuros
- ✅ Validação de gameState.dayNumber
- ✅ localStorage separado: `archive-{dayNumber}`
- ✅ Badge visual: "🕰️ Arquivo - Dia #X"
- ✅ Compartilhamento marca "(Arquivo)"
- ✅ START_DATE corrigida (01/01/2022)

---

### ⏱️ Cronômetro de Resolução & Tempo Médio
**Status:** ✅ Concluído (Jun 2026)

**Descrição:**
- Cronômetro **discreto em tempo real** durante a partida, em todos os modos single player (Termo, Dueto, Quarteto, Treino) — começa na primeira letra digitada e congela ao terminar
- **Tempo médio por solução** na tabela de Estatísticas (média do tempo das vitórias cronometradas) e tempo da partida no diálogo de resultado
- Nas **salas multiplayer**, cronômetro **compartilhado e sincronizado** entre os jogadores e **tempo de resolução por jogador** no ranking/pódio da Competição

**Benefícios:**
- Métrica de velocidade/progresso muito pedida pela comunidade
- Competição mais rica (comparação de tempos entre jogadores)

**Complexidade:** ⭐⭐⭐ Média-Alta (sincronização em tempo real no multiplayer)

**Implementação final:**
- ✅ `src/game/types.ts` — `startTime`/`endTime` em `GameState`; `totalSolveTimeMs`/`solveCount` em `Stats`
- ✅ `src/game/engine.ts` + `src/hooks/useStatsTracker.ts` — marca tempos e acumula a média (apenas vitórias)
- ✅ `src/components/GameTimer.tsx` — cronômetro reutilizável (single player e salas)
- ✅ `src/components/StatsDialog.tsx` / `TrainingResultDialog.tsx` — tempo médio + tempo da partida
- ✅ `ws-cloudflare/game-room.js` — `roundStartedAt`/`roundEndedAt`, bloco `timer`, mensagem `round-timing` e `solveMs` por finalista (autoridade do servidor)
- ✅ `src/hooks/useGameRoom.ts` — estado `roundTiming` ancorado no relógio local (sincronização sem broadcasts por segundo)
- ✅ `src/components/Room/RoomTimer.tsx`, `CompetitionPanel.tsx`, `RoomInfoPanel.tsx` — exibição na sala

---

### ⏱️ Modo Time Trial (Multiplayer)
**Status:** ✅ Concluído (Jun 2026)

**Descrição:**
- Terceiro tipo de sala **competitivo** (além de Cooperativo e Competição), sem afetá-los
- O anfitrião escolhe um **tempo fixo** (presets 1/2/3/5 min ou personalizado, 30s–15min) e o modo, e dá a largada
- **Cronômetro regressivo compartilhado** para todos; **pontuação** premia rapidez e menos tentativas (`1000 + tempo restante até +1000 + 150 × tentativas não usadas`); não-solvers ficam com 0
- **Fim:** tempo esgotado (alarm autoritativo do Durable Object) **ou** todos terminam; ranking/pódio por pontos

**Complexidade:** ⭐⭐⭐⭐ Alta (estado competitivo + alarm + pontuação sincronizada)

**Implementação final:**
- ✅ `ws-cloudflare/game-room.js` — `gameType: 'timetrial'`, `timeLimitMs`, `setAlarm`/`alarm()` de término, `computePoints`, `isMatchOver` (ramo Time Trial), `points`/`limitMs` nas mensagens
- ✅ `src/game/room-types.ts` — `timetrial`, `points`, `limitMs`, `timeLimitMs`
- ✅ `src/hooks/useGameRoom.ts` — trata Time Trial como competitivo; `startMatch(mode, timeLimitMs)`; `limitMs` no cronômetro
- ✅ `src/components/GameTimer.tsx` — modo contagem regressiva (`countdownFromMs`) com urgência
- ✅ `src/components/Room/TimeTrialPanel.tsx` — seleção de tempo + modo, pódio por pontos
- ✅ `src/components/Room/{RoomScreen,RoomInfoPanel,RoomLobby,RoomHeader,RoomTimer}.tsx`

> 🔁 Agora também **multi-rodada** com largada por contagem regressiva — ver a seção abaixo.

---

### 🔁 Partidas Multi-Rodada + Contagem Regressiva (Multiplayer)
**Status:** ✅ Concluído (Jun 2026)

**Descrição:**
- Competição e Time Trial viram **partidas de N rodadas** (presets 3/5/10 ou 1–20), com **pontuação acumulada** — nº de rodadas escolhido pelo host na largada (modo e tempo do Time Trial ficam fixos na partida)
- **Competição** vira uma **corrida de tempo**: soma o tempo de resolução de cada rodada, **menor total vence**; quem não resolve recebe `(tempo do solver mais lento da rodada) + 1 min`; rodada **anulada** (todos +0) se ninguém resolve
- **Time Trial** soma os **pontos** entre rodadas (maior total vence; desempate pelo menor tempo total)
- **Avanço automático** entre rodadas (o servidor pré-arma a próxima) e **contagem regressiva 5→1 "Vai!"** antes de cada rodada, mostrada a todos: animada (Framer Motion + onda de energia), com **bipes via Web Audio** e a classificação acumulada entre rodadas
- **Largada autoritativa:** `roundStartedAt` ancorado no futuro (`agora + 5s`) — o relógio do Time Trial e a medição de tempo só contam após o "Vai!"; `competitor-finished` é rejeitado durante a contagem
- Conjunto de competidores fixado na largada (quem entra depois assiste e joga na próxima; quem sai congela o placar)

**Complexidade:** ⭐⭐⭐⭐ Alta (máquina de estados de rodadas no Durable Object + sincronização da largada)

**Implementação final:**
- ✅ `ws-cloudflare/game-room.js` — `room.competition` multi-rodada (`currentRound`/`totalRounds`/`cumulative`/`competitors`), helpers `scoreRound`, `endCurrentRound`, `isRoundOver`, `activeCompetitors`, `broadcastRoundOutcome`; `alarm()` agora encerra a **rodada**; largada via `roundStartedAt = now + COUNTDOWN_MS`
- ✅ `src/game/room-types.ts` — mensagem `round-advanced`; campos `round`, `totalRounds`, `startsAt`, `competitorIds`, `roundFinishers`, `rounds`; totais acumulados em `CompetitorResult`
- ✅ `src/game/standings.ts` — ordenação e medalhas do ranking acumulado
- ✅ `src/hooks/useGameRoom.ts` — trata `round-advanced`, ancora largada/contagem (`countingDown`, `roundStartsAt`, `amCompetitor`) e acumula o placar
- ✅ `src/components/Room/RoundCountdown.tsx` — contagem 5→1 "Vai!" (Framer Motion + Web Audio)
- ✅ `src/components/Room/MatchScore.tsx` — seletor de rodadas + ranking acumulado
- ✅ `src/components/Room/{CompetitionPanel,TimeTrialPanel,RoomInfoPanel,RoomScreen}.tsx` — seletor de rodadas, ranking acumulado, status da rodada (✅/💀/⏳), bloqueio de digitação durante a contagem
- ✅ `src/components/GameTimer.tsx` — clamp para não exibir tempo negativo durante a contagem

---

### 4. 🖼️ Compartilhamento Rico (Imagem)
**Status:** 📋 Planejado

**Descrição:**
- Gerar imagem PNG do resultado
- Tiles coloridos ao invés de emojis
- Formato otimizado para redes sociais
- Logo/marca d'água opcional

**Benefícios:**
- Mais bonito e viral nas redes sociais
- Diferencial competitivo
- Atrai novos jogadores organicamente

**Complexidade:** ⭐⭐⭐ Média-Alta

**Tecnologias sugeridas:**
- `html2canvas` ou `canvas API`
- Renderização de tiles em canvas

**Arquivos a criar:**
- `src/lib/shareImage.ts` - Lógica de geração
- Modificar `StatsDialog.tsx` - Novo botão

---

## 🎯 Prioridade Média

### 5. 📊 Estatísticas Avançadas
**Status:** 📋 Planejado

**Descrição:**
- Gráfico de linha com histórico de 30 dias
- Calendário heatmap (dias jogados)
- ✅ Tempo médio por partida (implementado — ver "Cronômetro de Resolução & Tempo Médio")
- Melhor streak com visualização
- Exportar dados em JSON

**Benefícios:**
- Jogadores adoram ver progresso detalhado
- Gamificação e senso de evolução
- Comparação com amigos

**Complexidade:** ⭐⭐⭐⭐ Alta

**Tecnologias sugeridas:**
- `recharts` ou `chart.js` para gráficos
- Modificar estrutura de `Stats` em `types.ts`

---

### 6. 🌈 Temas Customizáveis
**Status:** 📋 Planejado

**Descrição:**
- Múltiplos temas de cores
- Opções: Padrão / Escuro / Cyberpunk / Natureza / Oceano
- Customizar cores de correct/present/absent
- Salvar preferência em localStorage

**Benefícios:**
- Personalização aumenta apego ao app
- Acessibilidade (diferentes preferências visuais)
- Fácil e rápido de implementar

**Complexidade:** ⭐⭐ Média

**Arquivos a modificar:**
- `src/game/types.ts` - Adicionar `theme` em `Settings`
- `src/index.css` - CSS variables por tema
- `src/components/SettingsDialog.tsx` - Seletor de tema

---

### 7. 🔠 Modo 6 Letras ("Modo 6")
**Status:** ✅ Concluído (Jun 2026)

**Descrição:**
- Variante single player de **1 tabuleiro** com palavras de **6 letras**, **6 tentativas**
- Aparece na UI junto a Termo/Dueto/Quarteto/Treino; rota `/6` (e `/seis`)
- Dicionário próprio: gerado do `br-utf8.txt` (~12 mil palavras de 6 letras = palpites) com **soluções curadas por frequência** (1.460, rank ≤ 10.000)

**Benefícios:**
- Aumenta longevidade do jogo; engine agora é genérico no tamanho da palavra (reaproveitável p/ outros tamanhos)

**Complexidade:** ⭐⭐⭐ Média-Alta (generalizar o "5" fixo do engine/UI + pipeline de dados)

**Nota de design:** mantido em **6 tentativas** (não 7). Por simulação de um solver guloso, o conjunto de 6 letras é até **mais fácil** que o Termo (média ~2,94 vs ~3,47 tentativas; 100% resolvidas em ≤5), então 6 é estatisticamente folgado — uma 7ª tentativa seria só "forgiveness" de UX, não necessidade.

**Implementação final:**
- ✅ `src/game/words-seis.ts` — `seisSolutions` / `seisAllowed` / `seisAllowedSet` / `seisAccentMap` (gerado pelo pacote `termooo-builder/`)
- ✅ `src/game/types.ts` — `GameMode` inclui `'seis'`
- ✅ `src/game/mode-config.ts` — campo `wordLength` em todos os modos + entrada `seis` (`maxAttempts: 6`, `numBoards: 1`, `wordLength: 6`, `displayName: 'Modo 6'`) + helper `getWordLength`
- ✅ `src/game/engine.ts` — `evaluateGuess`/`checkHardModeCompliance`/`createInitialGameState`/`processGuess`/`generateShareText` deixaram de fixar 5 e usam `wordLength`/`numBoards`
- ✅ `src/game/share-utils.ts` — emojis de linha vazia no tamanho da palavra
- ✅ `src/hooks/useKeyboardInput.ts` — input normalizado ao `wordLength` (sem crescer o array; corrige o bug da coluna extra no backspace)
- ✅ `src/components/GameLayout.tsx` + `new/GameBoard.tsx` + `new/Tile.tsx` — board com `wordLength` colunas e chave de tamanho `'seis'` (tiles menores p/ caber 6)
- ✅ `src/App.tsx` (rota `/6`, título), `src/hooks/useGameMode.ts` (`/6`,`/seis` → `seis`), `src/components/TopTabs.tsx` (aba "Modo 6"), `RoomHeader.tsx` + `useGameRoom.ts` (`MODE_*` ganharam `seis`)
- ✅ **Single player apenas**: as listas de criação de sala continuam `[termo, dueto, quarteto]` (o servidor só conhece dicionários de 5 letras)

**Pipeline de dados (`termooo-builder/`):**
- `extract-by-length.js` (extrai X letras do `br-utf8.txt`) → `curate-solutions.js` (cura por frequência) → `build-termo-words.js` (gera o `.ts`); ou o assistente interativo `criar-modo-termo.js`

---

## 🎯 Prioridade Baixa

### 8. 🏅 Sistema de Conquistas
**Status:** 💭 Ideia

**Descrição:**
- Badges por feitos especiais:
  - "Primeira Vitória"
  - "10 Vitórias Seguidas"
  - "Venceu em 1 Tentativa"
  - "100 Jogos Completos"
  - "Mestre do Dueto"
- Coleção de troféus
- Progresso visual
- Leaderboard global/local

**Complexidade:** ⭐⭐⭐⭐ Alta

---

### 9. 🌍 Múltiplos Idiomas
**Status:** 💭 Ideia

**Descrição:**
- Suporte para Inglês, Espanhol, etc.
- Dicionários por idioma
- Seletor de língua nas configurações

**Complexidade:** ⭐⭐⭐⭐⭐ Muito Alta

---

### 10. 👥 Modo Multiplayer/Competitivo
**Status:** ✅ Concluído (Jun 2026)

**Descrição:**
- Salas multiplayer em tempo real (criar/entrar por código) com chat integrado
- **Competir com amigos na mesma palavra** (modo Competição) — todos jogam a mesma seed
- **Ranking por tempo** — pódio com posição (ouro/prata/bronze) e tempo de resolução por jogador
- Três tipos de sala: **Cooperativo**, **Competição** e **Time Trial** (ver item correspondente)

**Benefícios:**
- Engajamento social e rejogabilidade
- Competição direta entre amigos com ranking e tempos comparáveis

**Implementação final:**
- ✅ `src/App.tsx` — Rotas `/sala` (lobby) e `/sala/:code` (sala)
- ✅ `src/game/room-types.ts` — Protocolo WebSocket: `RoomGameType` (`coop`/`competition`/`timetrial`), `CompetitorResult` (ranking, `solveRank`, `solveMs`), mensagens cliente↔servidor
- ✅ `src/hooks/useGameRoom.ts` — Estado da sala, jogo, papel de host e migração; autoridade do servidor sobre membros/seed/roundId
- ✅ `src/hooks/useChatConnection.ts` + `src/lib/chat-utils.ts` + `src/game/chat-types.ts` — Conexão genérica e identidade persistida
- ✅ `src/lib/room-config.ts` — `ROOM_CONFIG` e `buildRoomUrl`
- ✅ `src/components/Room/` — `RoomLobby`, `RoomScreen`, `RoomHeader`, `RoomInfoPanel`, `RoomSidebar`, `RoomChatPanel`, `CompetitionPanel`, `TimeTrialPanel`, `RoomTimer`, `RoundEndControls`
- ✅ `ws-cloudflare/game-room.js` — Backend em Durable Object (Cloudflare): autoridade de sala, ranking competitivo, cronômetro sincronizado e `solveMs` por finalista

**Detalhes:**
- Modo Competição: **multi-rodada** — mesma palavra por rodada; soma o tempo de resolução e vence o **menor tempo total** (ver "Partidas Multi-Rodada")
- Modo Cooperativo: anfitrião joga e os demais assistem/sugerem via chat
- Cronômetro compartilhado e sincronizado entre jogadores (autoridade do servidor, sem broadcasts por segundo)
- Migração de host automática quando o anfitrião sai
- Inclui também o **Modo Time Trial** competitivo e **partidas multi-rodada com contagem regressiva "Vai!"** (ver seções dedicadas acima)

---

## 📊 Legenda de Status

- 📋 **Planejado**: Feature definida, pronta para implementação
- 💭 **Ideia**: Conceito inicial, precisa de refinamento
- 🚧 **Em Progresso**: Sendo desenvolvida
- ✅ **Concluído**: Implementada e testada

## 📝 Notas

Features estão ordenadas por **demanda da comunidade** e **facilidade de implementação**.

Contribuições são bem-vindas! Veja as issues para features específicas.

---

**Última atualização:** Junho 2026

