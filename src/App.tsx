import { Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="safe-top flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
