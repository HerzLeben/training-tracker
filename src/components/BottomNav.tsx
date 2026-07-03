import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/today', label: 'Today', icon: '🏋️' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/body', label: 'Body', icon: '⚖️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="safe-bottom shrink-0 border-t border-slate-200 bg-white">
      <ul className="flex">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              className={({ isActive }) =>
                `flex h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive ? 'text-[#01A09B]' : 'text-slate-400'
                }`
              }
            >
              <span className="text-lg leading-none" aria-hidden="true">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
