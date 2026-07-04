# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- 🃏 **Jogo da Memória (Arcanum):** novo jogo single player na rota `/memoria` (card "Memória" no hub), port do protótipo `demo.html`. Três dificuldades (Aprendiz 4×4, Adepto 6×4, Mestre 6×6), prévia das cartas, sequências (streaks) com fanfarra, avaliação por estrelas, música ambiente e efeitos 100% sintetizados via Web Audio (sem arquivos de áudio). Módulo isolado em `src/memory/` com CSS Modules (não interfere nos jogos de palavras nem no multiplayer) e carregado por chunk separado (lazy) — o bundle inicial dos outros modos não muda
- Dependência `canvas-confetti` (confete da vitória renderizado em Web Worker/OffscreenCanvas, fora do thread principal)

### Performance
- Animações do Jogo da Memória otimizadas em relação ao protótipo (o fim de jogo travava): partículas em canvas único com sprites pré-renderizados (antes: dezenas de `<div>` com `box-shadow` animados), starfield com sprites (antes: centenas de `createRadialGradient` por frame), remoção de `backdrop-filter` sob camadas animadas e keyframes usando apenas `transform`/`opacity` — sequência de vitória medida a 60fps sem frames perdidos
- ⏱️ **Modo Time Trial (multiplayer):** terceiro tipo de sala competitivo com tempo fixo no relógio (host escolhe presets 1/2/3/5 min ou valor personalizado de 30s–15min). Cronômetro regressivo compartilhado; pontuação por tempo restante + tentativas não usadas; pódio/ranking por pontos. Encerramento autoritativo via *alarm* do Durable Object (ou quando todos terminam). Não altera os modos Cooperativo e Competição
- ⏱️ Cronômetro de resolução em tempo real (discreto) em todos os modos single player (Termo, Dueto, Quarteto, Treino) — inicia na primeira letra digitada e congela ao fim da partida
- Tempo médio por solução na tabela de Estatísticas (média das vitórias cronometradas) e tempo da partida no diálogo de resultado (incl. Treino)
- Cronômetro **compartilhado e sincronizado** nas salas multiplayer (Cooperativo e Competição): autoridade do servidor, contagem local em cada cliente (sem broadcasts por segundo), com re-sincronização em reconexão/troca de host
- Tempo de resolução por jogador no ranking e no pódio da Competição
- Campos `startTime`/`endTime` em `GameState` e `totalSolveTimeMs`/`solveCount` em `Stats`
- Componentes `GameTimer` (single + salas) e `Room/RoomTimer`
- Backend (`ws-cloudflare`): `roundStartedAt`/`roundEndedAt` no estado da sala, bloco `timer` nas mensagens de rodada, nova mensagem `round-timing` e `solveMs` por finalista
- 🔌 **Reconexão resiliente nas salas:** reconexão automática que **tenta novamente após erros transitórios** (antes, qualquer `onerror` cancelava a reconexão) + detecção de conexão meio-aberta (ping sem pong); tabuleiro competitivo persistido no `localStorage` por rodada (`room-<code>-<roundId>`) e **reidratado** ao voltar; novas mensagens de sala `user-disconnected`/`user-reconnected`
- Backend (`ws-cloudflare`): *soft-disconnect* com janela de tolerância (~20s, `DISCONNECT_GRACE_MS`) — uma queda **não** remove o jogador na hora (mantém lugar, host e placar); `pruneDisconnected()` aplica a saída real só após a janela (dirigido por mensagens/heartbeat, sem usar o `alarm` do Time Trial)

### Changed
- `storage.getStats` faz merge de defaults (compatibilidade com estatísticas antigas, sem os novos campos de tempo)
- Backend: `handleGameState` persiste `room` + `gameState` atomicamente (evita estado inconsistente em caso de hibernação/eviction do Durable Object)
- Backend: `handleMemberLeave` extraído em `finalizeLeave(room, userId)` (saída em memória reutilizável) para suportar a remoção tardia da janela de tolerância

### Fixed
- 🐛 **Salas (Competição/Time Trial): perda do tabuleiro ao reconectar/recarregar.** Um blip de rede derrubava o WebSocket; o cliente não reconectava (qualquer `onerror` cancelava a reconexão) e o servidor removia o jogador imediatamente, tratando a volta como entrada nova com tabuleiro **zerado** — além de poder encerrar a rodada cedo e pular a pontuação dele. Agora a reconexão é automática, o tabuleiro é restaurado do `localStorage` e o servidor segura o lugar do jogador por ~20s (eventos `user-disconnected`/`user-reconnected` no lugar de `user-left`/`user-joined`)

---

## [0.4.1] - 2024-12-02

### Added
- Evento de som 'waiting' ("Ó os cara no teto!") após 15s de inatividade
- Timer inteligente que dispara apenas após o primeiro chute
- Sistema de controle para tocar apenas uma vez por modo de jogo

### Fixed
- Merge de defaults em Settings para usuários antigos sem soundEnabled
- Prevenção de soundEnabled undefined no localStorage existente

---

## [0.4.0] - 2024-12-02

### Added
- Sistema de efeitos sonoros e memes durante o jogo
- Hook `useSoundEffects` com cache e preload inteligente
- Toggle "Efeitos Sonoros" no SettingsDialog
- 6 eventos de áudio configurados (vitória, derrota, compartilhar, etc)
- Campo `soundEnabled` em Settings (default: true)
- Cache de HTMLAudioElement para otimização de performance
- Preload automático de sons críticos na inicialização

---

## [0.2.0] - 2024-11-30

### Added
- Chat WebSocket em tempo real
- Sistema de autenticação de chat
- Indicador de usuários online
- Notificações de novas mensagens
- Histórico de palavras (ArchiveDialog)
- Calendário para seleção de dias anteriores

### Fixed
- Animações de tiles conflitando com transforms
- Gradientes dinâmicos do teclado em modo Dueto
- Mapeamento de cores do teclado em modo Quarteto
- Listener de teclado respeitando estados desabilitados
- Fluxo de atualização de palpites usando forma funcional do estado
- StatsDialog exibindo valores padrão quando estatísticas não disponíveis
- Configuração do ESLint para reconhecer globais do browser

---

## [0.1.0] - 2024-11-15

### Added
- Implementação inicial do clone Term.ooo
- Três modos de jogo: Termo, Dueto, Quarteto
- Sistema de estatísticas completo
- Modo difícil
- Modo alto contraste
- Animações 3D de tiles (flip, shake, happy jump)
- Teclado virtual responsivo
- Persistência de estado no localStorage
- Design responsivo mobile-first
- 10.589 palavras extraídas da base original
- Dev Mode secreto (Konami Code: ↑↑↓↓←→←→BA)
- Bodão easter egg (referência ao Orochinho)
- Compartilhamento de resultados

---

## Tipos de Mudanças

- `Added` - Novas funcionalidades
- `Changed` - Mudanças em funcionalidades existentes
- `Deprecated` - Funcionalidades que serão removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Correções de bugs
- `Security` - Correções de segurança

---

[Unreleased]: https://github.com/arthr/term-ooo/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/arthr/term-ooo/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/arthr/term-ooo/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/arthr/term-ooo/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/arthr/term-ooo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/arthr/term-ooo/releases/tag/v0.1.0
