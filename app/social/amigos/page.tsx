'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface FriendRow {
  id: string
  status: string
  user_id: string
  friend_id: string
  otherProfile: { name: string; username: string }
}

interface SearchResult { id: string; name: string; username: string }

export default function AmigosPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [myUsername, setMyUsername] = useState('')
  const [aceptados, setAceptados] = useState<FriendRow[]>([])
  const [entrantes, setEntrantes] = useState<FriendRow[]>([])
  const [salientes, setSalientes] = useState<FriendRow[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [resultado, setResultado] = useState<SearchResult | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: myProf } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    setMyUsername(myProf?.username || '')

    const { data: all } = await supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).order('created_at',{ascending:false})
    if (!all || all.length===0){ setLoading(false); return }

    const otherIds = all.map((f:any)=> f.user_id===user.id? f.friend_id : f.user_id)
    const { data: profs } = await supabase.from('profiles').select('id,name,username').in('id', otherIds)
    const map = new Map((profs||[]).map((p:any)=>[p.id,p]))

    const rows: FriendRow[] = all.map((f:any)=>({ id:f.id, status:f.status, user_id:f.user_id, friend_id:f.friend_id, otherProfile: map.get(f.user_id===user.id? f.friend_id : f.user_id) || {name:'Usuario', username:''} }))

    setEntrantes(rows.filter(r=> r.friend_id===user.id && r.status==='pending'))
    setSalientes(rows.filter(r=> r.user_id===user.id && r.status==='pending'))
    setAceptados(rows.filter(r=> r.status==='accepted'))
    setLoading(false)
  }

  useEffect(()=>{ cargarDatos() },[])

  const buscarAmigo = async () => {
    if (!busqueda.trim() || !userId) return
    setBuscando(true); setResultado(null); setNoEncontrado(false)
    const { data } = await supabase.from('profiles').select('id,name,username').ilike('username', busqueda.trim().toLowerCase()).maybeSingle()
    if (!data || data.id===userId) setNoEncontrado(true)
    else setResultado(data)
    setBuscando(false)
  }
    const enviarSolicitud = async (friendId: string) => {
    if (!userId) return
    const { data: existe } = await supabase.from('friendships').select('id').or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`).maybeSingle()
    if (existe){ alert('Ya existe una solicitud con este usuario'); return }
    await supabase.from('friendships').insert({ user_id: userId, friend_id: friendId, status:'pending' })
    setResultado(null); setBusqueda(''); alert('¡Solicitud enviada! 🤝'); cargarDatos()
  }

  const aceptarSolicitud = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status:'accepted' }).eq('id', friendshipId)
    cargarDatos()
  }
  const rechazarSolicitud = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    cargarDatos()
  }

  if (loading) return <main className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4"><div className="max-w-lg mx-auto flex items-center gap-3"><Link href="/social" className="text-gray-400">←</Link><h1 className="text-xl font-bold text-gray-800">👥 Amigos</h1></div></div>
      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5"><p className="text-sm text-orange-700 font-medium">Tu código</p><p className="text-2xl font-bold text-orange-600">@{myUsername}</p><p className="text-xs text-orange-500 mt-1">Compártelo para que te agreguen</p></div>

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="font-bold mb-3">Agregar amigo</h2>
          <div className="flex gap-2"><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} onKeyDown={e=>e.key==='Enter'&&buscarAmigo()} placeholder="@username" className="flex-1 border rounded-xl px-4 py-2.5 text-sm"/><button onClick={buscarAmigo} disabled={buscando} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm">{buscando?'...':'Buscar'}</button></div>
          {noEncontrado && <p className="text-sm text-red-400 mt-3">No encontramos ese usuario 😕</p>}
          {resultado && <div className="mt-3 flex justify-between bg-gray-50 rounded-xl p-4"><div><p className="font-bold">{resultado.name}</p><p className="text-xs text-gray-400">@{resultado.username}</p></div><button onClick={()=>enviarSolicitud(resultado.id)} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm">Agregar 🤝</button></div>}
        </div>

        {entrantes.length>0 && <div className="bg-white rounded-2xl border shadow-sm p-5"><h2 className="font-bold mb-3">Te quieren agregar ({entrantes.length})</h2><div className="space-y-3">{entrantes.map(f=><div key={f.id} className="flex justify-between items-center"><div><p className="font-medium">{f.otherProfile.name}</p><p className="text-xs text-gray-400">@{f.otherProfile.username}</p></div><div className="flex gap-2"><button onClick={()=>rechazarSolicitud(f.id)} className="px-3 py-1.5 rounded-xl text-sm bg-gray-100">✕</button><button onClick={()=>aceptarSolicitud(f.id)} className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-sm">Aceptar ✓</button></div></div>)}</div></div>}

        {salientes.length>0 && <div className="bg-white rounded-2xl border shadow-sm p-5"><h2 className="font-bold mb-3">Enviadas pendientes</h2>{salientes.map(f=><div key={f.id} className="flex justify-between py-1"><span>{f.otherProfile.name}</span><span className="text-xs text-orange-400">esperando</span></div>)}</div>}

        <div className="bg-white rounded-2xl border shadow-sm p-5"><h2 className="font-bold mb-3">Mis amigos {aceptados.length>0&&`(${aceptados.length})`}</h2>{aceptados.length===0? <p className="text-gray-400 text-sm text-center py-4">Aún no tienes amigos</p> : <div className="space-y-3">{aceptados.map(f=><div key={f.id} className="flex items-center gap-3 py-2"><div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">🔥</div><div><p className="font-medium">{f.otherProfile.name}</p><p className="text-xs text-gray-400">@{f.otherProfile.username}</p></div></div>)}</div>}</div>
      </div>
      <BottomNav active="social" />
    </main>
  )
}