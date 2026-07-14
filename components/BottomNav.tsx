'use client'
import Link from 'next/link'

type ActiveTab = 'dashboard' | 'metas' | 'social' | 'recompensas' | 'perfil'

export default function BottomNav({ active }: { active: ActiveTab }) {
  const items = [
    { href: '/dashboard', icon: '🏠', label: 'Inicio', key: 'dashboard' },
    { href: '/metas', icon: '🎯', label: 'Metas', key: 'metas' },
    { href: '/social', icon: '🤝', label: 'Social', key: 'social' },
    { href: '/recompensas', icon: '🏆', label: 'Premios', key: 'recompensas' },
    { href: '/perfil', icon: '👤', label: 'Perfil', key: 'perfil' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3">
      <div className="max-w-2xl mx-auto flex justify-around">
        {items.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              active === item.key ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs ${active === item.key ? 'font-medium' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}