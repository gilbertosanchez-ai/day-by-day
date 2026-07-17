'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function RegistroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
const refUsername = searchParams.get('ref')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleRegistro = async () => {
    if (!name || !email || !password) return setError('Llena todos los campos')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

     if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        coins: 0
      })

      // Si vino con link de referido, dar +50 🪙 al que invitó
      if (refUsername) {
        const { data: referidor } = await supabase
          .from('profiles')
          .select('id, coins')
          .eq('username', refUsername)
          .single()

        if (referidor) {
          await supabase
            .from('profiles')
            .update({ coins: referidor.coins + 50 })
            .eq('id', referidor.id)
        }
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Revisa tu email!</h1>
          <p className="text-gray-500 mb-6">Te enviamos un enlace de confirmación a <strong>{email}</strong></p>
          <Link href="/login" className="w-full block bg-orange-500 text-white rounded-lg py-3 font-semibold hover:bg-orange-600 text-center">
            Ir al Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-2xl font-bold text-gray-800">Day by Day</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu cuenta y empieza hoy</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-gray-800"
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 text-gray-800"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 text-gray-800"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleRegistro}
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-lg py-3 font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta 🔥'}
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-orange-500 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}