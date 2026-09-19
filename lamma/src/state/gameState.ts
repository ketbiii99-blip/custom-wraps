import type {
  ActiveQuestion,
  BoardCell,
  GameState,
  Points,
  Question,
  QuestionBank,
  TeamId,
} from '../types'
import { POWER_UPS_PER_TEAM } from '../data/powerups'
import { pickRandom, shuffle } from '../lib/utils'

export const STATE_VERSION = 1
export const CATEGORIES_PER_TEAM = 3
export const TOTAL_CATEGORIES = CATEGORIES_PER_TEAM * 2
export const POINT_TIERS: Points[] = [200, 400, 600]
export const DEFAULT_TIMER = 30
export const EXTRA_TIME = 30

export function emptyState(): GameState {
  return {
    version: STATE_VERSION,
    phase: 'home',
    players: [],
    teams: {
      A: { id: 'A', name: 'الفريق الأول', players: [], score: 0, powerUps: [] },
      B: { id: 'B', name: 'الفريق الثاني', players: [], score: 0, powerUps: [] },
    },
    categories: [],
    picks: { A: [], B: [] },
    pickingTeam: 'A',
    powerUpTurn: 'A',
    activeTeam: 'A',
    board: [],
    current: null,
    startedAt: null,
    finishedAt: null,
    defaultTimer: DEFAULT_TIMER,
  }
}

export function other(team: TeamId): TeamId {
  return team === 'A' ? 'B' : 'A'
}

/** يبني لوحة ٦ فئات × (٢٠٠،٢٠٠،٤٠٠،٤٠٠،٦٠٠،٦٠٠) بأسئلة عشوائية من البنك. */
export function buildBoard(bank: QuestionBank, categories: string[]): BoardCell[] {
  const cells: BoardCell[] = []
  for (const categoryId of categories) {
    for (const points of POINT_TIERS) {
      const pool: Question[] = bank.questions.filter(
        (q) => q.category === categoryId && q.points === points,
      )
      const chosen = pickRandom(pool, 2)
      for (const slot of [0, 1] as const) {
        cells.push({
          key: `${categoryId}:${points}:${slot}`,
          category: categoryId,
          points,
          slot,
          questionId: chosen[slot]?.id ?? null,
          status: 'open',
          wonBy: null,
        })
      }
    }
  }
  return cells
}

export function newActiveQuestion(
  cell: BoardCell,
  owner: TeamId,
  timer: number,
): ActiveQuestion {
  return {
    cellKey: cell.key,
    questionId: cell.questionId,
    owner,
    answering: owner,
    revealed: false,
    doubled: false,
    hintShown: false,
    transferred: false,
    secondChance: false,
    helpCalled: false,
    extraTimeGiven: false,
    timeLeft: timer,
    running: true,
  }
}

export function splitPlayers(players: string[]): Record<TeamId, string[]> {
  const shuffled = shuffle(players)
  const a: string[] = []
  const b: string[] = []
  shuffled.forEach((p, i) => (i % 2 === 0 ? a : b).push(p))
  return { A: a, B: b }
}

export function isGameOver(board: BoardCell[]): boolean {
  return board.length > 0 && board.every((c) => c.status === 'done')
}

export function remainingCells(board: BoardCell[]): number {
  return board.filter((c) => c.status === 'open').length
}

export function hasPowerUp(state: GameState, team: TeamId, id: string): boolean {
  return state.teams[team].powerUps.some((p) => p.id === id && !p.used)
}

export function powerUpsReady(state: GameState): boolean {
  return (['A', 'B'] as TeamId[]).every(
    (t) => state.teams[t].powerUps.length === POWER_UPS_PER_TEAM,
  )
}

