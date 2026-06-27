/**
 * useKeyboardInput.ts
 * 
 * Hook para gerenciar input de teclado (físico e virtual) do jogo.
 * Extrai 120+ linhas de lógica do App.tsx, tornando-a testável e isolada.
 * 
 * @example
 * ```tsx
 * const { handleKey } = useKeyboardInput({
 *   gameState,
 *   settings,
 *   onGuessSubmit: (result) => { //processar resultado },
 *   onCursorMove: (pos) => { //atualizar cursor },
 *   onTyping: (idx) => { //animação },
 *   onError: (msg) => { //mostrar erro },
 *   disabled: dialogManager.hasOpenDialog
 * })
 * 
 * // Passar para teclado virtual
 * <Keyboard onKeyPress={handleKey} />
 * ```
 */

import { useCallback, useEffect } from 'react'
import { GameState } from '@/game/types'
import { getWordLength } from '@/game/mode-config'

/**
 * Opções de configuração do hook
 */
export interface KeyboardInputOptions {
  /** Estado atual do jogo */
  gameState: GameState | null
  /** Callback quando o gameState.currentGuess precisa ser atualizado */
  onGuessChange: (newGuess: string[]) => void
  /** Callback quando um guess é submetido com ENTER */
  onSubmitGuess: () => void
  /** Callback quando o cursor é movido */
  onCursorMove: (position: number) => void
  /** Callback quando uma letra é digitada */
  onTyping: (index: number) => void
  /** Posição atual do cursor (controlada externamente) */
  cursorPosition: number
  /** Se o input deve estar desabilitado */
  disabled?: boolean
}

/**
 * Hook para gerenciar input de teclado
 * 
 * Encapsula toda a lógica de processamento de teclas:
 * - ENTER: submeter guess
 * - BACKSPACE: apagar letra
 * - ARROWLEFT/RIGHT: mover cursor
 * - SPACE: pular para próxima posição vazia
 * - A-Z: digitar letra
 * 
 * @param options - Configuração do hook
 * @returns Objeto com handler de teclas
 */
export function useKeyboardInput({
  gameState,
  onGuessChange,
  onSubmitGuess,
  onCursorMove,
  onTyping,
  cursorPosition,
  disabled = false
}: KeyboardInputOptions) {

  /**
   * Handler principal de teclas
   */
  const handleKey = useCallback((key: string) => {
    if (!gameState || gameState.isGameOver) return

    // Tamanho da palavra do modo atual (5 nos clássicos, 6 no Modo 6).
    const wordLength = getWordLength(gameState.mode)
    // Base normalizada com EXATAMENTE wordLength posições: impede o array de
    // crescer (bug do backspace além da última coluna) e cura estados salvos.
    const base = gameState.currentGuess.slice(0, wordLength)
    while (base.length < wordLength) base.push('')

    if (key === 'ENTER') {
      onSubmitGuess()
    } 
    else if (key === 'BACKSPACE') {
      // Posição-alvo a limpar:
      //  - cursor além do fim (todas preenchidas): apaga a última coluna;
      //  - cursor numa célula vazia: recua e apaga a anterior;
      //  - cursor numa célula preenchida: apaga ela mesma.
      let targetPos: number
      if (cursorPosition >= wordLength) {
        targetPos = wordLength - 1
        onCursorMove(targetPos)
      } else if (base[cursorPosition] === '') {
        if (cursorPosition > 0) {
          targetPos = cursorPosition - 1
          onCursorMove(targetPos)
        } else {
          return // Já no início e vazio, nada a fazer
        }
      } else {
        targetPos = cursorPosition
      }

      const newGuess = [...base]
      newGuess[targetPos] = ''
      onGuessChange(newGuess)
    }
    else if (key === 'ARROWLEFT') {
      onCursorMove(Math.max(0, cursorPosition - 1))
    } 
    else if (key === 'ARROWRIGHT') {
      onCursorMove(Math.min(wordLength - 1, cursorPosition + 1))
    }
    else if (key === ' ') {
      // Buscar próxima posição vazia (space = moveEditToNext)
      let nextEmpty = -1
      for (let i = 1; i < wordLength; i++) {
        const pos = (cursorPosition + i) % wordLength
        if (base[pos] === '') {
          nextEmpty = pos
          break
        }
      }

      if (nextEmpty !== -1) {
        onCursorMove(nextEmpty)
      } else {
        // Todas posições cheias, move o cursor para fora (uma além da última)
        onCursorMove(wordLength)
      }
    }
    else if (/^[A-Z]$/.test(key)) {
      // Digitar letra: SUBSTITUI na posição do cursor (não insere!)
      if (cursorPosition < wordLength) {
        const newGuess = [...base]
        newGuess[cursorPosition] = key.toLowerCase()

        // Ativar animação de digitação
        onTyping(cursorPosition)

        // Atualizar currentGuess
        onGuessChange(newGuess)

        // Mover para próxima posição vazia (moveEditToNext)
        let nextEmpty = -1
        for (let i = 1; i < wordLength; i++) {
          const pos = (cursorPosition + i) % wordLength
          if (newGuess[pos] === '') {
            nextEmpty = pos
            break
          }
        }

        if (nextEmpty !== -1) {
          onCursorMove(nextEmpty)
        } else {
          // Todas posições cheias, move o cursor para fora (uma além da última)
          onCursorMove(wordLength)
        }
      }
    }
  }, [gameState, cursorPosition, onGuessChange, onSubmitGuess, onCursorMove, onTyping])

  /**
   * Listener de teclado físico
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      // Ignorar quando o foco está num campo editável (ex.: chat da sala),
      // para não digitar no tabuleiro enquanto se escreve uma mensagem.
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return
      }

      const key = e.key.toUpperCase()

      if (key === 'ENTER') {
        handleKey('ENTER')
      } else if (key === 'BACKSPACE') {
        handleKey('BACKSPACE')
      } else if (key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
        e.preventDefault()
        handleKey(key)
      } else if (key === ' ') {
        e.preventDefault()
        handleKey(' ')
      } else if (/^[A-Z]$/.test(key)) {
        // Passar a tecla em maiúscula, será convertida para minúscula no handler
        handleKey(key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKey, disabled])

  return {
    handleKey,
  }
}

