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
  const [ranking, setRanking] = useState<{name: string, dias: number, esYo: boolean}[]>([])
  

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

      // Ranking semanal
const inicioSemana = new Date()
inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
inicioSemana.setHours(0,0,0,0)

const amigosIds = (friendships || [])
  .filter(f => f.status === 'accepted')
  .map(f => f.user_id === user.id ? f.friend_id : f.user_id)

const todosIds = [user.id, ...amigosIds]

const rankingData = await Promise.all(todosIds.map(async (uid) => {
  const { data: p } = await supabase.from('profiles').select('name').eq('id', uid).single()
  const { count } = await supabase
    .from('daily_checks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('completed', true)
    .gte('check_date', inicioSemana.toISOString().split('T')[0])
  return { name: p?.name || 'Usuario', dias: count || 0, esYo: uid === user.id }
}))

rankingData.sort((a, b) => b.dias - a.dias)
setRanking(rankingData)

      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href='/landing' }
  if (loading) return <main className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-4xl animate-spin">🔥</div></main>
  const frases = [
  "🔥 No importa qué tan lento vayas, siempre y cuando no te detengas.",
  "💪 Cada día que cumples tu meta eres mejor que ayer.",
  "🎯 El secreto del éxito es la consistencia diaria.",
  "🌟 Un día a la vez. Eso es todo lo que se necesita.",
  "⚡ Los hábitos no se construyen en un día, pero sí se rompen. Cuida el tuyo.",
  "🏆 El dolor de la disciplina es menor que el dolor del arrepentimiento.",
  "🔥 Hoy es otro día para demostrar de qué estás hecho.",
  "💡 No busques la motivación, busca la disciplina.",
  "🌅 Cada mañana es una nueva oportunidad de no rendirse.",
  "💪 Los campeones no nacen, se construyen día a día.",
  "🎯 Pequeños pasos todos los días llevan a grandes resultados.",
  "⚡ Tu racha de hoy es la historia de éxito de mañana.",
  "🔥 No te compares con nadie más que con quien eras ayer.",
  "🏆 La constancia vence al talento cuando el talento no es constante.",
  "🌟 Confía en el proceso. Los resultados llegarán.",
  "💡 Haz hoy lo que otros no hacen para tener mañana lo que otros no tienen.",
  "🎯 No es sobre ser perfecto, es sobre seguir intentando.",
  "⚡ Tu futuro yo te está agradeciendo por lo que haces hoy.",
  "🔥 La disciplina es elegirte a ti mismo una y otra vez.",
  "💪 No esperes a sentirte motivado. Actúa y la motivación llegará.",
  "🌅 Cada check de hoy es una inversión en quien serás.",
  "🏆 Las personas exitosas hacen lo que deben aunque no tengan ganas.",
  "💡 Un hábito construido vale más que mil buenas intenciones.",
  "🎯 Revisa tus metas. ¿Ya cumpliste la de hoy?",
  "⚡ Dale con todo hoy. No lo sueltes.",
  "🔥 La racha más larga empieza con un solo día. Este puede ser ese día.",
  "💪 No importa cuántas veces hayas fallado. Hoy vuelves a intentarlo.",
  "🌟 Eres más fuerte de lo que crees y más capaz de lo que imaginas.",
  "🏆 El éxito no es un accidente. Es trabajo, perseverancia y amor a lo que haces.",
  "💡 Cada vez que cumples tu meta le dices al mundo de qué estás hecho.",
  "🎯 No dejes para mañana el hábito que puedes construir hoy.",
  "⚡ Tus metas no se van a cumplir solas. Tú eres quien hace la diferencia.",
  "🔥 Un día sin cumplir tu meta es un día prestado al fracaso. No lo prestes.",
  "💪 El único entrenamiento malo es el que no hiciste.",
  "🌅 Hoy es un buen día para ser mejor que ayer.",
  "🏆 No busques el resultado, busca el hábito. El resultado viene solo.",
  "💡 Disciplina ahora, libertad después.",
  "🎯 Cada día que avanzas, tu versión futura sonríe.",
  "⚡ No pares cuando estés cansado. Para cuando hayas terminado.",
  "🔥 La grandeza no es para unos pocos. Es para los constantes.",
  "💪 Hoy no es opcional. Hoy se cumple.",
  "🌟 Recuerda por qué empezaste. Esa razón sigue siendo válida.",
  "🏆 El que persevera, alcanza. Tú estás perseverando.",
  "💡 No necesitas ser el mejor. Solo necesitas ser mejor que ayer.",
  "🎯 Tu meta de hoy es el ladrillo de tu futuro.",
  "⚡ Sigue. Solo sigue.",
  "🔥 El esfuerzo de hoy es el orgullo de mañana.",
  "💪 Cada racha empezó con alguien que decidió no rendirse. Ese eres tú.",
  "🌅 Levántate, cumple, descansa, repite. Eso es todo.",
  "🏆 No hay atajos para ningún lugar que valga la pena ir.",
  "💡 La motivación te arranca, el hábito te lleva.",
  "🎯 Sé la persona que tu yo del futuro necesita que seas hoy.",
  "⚡ Cumple tu meta aunque nadie te esté mirando. Tú te estás mirando.",
  "🔥 Un día más en la racha. Un día más ganado.",
  "💪 Lo que haces hoy importa más de lo que crees.",
  "🌟 No hay mejor momento que ahora para ser quien quieres ser.",
  "🏆 Los resultados son la suma de lo que haces cada día.",
  "💡 Haz que hoy valga la pena recordar.",
  "🎯 Tu disciplina de hoy es tu libertad de mañana.",
  "⚡ No lo dejes para después. Después nunca llega.",
]

const hoy = new Date()
const diaDelAnio = Math.floor((hoy.getTime() - new Date(hoy.getFullYear(), 0, 0).getTime()) / 86400000)
const fraseDelDia = frases[diaDelAnio % frases.length]
  
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

        {/* Frase motivacional del día */}
<div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6 shadow-sm">
  <p className="text-gray-800 font-bold text-center text-sm leading-relaxed">{fraseDelDia}</p>
  <p className="text-gray-400 text-xs text-center mt-2">— Frase del día 🔥</p>
<p className="text-gray-500 text-xs text-center mt-2">
  Revisa tus <Link href="/metas" className="text-orange-500 font-bold underline">metas</Link> y dale con todo 💪
</p>
</div>

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

{/* Ranking semanal */}
{ranking.length > 0 && (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
    <h3 className="font-bold text-gray-800 mb-4">🏆 Ranking esta semana</h3>
    <div className="space-y-3">
      {ranking.map((r, i) => (
        <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-xl ${r.esYo ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-gray-400 w-6">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <span className={`text-sm font-bold ${r.esYo ? 'text-orange-600' : 'text-gray-700'}`}>
              {r.esYo ? 'Tú' : r.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-orange-500 font-black">{r.dias}</span>
            <span className="text-xs text-gray-400">días</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        <BottomNav active="dashboard" />
      </div>
    </main>
  )
}