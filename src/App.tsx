import { Outlet } from 'react-router-dom'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      <main className="safe-top flex-1 overflow-y-auto pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
