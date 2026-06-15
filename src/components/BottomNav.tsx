import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/today', label: '今日', icon: '🏋️' },
  { to: '/progress', label: '進捗', icon: '📈' },
  { to: '/body', label: '体組成', icon: '⚖️' },
  { to: '/settings', label: '設定', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs ${
                  isActive ? 'text-sky-400' : 'text-slate-400'
                }`
              }
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
