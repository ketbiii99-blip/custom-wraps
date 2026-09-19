import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { GameState, QuestionBank, Question } from '../types'
import { emptyState, reducer, STATE_VERSION, type Action } from './gameState'
import { GAME_KEY, readJSON, removeKey, writeJSON } from '../lib/storage'
import { loadBank, subscribeBank } from '../lib/bank'

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
  bank: QuestionBank
  questionById: (id: string | null) => Question | null
  savedGame: GameState | null
  resumeGame: () => void
  discardSaved: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

function isResumable(s: GameState | null): s is GameState {
  return !!s && s.version === STATE_VERSION && s.phase !== 'home' && s.phase !== 'winner'
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, emptyState)
  const [bank, setBank] = useState<QuestionBank>(() => loadBank())
  const [savedGame, setSavedGame] = useState<GameState | null>(() => {
    const stored = readJSON<GameState>(GAME_KEY)
    return isResumable(stored) ? stored : null
  })

  useEffect(() => subscribeBank(setBank), [])

  // حفظ تلقائي للّعبة الجارية حتى نقدر نكمّلها لاحقاً
  useEffect(() => {
    if (state.phase === 'home') return
    writeJSON(GAME_KEY, state)
  }, [state])

  useEffect(() => {
    if (state.phase === 'winner') removeKey(GAME_KEY)
  }, [state.phase])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      dispatch,
      bank,
      questionById: (id) => (id ? bank.questions.find((q) => q.id === id) ?? null : null),
      savedGame,
      resumeGame: () => {
        const stored = readJSON<GameState>(GAME_KEY) ?? savedGame
        if (isResumable(stored)) {
          const safe: GameState =
            stored.phase === 'question' && stored.current
              ? { ...stored, current: { ...stored.current, running: false } }
              : stored
          dispatch({ type: 'HYDRATE', state: safe })
        }
      },
      discardSaved: () => {
        removeKey(GAME_KEY)
        setSavedGame(null)
      },
    }),
    [state, bank, savedGame],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame لازم يكون داخل GameProvider')
  return ctx
}