export type Action =
  | { type: 'GOTO'; phase: GameState['phase'] }
  | { type: 'NEW_GAME' }
  | { type: 'HYDRATE'; state: GameState }
  | { type: 'ADD_PLAYER'; name: string }
  | { type: 'REMOVE_PLAYER'; name: string }
  | { type: 'AUTO_SPLIT' }
  | { type: 'MOVE_PLAYER'; name: string; team: TeamId | null }
  | { type: 'SET_TEAM_NAME'; team: TeamId; name: string }
  | { type: 'TOGGLE_CATEGORY'; categoryId: string }
  | { type: 'SET_CATEGORIES'; picks: Record<TeamId, string[]> }
  | { type: 'SET_PICKING_TEAM'; team: TeamId }
  | { type: 'TOGGLE_POWERUP'; team: TeamId; id: string }
  | { type: 'SET_POWERUP_TURN'; team: TeamId }
  | { type: 'START_BOARD'; board: BoardCell[] }
  | { type: 'OPEN_CELL'; cellKey: string }
  | { type: 'TICK' }
  | { type: 'SET_RUNNING'; running: boolean }
  | { type: 'USE_POWERUP'; id: string }
  | { type: 'REVEAL' }
  | { type: 'JUDGE'; correct: boolean }
  | { type: 'CLOSE_QUESTION' }
  | { type: 'SET_ACTIVE_TEAM'; team: TeamId }
  | { type: 'ADJUST_SCORE'; team: TeamId; delta: number }
  | { type: 'REMATCH'; board: BoardCell[] }

