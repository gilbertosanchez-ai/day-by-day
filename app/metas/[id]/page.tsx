'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'

interface Goal {
  id: string
  title: string
  reason: string
  category: string
  current_streak: number
  longest_streak: number
  total_days: number
}

interface DailyCheck {
  id: string
  completed: boolean
  check_date: string
}

export default function MetaPage() {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [todayCheck, setTodayCheck] = useState<DailyCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const router = useRouter()
  const params = useParams()
  const goalId = params.id as string

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single()

      const { data: checkData } = await supabase
        .from('daily_checks')
        .select('*')
        .eq('goal_id', goalId)
        .eq('check_date', today)
        .single()

      setGoal(goalData)
      setTodayCheck(checkData)
      setLoading(false)
    }
    cargarDatos()
  }, [goalId])

  const handleCheck = async (completed: boolean) => {
    setChecking(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !goal) return

    // Registrar check del día
    await supabase
      .from('daily_checks')
      .upsert({
        user_id: user.id,
        goal_id: goalId,
        completed,
        check_date: today
      })

    if (completed) {
      // Actualizar racha y días totales
      const newStreak = goal.current_streak + 1
      const newLongest = Math.max(newStreak, goal.longest_streak)
      const newTotal = goal.total_days + 1

      await supabase
        .from('goals')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          total_days: newTotal
        })
        .eq('id', goalId)

      // Dar monedas al usuario (10 por día cumplido)
      const { data: profile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ coins: profile.coins + 10 })
          .eq('id', user.id)
      }

      setGoal({ ...goal, current_streak: newStreak, longest_streak: newLongest, total_days: newTotal })
    } else {
      // Romper la racha
      await supabase
        .from('goals')
        .update({ current_streak: 0 })
        .eq('id', goalId)

      setGoal({ ...goal, current_streak: 0 })
    }

    setTodayCheck({ id: '', completed, check_date: today })
    setChecking(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-4xl animate-spin">🔥</div>
      </main>
    )
  }

  if (!goal) return null

  return (
    <main className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">
            ←
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">{goal.title}</h1>
            <p className="text-xs text-gray-400 capitalize">{goal.category}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">

        {/* Racha */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
          <div className="text-7xl mb-2">🔥</div>
          <p className="text-6xl font-bold text-orange-500">{goal.current_streak}</p>
          <p className="text-gray-500 mt-1">días seguidos</p>
          <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-gray-50">
            <div>
              <p className="text-xl font-bold text-gray-700">{goal.total_days}</p>
              <p className="text-xs text-gray-400">días totales</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-700">{goal.longest_streak}</p>
              <p className="text-xs text-gray-400">mejor racha</p>
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-500">🪙 {goal.total_days * 10}</p>
              <p className="text-xs text-gray-400">monedas ganadas</p>
            </div>
          </div>
        </div>

        {/* Razón */}
        {goal.reason && (
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
            <p className="text-sm font-bold text-orange-700 mb-1">💭 Por qué lo haces:</p>
            <p className="text-gray-700">{goal.reason}</p>
          </div>
        )}

        {/* Check del día */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-center">
            ¿Cumpliste hoy?
          </h2>

          {todayCheck ? (
            <div className={`text-center py-6 rounded-xl ${todayCheck.completed ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-5xl mb-2">{todayCheck.completed ? '✅' : '😔'}</div>
              <p className={`font-bold ${todayCheck.completed ? 'text-green-600' : 'text-red-500'}`}>
                {todayCheck.completed ? '¡Lo lograste hoy! +10 🪙' : 'Mañana será mejor'}
              </p>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={() => handleCheck(true)}
                disabled={checking}
                className="flex-1 bg-green-500 text-white rounded-xl py-5 text-center font-bold text-lg hover:bg-green-600 disabled:opacity-50"
              >
                ✅ Sí lo hice
              </button>
              <button
                onClick={() => handleCheck(false)}
                disabled={checking}
                className="flex-1 bg-red-100 text-red-500 rounded-xl py-5 text-center font-bold text-lg hover:bg-red-200 disabled:opacity-50"
              >
                😔 No lo hice
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}