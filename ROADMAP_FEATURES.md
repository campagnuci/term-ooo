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

### 7. 🎯 Modo 6 Letras
**Status:** 📋 Planejado

**Descrição:**
- Variante com palavras de 6 letras
- Dicionário específico para 6 letras
- Mais desafiador para veteranos

**Benefícios:**
- Aumenta longevidade do jogo
- Desafio extra para jogadores experientes

**Complexidade:** ⭐⭐⭐ Alta (precisa de novo dicionário)

**Arquivos necessários:**
- `src/game/words-seis.ts` - Novo dicionário
- Modificar `engine.ts` para suportar tamanho variável
- Ajustar UI dos tiles (6 ao invés de 5)

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
**Status:** 💭 Ideia

**Descrição:**
- Competir com amigos na mesma palavra
- Ranking por tempo

**Complexidade:** ⭐⭐⭐⭐⭐ Muito Alta (precisa backend)

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

