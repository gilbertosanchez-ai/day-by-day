'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const categorias = [
  { id: 'salud', emoji: '💪', label: 'Salud y ejercicio' },
  { id: 'espiritualidad', emoji: '🙏', label: 'Espiritualidad' },
  { id: 'estudio', emoji: '📚', label: 'Estudio' },
  { id: 'negocio', emoji: '💼', label: 'Negocio' },
  { id: 'ahorro', emoji: '💰', label: 'Ahorro' },
  { id: 'habito', emoji: '✅', label: 'Hábito' },
  { id: 'general', emoji: '🎯', label: 'General' },
]

const diasSemana = [
  { id: 'lunes', label: 'L' }, { id: 'martes', label: 'M' }, { id: 'miercoles', label: 'X' },
  { id: 'jueves', label: 'J' }, { id: 'viernes', label: 'V' }, { id: 'sabado', label: 'S' }, { id: 'domingo', label: 'D' },
]

export default function NuevaMetaPage() {
  const [title, setTitle] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('general')
  const [frequency, setFrequency] = useState('daily')
  const [frequencyDays, setFrequencyDays] = useState<string[]>([])
  const [hora, setHora] = useState('07:00')
  const [conAlarma, setConAlarma] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const toggleDay = (day: string) => setFrequencyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

  const handleCreate = async () => {
    if (!title) return alert('Escribe el nombre de tu meta')
    if (frequency === 'custom' && frequencyDays.length === 0) return alert('Selecciona al menos un día')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const { count } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active')
    const limites: Record<string, number> = { free: 1, light: 3, pro: 999 }
    const limite = limites[profile?.plan || 'free']
    if ((count || 0) >= limite) {
      alert(profile?.plan==='free'?'El plan Free solo permite 1 meta. Suscríbete a Light o Pro para tener más.':'El plan Light permite hasta 3 metas. Suscríbete a Pro.')
      setLoading(false); return
    }
        // INSERT CORRECTO CON ALARMA 5 MIN ANTES
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      title,
      reason,
      category,
      frequency,
      frequency_days: frequency === 'custom' ? frequencyDays : [],
      reminder_time: conAlarma ? hora : null,
      reminder_enabled: conAlarma,
      current_streak: 0,
      longest_streak: 0,
      total_days: 0
    })

    if (error) { console.log(error); alert('Error al crear la meta'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 text-2xl">←</button>
          <h1 className="text-2xl font-bold text-gray-800">Nueva meta</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Categoría</label>
            <div className="grid grid-cols-3 gap-3">
              {categorias.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} className={`p-3 rounded-xl border-2 text-center ${category===cat.id?'border-orange-500 bg-orange-50':'border-gray-100'}`}>
                  <div className="text-2xl mb-1">{cat.emoji}</div><p className="text-xs font-medium text-gray-600">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuál es tu meta? 🎯</label>
            <input className="w-full border rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Ej: Ir al gimnasio" value={title} onChange={e=>setTitle(e.target.value)}/>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">¿Por qué? 💭</label>
            <textarea className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" rows={3} placeholder="Esta razón te motivará..." value={reason} onChange={e=>setReason(e.target.value)}/>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">¿Con qué frecuencia? 📅</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{id:'daily',emoji:'📆',label:'Todos los días'},{id:'weekly',emoji:'📅',label:'Una vez por semana'},{id:'custom',emoji:'✏',label:'Días específicos'}].map(f=>(
                <button key={f.id} onClick={()=>setFrequency(f.id)} className={`p-3 rounded-xl border-2 text-center ${frequency===f.id?'border-orange-500 bg-orange-50':'border-gray-100'}`}><div className="text-2xl mb-1">{f.emoji}</div><p className="text-xs font-medium">{f.label}</p></button>
              ))}
            </div>
            {frequency==='custom' && <div className="flex gap-2 justify-center">{diasSemana.map(d=> <button key={d.id} onClick={()=>toggleDay(d.id)} className={`w-10 h-10 rounded-full font-bold text-sm ${frequencyDays.includes(d.id)?'bg-orange-500 text-white':'bg-gray-100 text-gray-500'}`}>{d.label}</button>)}</div>}
          </div>

          {/* ALARMA 5 MIN ANTES - NUEVO BLOQUE */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div><p className="font-bold text-sm text-gray-800">⏰ Alarma 5 min antes</p><p className="text-xs text-gray-500">Te avisamos para que te prepares</p></div>
              <button type="button" onClick={()=>setConAlarma(!conAlarma)} className={`w-12 h-6 rounded-full transition ${conAlarma?'bg-orange-500':'bg-gray-300'}`}><div className={`w-5 h-5 bg-white rounded-full transition ${conAlarma?'translate-x-6':'translate-x-1'} mt-0.5`}/></button>
            </div>
            {conAlarma && <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300"/>}
          </div>

          <button onClick={handleCreate} disabled={loading} className="w-full bg-orange-500 text-white rounded-xl py-4 font-semibold text-lg hover:bg-orange-600 disabled:opacity-50">{loading?'Creando...':'🔥 Crear meta'}</button>
        </div>
      </div>
    </main>
  )
}