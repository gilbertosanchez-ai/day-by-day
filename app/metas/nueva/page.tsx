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

export default function NuevaMetaPage() {
  const [title, setTitle] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleCreate = async () => {
    if (!title) return alert('Escribe el nombre de tu meta')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title,
        reason,
        category,
        current_streak: 0,
        longest_streak: 0,
        total_days: 0
      })

    if (error) {
      alert('Error al crear la meta')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Nueva meta</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">

          {/* Nombre de la meta */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ¿Cuál es tu meta? 🎯
            </label>
            <input
              className="w-full border rounded-xl px-4 py-3 text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Ej: Ir al gimnasio todos los días"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Razón */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ¿Por qué quieres lograrlo? 💭
            </label>
            <textarea
              className="w-full border rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              placeholder="Esta razón te motivará cuando quieras rendirte..."
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-3">
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${category === cat.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <p className="text-xs font-medium text-gray-600">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-xl py-4 font-semibold text-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Creando...' : '🔥 Crear meta'}
          </button>
        </div>
      </div>
    </main>
  )
}