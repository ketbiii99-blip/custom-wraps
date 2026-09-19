import { useEffect, useState } from 'react'
import { Backdrop } from './components/Backdrop'
import { GameProvider, useGame } from './state/GameProvider'
import { Home } from './screens/Home'
import { Players } from './screens/Players'
import { Teams } from './screens/Teams'
import { CategorySelect } from './screens/CategorySelect'
import { PowerUpSelect } from './screens/PowerUpSelect'
import { Board } from './screens/Board'
import { QuestionView } from './screens/QuestionView'
import { Winner } from './screens/Winner'
import { Admin } from './screens/Admin'

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#/, '') || '/'
}

function GameRouter() {
  const { state } = useGame()

  switch (state.phase) {
    case 'players':
      return <Players />
    case 'teams':
      return <Teams />
    case 'categories':
      return <CategorySelect />
    case 'powerups':
      return <PowerUpSelect />
    case 'board':
      return <Board />
    case 'question':
      return (
        <>
          <Board />
          <QuestionView />
        </>
      )
    case 'winner':
      return <Winner />
    case 'home':
    default:
      return <Home />
  }
}

export default function App() {
  const route = useHashRoute()

  if (route.startsWith('/admin')) {
    return (
      <>
        <Backdrop />
        <Admin />
      </>
    )
  }

  return (
    <GameProvider>
      <div className="app-shell">
        <Backdrop />
        <GameRouter />
      </div>
    </GameProvider>
  )
}
