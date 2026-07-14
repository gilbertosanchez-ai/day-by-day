'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import BottomNav from '@/components/BottomNav'

interface Reward {
  id: string
  title: string
  description: string
  coins_required: number
  stock: number
  image_url: string | null
}

interface Profile {
  coins: number
  name: string
}

export default function RecompensasPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [canjeando, setCanjeando] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('coins_required')

      setProfile(profileData)
      setRewards(rewardsData || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleCanjear = async (reward: Reward) => {
    if (!profile) return
    if (profile.coins < reward.coins_required) {
      alert(`Te faltan ${reward.coins_required - profile.coins} 🪙 para canjear esta recompensa`)
      return
    }

    setCanjeando(reward.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Registrar canje
    await supabase.from('redemptions').insert({
      user_id: user.id,
      reward_id: reward.id,
      coins_spent: reward.coins_required,
      status: 'pending'
    })

    // Descontar monedas
    await supabase
      .from('profiles')
      .update({ coins: profile.coins - reward.coins_required })
      .eq('id', user.id)

    setProfile({ ...profile, coins: profile.coins - reward.coins_required })
    setSuccess(reward.title)
    setCanjeando(null)
  }

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
          <h1 className="text-xl font-bold text-gray-800">🏆 Recompensas</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1 flex items-center gap-1">
            <span>🪙</span>
            <span className="font-bold text-yellow-700">{profile?.coins}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8">

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-bold text-green-700">¡Canjeaste: {success}!</p>
            <p className="text-sm text-green-600 mt-1">Te contactaremos pronto para entregarte tu recompensa</p>
          </div>
        )}

        <div className="space-y-4">
          {rewards.map(reward => {
            const puedeCanjear = (profile?.coins || 0) >= reward.coins_required
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-2xl shadow-sm p-6 border ${puedeCanjear ? 'border-yellow-200' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{reward.title}</h3>
                    <p className="text-gray-500 text-sm mb-3">{reward.description}</p>
                    <div className="flex items-center gap-1">
                      <span>🪙</span>
                      <span className="font-bold text-yellow-600">{reward.coins_required}</span>
                      <span className="text-gray-400 text-sm">monedas</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCanjear(reward)}
                    disabled={canjeando === reward.id || !puedeCanjear}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                      puedeCanjear
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canjeando === reward.id ? '...' : puedeCanjear ? 'Canjear' : 'Bloqueado'}
                  </button>
                </div>
                {!puedeCanjear && (
                  <p className="text-xs text-gray-400 mt-3">
                    Te faltan {reward.coins_required - (profile?.coins || 0)} 🪙 — sigue cumpliendo tus metas
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

     <BottomNav active="recompensas" />

    </main>
  )
}