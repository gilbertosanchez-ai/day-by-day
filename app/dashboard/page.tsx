'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import AlarmaMetas from '@/components/AlarmaMetas'

interface Profile { name: string; coins: number }
interface Goal { id: string; title: string; category: string; current_streak: number; longest_streak: number; total_days: number }

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [amigosCount, setAmigosCount] = useState(0)
  const [solicitudesCount, setSolicitudesCount] = useState(0)
  const [reto, setReto] = useState<{title:string, desc:string, participantes:number} | null>(null)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: goalsData } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('status','active').order('created_at',{ascending:false})
      setProfile(profileData); setGoals(goalsData||[])

      const { data: friendships } = await supabase.from('friendships').select('status,friend_id,user_id').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      if(friendships){
        setAmigosCount(friendships.filter(f=>f.status==='accepted').length)
        setSolicitudesCount(friendships.filter(f=>f.friend_id===user.id && f.status==='pending').length)
      }
      // Reto semanal - intenta de tu tabla, si no hay muestra uno por defecto
      const { data: retoData } = await supabase.from('challenges').select('title,description').eq('is_active',true).limit(1).maybeSingle()
      if(retoData) setReto({title:retoData.title, desc:retoData.description, participantes: 124})
      else setReto({title:'7 días sin excusas', desc:'Completa tu meta todos los días esta semana', participantes: 89})

      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href='/landing' }
  if (loading) return <main className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>
    return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="text-2xl">🔥</span><div><p className="font-bold text-gray-800">¡Hola, {profile?.name}!</p><p className="text-xs text-gray-500">Sigue así, no te rindas</p></div></div>
          <div className="flex items-center gap-3"><div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1 flex items-center gap-1"><span>🪙</span><span className="font-bold text-yellow-700">{profile?.coins}</span></div><button onClick={handleLogout} className="text-sm text-gray-400">Salir</button></div>
        </div>
      </header>
<AlarmaMetas goals={goals as any} />

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* 1. LO MÁS IMPORTANTE */}
        <Link href="/metas/nueva" className="block w-full bg-orange-500 text-white rounded-2xl py-4 text-center font-semibold text-lg hover:bg-orange-600 transition-colors mb-6 shadow-sm">+ Nueva meta</Link>

        
        {/* 3. RETO Y TRIBU */}
<div className="grid grid-cols-2 gap-3 pb-20">
  <Link href="/social/retos" className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
    <span className="bg-white/20 text-[10px] px-2 py-1 rounded-full">⚡ RETO</span>
    <h3 className="font-bold text-sm mt-2 leading-tight">{reto?.title}</h3>
    <p className="text-white/80 text-[11px] mt-1 line-clamp-2">{reto?.desc}</p>
    <span className="bg-white text-orange-600 text-[11px] font-bold px-3 py-1 rounded-full inline-block mt-3">Unirme</span>
  </Link>
  <Link href="/social/amigos" className="bg-white rounded-2xl p-4 border border-gray-100">
    <div className="flex justify-between"><span className="text-[10px] font-bold text-gray-500">👥 TRIBU</span>{solicitudesCount>0 && <span className="bg-red-500 text-white text-[10px] px-2 rounded-full animate-pulse">{solicitudesCount}</span>}</div>
    <p className="text-2xl font-black mt-2">{amigosCount}</p><p className="text-xs text-gray-400">amigos</p>
    <span className="mt-3 bg-gray-900 text-white text-[11px] font-bold px-3 py-1 rounded-full inline-block">{solicitudesCount>0?`${solicitudesCount} solicitudes`:'Ver amigos'}</span>
  </Link>
</div>

        <BottomNav active="dashboard" />
      </div>
    </main>
  )
}