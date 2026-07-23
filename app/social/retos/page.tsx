'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Reto {
  id: string; title: string; goal_days: number; status: string; stake: string | null; created_at: string; ends_at: string | null; challenger_id: string; challenged_id: string; winner_id: string | null;
  challenger: { name: string; username: string }; challenged: { name: string; username: string };
  challenge_progress: { user_id: string; days_completed: number }[]
}
interface Amigo { friend_id: string; profiles: { name: string; username: string } }

export default function RetosPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [retos, setRetos] = useState<Reto[]>([])
  const [amigos, setAmigos] = useState<Amigo[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [form, setForm] = useState({ challenged_id: '', title: '', goal_days: 30, stake: '' })
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Traer retos sin joins para evitar error 400
      const { data: retosRaw } = await supabase.from('challenges').select('*').or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`).order('created_at', { ascending: false })

      let retosEnriquecidos: Reto[] = []
      if(retosRaw && retosRaw.length>0){
        const ids = new Set<string>()
        retosRaw.forEach((r:any)=>{ ids.add(r.challenger_id); ids.add(r.challenged_id) })
        const { data: profs } = await supabase.from('profiles').select('id, name, username').in('id', Array.from(ids))
        const profMap = new Map((profs||[]).map((p:any)=>[p.id, p]))
        const { data: progress } = await supabase.from('challenge_progress').select('challenge_id, user_id, days_completed').in('challenge_id', retosRaw.map((r:any)=>r.id))

        retosEnriquecidos = retosRaw.map((r:any)=>({
          ...r,
          challenger: profMap.get(r.challenger_id) || { name: 'Yo', username: '' },
          challenged: profMap.get(r.challenged_id) || { name: 'Rival', username: '' },
          challenge_progress: (progress||[]).filter((p:any)=>p.challenge_id===r.id)
        }))
      }

      const { data: comoRequester } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id).eq('status','accepted')
      const { data: comoReceiver } = await supabase.from('friendships').select('user_id').eq('friend_id', user.id).eq('status','accepted')
      const friendIds = new Set<string>()
      ;(comoRequester||[]).forEach((r:any)=>{ if(r.friend_id) friendIds.add(r.friend_id) })
      ;(comoReceiver||[]).forEach((r:any)=>{ if(r.user_id) friendIds.add(r.user_id) })
      const idsArray = Array.from(friendIds)
      let amigosData: Amigo[] = []
      if(idsArray.length>0){
        const { data: profs } = await supabase.from('profiles').select('id, name, username').in('id', idsArray)
        amigosData = (profs||[]).map((p:any)=>({ friend_id: p.id, profiles: { name: p.name, username: p.username } }))
      }

      setRetos(retosEnriquecidos)
      setAmigos(amigosData)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const crearReto = async () => {
    if (!userId || !form.challenged_id || !form.title) return
    setCreando(true)
    const ends_at = new Date(); ends_at.setDate(ends_at.getDate() + form.goal_days)

    // FIX: insert sin select con joins, solo *
    const { data: retoRaw, error } = await supabase.from('challenges').insert({ challenger_id: userId, challenged_id: form.challenged_id, title: form.title, goal_days: form.goal_days, stake: form.stake || null, status: 'pending', ends_at: ends_at.toISOString() }).select('*').single()

    console.log('DEBUG crear reto:', { retoRaw, error })

    if (error) {
      alert('Error creando reto: ' + error.message)
      setCreando(false)
      return
    }

    if (retoRaw) {
      const rival = amigos.find(a=>a.friend_id===form.challenged_id)
      const nuevo: Reto = {
        ...retoRaw,
        challenger: { name: 'Tú', username: '' },
        challenged: rival?.profiles || { name: 'Amigo', username: '' },
        challenge_progress: []
      }
      setRetos(prev => [nuevo, ...prev])
      setForm({ challenged_id: '', title: '', goal_days: 30, stake: '' })
    }
    setCreando(false)
  }

  const responderReto = async (retoId: string, aceptar: boolean) => {
    if (!userId) return
    const nuevoStatus = aceptar ? 'active' : 'declined'
    await supabase.from('challenges').update({ status: nuevoStatus }).eq('id', retoId)
    if (aceptar) {
      const reto = retos.find(r => r.id === retoId)
      if (reto) { await supabase.from('challenge_progress').insert([{ challenge_id: retoId, user_id: reto.challenger_id, days_completed: 0 }, { challenge_id: retoId, user_id: reto.challenged_id, days_completed: 0 }]) }
    }
    setRetos(prev => prev.map(r => r.id === retoId ? { ...r, status: nuevoStatus, challenge_progress: aceptar ? [{user_id: r.challenger_id, days_completed: 0}, {user_id: r.challenged_id, days_completed: 0}] : r.challenge_progress } : r))
  }

  const statusLabel: Record<string, string> = { pending: '⏳ Pendiente', active: '🔥 Activo', completed: '🏆 Completado', declined: '❌ Rechazado' }
  const statusColor: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-700 border-yellow-200', active: 'bg-orange-50 text-orange-700 border-orange-200', completed: 'bg-green-50 text-green-700 border-green-200', declined: 'bg-gray-50 text-gray-400 border-gray-200' }

  if (loading) return <main className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4"><div className="max-w-lg mx-auto flex items-center gap-3"><Link href="/social" className="text-gray-400 hover:text-gray-600">←</Link><h1 className="text-xl font-bold text-gray-800">⚡ Retos</h1></div></div>
      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Nuevo reto</h2>
          {amigos.length === 0 ? (
            <div className="text-center py-4"><p className="text-gray-400 text-sm mb-3">Necesitas amigos</p><Link href="/social/amigos" className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar amigos →</Link></div>
          ) : (
            <div className="space-y-3">
              <select value={form.challenged_id} onChange={e => setForm({ ...form, challenged_id: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"><option value="">Selecciona a {amigos[0]?.profiles.name} (@{amigos[0]?.profiles.username})</option>{amigos.map(a => (<option key={a.friend_id} value={a.friend_id}>{a.profiles?.name} (@{a.profiles?.username})</option>))}</select>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: 30 días de gimnasio" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"/>
              <div className="flex gap-2 items-center flex-wrap"><span className="text-sm text-gray-500">Días:</span>{[7, 14, 21, 30, 60, 90].map(d => (<button key={d} onClick={() => setForm({ ...form, goal_days: d })} className={`px-3 py-1.5 rounded-xl text-sm font-medium ${form.goal_days === d ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{d}</button>))}</div>
              <input type="text" value={form.stake} onChange={e => setForm({ ...form, stake: e.target.value })} placeholder="Apuesta: El que pierde paga el café ☕" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm"/>
              <button onClick={crearReto} disabled={creando || !form.challenged_id || !form.title} className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50">⚡ Lanzar reto</button>
            </div>
          )}
        </div>
        {retos.length === 0 ? (<div className="bg-white rounded-2xl border p-10 text-center"><div className="text-5xl mb-3">⚡</div><p className="font-bold text-gray-700">Sin retos aún</p></div>) : (<div className="space-y-4"><h2 className="font-bold text-gray-800">Mis retos</h2>{retos.map(reto => {const soyRetado = reto.challenged_id === userId; const miProgreso = reto.challenge_progress?.find(p => p.user_id === userId); const suProgreso = reto.challenge_progress?.find(p => p.user_id !== userId); const rival = soyRetado ? reto.challenger : reto.challenged; return (<div key={reto.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${statusColor[reto.status]}`}><div className="flex items-start justify-between mb-3"><div><p className="font-bold text-gray-800">{reto.title}</p><p className="text-xs text-gray-400">vs {rival?.name} · {reto.goal_days} días</p></div><span className={`text-xs px-2 py-1 rounded-lg border font-medium ${statusColor[reto.status]}`}>{statusLabel[reto.status]}</span></div>{reto.stake && (<p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-3 py-2">🎯 {reto.stake}</p>)}{reto.status === 'active' && (<div className="grid grid-cols-2 gap-3 mb-3"><div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-orange-500">{miProgreso?.days_completed || 0}</p><p className="text-xs text-gray-400">Tú</p></div><div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-gray-500">{suProgreso?.days_completed || 0}</p><p className="text-xs text-gray-400">{rival?.name}</p></div></div>)}{reto.status === 'pending' && soyRetado && (<div className="flex gap-2 mt-3"><button onClick={() => responderReto(reto.id, true)} className="flex-1 bg-green-500 text-white rounded-xl py-2 text-sm font-semibold">Aceptar ✓</button><button onClick={() => responderReto(reto.id, false)} className="flex-1 bg-gray-100 text-gray-500 rounded-xl py-2 text-sm">Declinar</button></div>)}</div>)})}</div>)}
      </div>
      <BottomNav active="social" />
    </main>
  )
}
