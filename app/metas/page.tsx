'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Goal {
  id: string
  title: string
  category: string
  current_streak: number
  total_days: number
  status: string
  created_at: string
}

const categoryEmoji: Record<string, string> = {
  salud: '💪',
  espiritualidad: '🙏',
  estudio: '📚',
  negocio: '💼',
  ahorro: '💰',
  habito: '✅',
  general: '🎯'
}

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarMetas = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter === 'active') {
        query = query.eq('status', 'active')
      }

      const { data } = await query
      setGoals(data || [])
      setLoading(false)
    }
    cargarMetas()
  }, [filter])

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-4xl animate-spin">🔥</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">🎯 Mis Metas</h1>
          <Link href="/metas/nueva" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600">
            + Nueva
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'active' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            Todas
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Sin metas aún</h2>
            <p className="text-gray-400 mb-6">Crea tu primera meta y empieza hoy</p>
            <Link href="/metas/nueva" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600">
              Crear meta →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => (
              <Link key={goal.id} href={`/metas/${goal.id}`}>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{categoryEmoji[goal.category] || '🎯'}</span>
                      <div>
                        <h3 className="font-bold text-gray-800">{goal.title}</h3>
                        <p className="text-xs text-gray-400 capitalize mt-1">{goal.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span>🔥</span>
                        <span className="font-bold text-orange-500 text-xl">{goal.current_streak}</span>
                      </div>
                      <p className="text-xs text-gray-400">días</p>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">
                      <span className="font-bold text-gray-600">{goal.total_days}</span> días cumplidos
                    </p>
                    <p className="text-xs text-gray-400">
                      🪙 <span className="font-bold text-yellow-600">{goal.total_days * 10}</span> monedas
                    </p>
                    {goal.status !== 'active' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                        {goal.status}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

     <BottomNav active="metas" />

    </main>
  )
}