function withTeam(state: GameState, team: TeamId, patch: Partial<GameState['teams'][TeamId]>): GameState {
  return { ...state, teams: { ...state.teams, [team]: { ...state.teams[team], ...patch } } }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'GOTO':
      return { ...state, phase: action.phase }

    case 'NEW_GAME':
      return { ...emptyState(), phase: 'players' }

    case 'ADD_PLAYER': {
      const name = action.name.trim()
      if (!name || state.players.includes(name)) return state
      return { ...state, players: [...state.players, name] }
    }

    case 'REMOVE_PLAYER': {
      const players = state.players.filter((p) => p !== action.name)
      const teams = { ...state.teams }
      ;(['A', 'B'] as TeamId[]).forEach((t) => {
        teams[t] = { ...teams[t], players: teams[t].players.filter((p) => p !== action.name) }
      })
      return { ...state, players, teams }
    }

    case 'AUTO_SPLIT': {
      const split = splitPlayers(state.players)
      return {
        ...state,
        teams: {
          A: { ...state.teams.A, players: split.A },
          B: { ...state.teams.B, players: split.B },
        },
      }
    }

    case 'MOVE_PLAYER': {
      const teams = { ...state.teams }
      ;(['A', 'B'] as TeamId[]).forEach((t) => {
        teams[t] = { ...teams[t], players: teams[t].players.filter((p) => p !== action.name) }
      })
      if (action.team) {
        teams[action.team] = {
          ...teams[action.team],
          players: [...teams[action.team].players, action.name],
        }
      }
      return { ...state, teams }
    }

    case 'SET_TEAM_NAME':
      return withTeam(state, action.team, { name: action.name })

    case 'TOGGLE_CATEGORY': {
      const team = state.pickingTeam
      const mine = state.picks[team]
      const takenByOther = state.picks[other(team)].includes(action.categoryId)
      if (takenByOther) return state

      let picks: Record<TeamId, string[]>
      if (mine.includes(action.categoryId)) {
        picks = { ...state.picks, [team]: mine.filter((c) => c !== action.categoryId) }
      } else {
        if (mine.length >= CATEGORIES_PER_TEAM) return state
        picks = { ...state.picks, [team]: [...mine, action.categoryId] }
      }
      const nextTeam =
        picks[team].length >= CATEGORIES_PER_TEAM && picks[other(team)].length < CATEGORIES_PER_TEAM
          ? other(team)
          : state.pickingTeam
      return { ...state, picks, pickingTeam: nextTeam, categories: [...picks.A, ...picks.B] }
    }

    case 'SET_CATEGORIES':
      return {
        ...state,
        picks: action.picks,
        categories: [...action.picks.A, ...action.picks.B],
      }

    case 'SET_PICKING_TEAM':
      return { ...state, pickingTeam: action.team }

    case 'TOGGLE_POWERUP': {
      const team = state.teams[action.team]
      const has = team.powerUps.some((p) => p.id === action.id)
      let powerUps = team.powerUps
      if (has) {
        powerUps = powerUps.filter((p) => p.id !== action.id)
      } else {
        if (powerUps.length >= POWER_UPS_PER_TEAM) return state
        powerUps = [...powerUps, { id: action.id, used: false }]
      }
      return withTeam(state, action.team, { powerUps })
    }

    case 'SET_POWERUP_TURN':
      return { ...state, powerUpTurn: action.team }

    case 'START_BOARD':
      return {
        ...state,
        board: action.board,
        phase: 'board',
        startedAt: state.startedAt ?? Date.now(),
        finishedAt: null,
      }

    case 'OPEN_CELL': {
      const cell = state.board.find((c) => c.key === action.cellKey)
      if (!cell || cell.status === 'done') return state
      return {
        ...state,
        phase: 'question',
        current: newActiveQuestion(cell, state.activeTeam, state.defaultTimer),
      }
    }

    case 'TICK': {
      if (!state.current || !state.current.running) return state
      const timeLeft = Math.max(0, state.current.timeLeft - 1)
      return {
        ...state,
        current: { ...state.current, timeLeft, running: timeLeft > 0 },
      }
    }

    case 'SET_RUNNING':
      if (!state.current) return state
      return { ...state, current: { ...state.current, running: action.running } }

    case 'USE_POWERUP': {
      const cur = state.current
      if (!cur) return state
      const team = cur.answering
      if (!hasPowerUp(state, team, action.id)) return state

      const powerUps = state.teams[team].powerUps.map((p) =>
        p.id === action.id ? { ...p, used: true } : p,
      )
      const next: ActiveQuestion = { ...cur }

      switch (action.id) {
        case 'fazaa':
          next.helpCalled = true
          break
        case 'khoth_rahtak':
          next.timeLeft = cur.timeLeft + EXTRA_TIME
          next.extraTimeGiven = true
          next.running = true
          break
        case 'tsib_tkhib':
          next.secondChance = true
          break
        case 'hawwilha':
          next.transferred = true
          next.answering = other(cur.answering)
          next.timeLeft = state.defaultTimer
          next.running = true
          break
        case 'dablha':
          next.doubled = true
          break
        case 'oloum_ganoun':
          next.hintShown = true
          break
        default:
          break
      }

      return {
        ...withTeam(state, team, { powerUps }),
        current: next,
      }
    }

    case 'REVEAL':
      if (!state.current) return state
      return { ...state, current: { ...state.current, revealed: true, running: false } }

    case 'JUDGE': {
      const cur = state.current
      if (!cur) return state
      const cell = state.board.find((c) => c.key === cur.cellKey)
      if (!cell) return state
      const worth = cell.points * (cur.doubled ? 2 : 1)
      const answering = cur.answering

      let teams = state.teams
      let wonBy: TeamId | null = null

      if (action.correct) {
        wonBy = answering
        teams = {
          ...teams,
          [answering]: { ...teams[answering], score: teams[answering].score + worth },
        }
      } else if (cur.transferred) {
        // «حوّلها عليهم»: الإجابة الخاطئة تخصم قيمة السؤال من الفريق المحوَّل له
        teams = {
          ...teams,
          [answering]: { ...teams[answering], score: teams[answering].score - worth },
        }
      }

      const board = state.board.map((c) =>
        c.key === cur.cellKey ? { ...c, status: 'done' as const, wonBy } : c,
      )

      return {
        ...state,
        teams,
        board,
        current: { ...cur, revealed: true, running: false },
      }
    }

    case 'CLOSE_QUESTION': {
      const cur = state.current
      if (!cur) return { ...state, phase: 'board' }
      const nextTeam = other(cur.owner)
      const done = isGameOver(state.board)
      return {
        ...state,
        current: null,
        activeTeam: nextTeam,
        phase: done ? 'winner' : 'board',
        finishedAt: done ? Date.now() : null,
      }
    }

    case 'SET_ACTIVE_TEAM':
      return { ...state, activeTeam: action.team }

    case 'ADJUST_SCORE':
      return withTeam(state, action.team, {
        score: state.teams[action.team].score + action.delta,
      })

    case 'REMATCH':
      return {
        ...state,
        board: action.board,
        teams: {
          A: { ...state.teams.A, score: 0, powerUps: state.teams.A.powerUps.map((p) => ({ ...p, used: false })) },
          B: { ...state.teams.B, score: 0, powerUps: state.teams.B.powerUps.map((p) => ({ ...p, used: false })) },
        },
        current: null,
        activeTeam: 'A',
        phase: 'board',
        startedAt: Date.now(),
        finishedAt: null,
      }

    default:
      return state
  }
}
