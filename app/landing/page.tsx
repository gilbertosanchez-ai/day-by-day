'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const pasos = [
  { emoji: '🎯', titulo: 'Define tu meta', desc: 'Escribe lo que quieres lograr y por qué. Esa razón te mantendrá firme.' },
  { emoji: '🔥', titulo: 'Cumple cada día', desc: 'Marca tu progreso diario y mantén tu racha viva. Un día a la vez.' },
  { emoji: '🪙', titulo: 'Gana recompensas', desc: 'Acumula monedas por cada día cumplido y canjéalas por premios reales.' },
]

export default function LandingPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkSession()
  }, [])

  return (
    <main className="min-h-screen overflow-hidden bg-white">

      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src="/logo.png" alt="Day by Day" className="h-10 w-auto" />
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 font-medium">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-medium">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.2, ease: 'easeOut' }} className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
          <motion.div initial={{ x: '100%' }} animate={{ x: '0%' }} transition={{ duration: 1.0, ease: 'easeOut', delay: 0.1 }} className="absolute top-2 left-0 w-full h-1 bg-orange-300" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }} className="absolute bottom-0 left-0 w-full h-2 bg-orange-500" />
          <motion.div initial={{ x: '100%' }} animate={{ x: '0%' }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} className="absolute bottom-2 left-0 w-full h-1 bg-orange-300" />
          <motion.div initial={{ x: '-100%', opacity: 0 }} animate={{ x: '0%', opacity: 0.05 }} transition={{ duration: 1.5, ease: 'easeOut' }} className="absolute -left-20 top-0 w-96 h-full bg-orange-500 transform -skew-x-12" />
          <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: '0%', opacity: 0.03 }} transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }} className="absolute right-0 top-0 w-64 h-full bg-orange-500 transform skew-x-12" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
              🔥 Paso a paso • Cada día
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
              No te rindas.<br />
              <span className="text-orange-500">Hoy es el día.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="text-xl text-gray-500 mb-10 leading-relaxed">
              La app que te acompaña cada día para que no abandones tus metas. Gana recompensas reales por tu esfuerzo.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0 }} className="flex flex-col sm:flex-row gap-4">
              <Link href="/registro" className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors text-center shadow-lg shadow-orange-200">
                Comenzar gratis →
              </Link>
              <Link href="#como-funciona" className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors text-center">
                Ver cómo funciona
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.5, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.0, delay: 0.4, type: 'spring', stiffness: 100 }} className="flex justify-center">
            <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative">
              <div className="absolute inset-0 bg-orange-200 rounded-full blur-3xl opacity-30 scale-110" />
              <Image src="/logo.png" alt="Day by Day" width={400} height={300} className="relative z-10 w-72 lg:w-96" />
            </motion.div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-gray-300 text-3xl">↓</motion.div>
        </motion.div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="py-24 bg-gray-50 relative overflow-hidden">
        <motion.div initial={{ x: '-100%' }} whileInView={{ x: '0%' }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">¿Cómo funciona?</h2>
            <p className="text-xl text-gray-500">Solo 3 pasos para cambiar tu vida</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pasos.map((paso, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.2 }} whileHover={{ y: -8, transition: { duration: 0.2 } }} className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">{paso.emoji}</div>
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-lg mx-auto mb-4">{i + 1}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{paso.titulo}</h3>
                <p className="text-gray-500 leading-relaxed">{paso.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

     {/* Gana dinero real */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Tu esfuerzo vale <span className="text-green-500">dinero real</span> 💰</h2>
            <p className="text-xl text-gray-500">Cumple metas, acumula monedas y retira efectivo a tu cuenta.</p>
          </motion.div>

          {/* Cómo ganar monedas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { emoji: '✅', accion: 'Cumple tu meta diaria', monedas: '+1 🪙' },
              { emoji: '📸', accion: 'Comparte tu logro', monedas: '+1 🪙' },
              { emoji: '🔥', accion: 'Racha de 7 días', monedas: '+10 🪙' },
              { emoji: '👥', accion: 'Invita un amigo', monedas: '+50 🪙' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="bg-orange-50 rounded-2xl p-6 text-center border border-orange-100">
                <div className="text-5xl mb-3">{item.emoji}</div>
                <p className="text-sm font-medium text-gray-600 mb-3">{item.accion}</p>
                <div className="bg-orange-500 text-white font-black px-3 py-1 rounded-full text-sm inline-block">
                  {item.monedas}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Conversión */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-center text-white mb-6">
            <p className="text-lg font-medium text-green-100 mb-2">La conversión es simple</p>
            <p className="text-4xl font-black mb-2">20 🪙 = $1 peso mexicano</p>
            <p className="text-green-200 text-sm">Retira a tu cuenta bancaria cuando acumules $25 pesos mínimo</p>
          </motion.div>

          {/* Próximamente vistas */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              PRÓXIMAMENTE
            </div>
            <div className="text-5xl mb-4">👁️</div>
            <h3 className="text-2xl font-black mb-2">Monetización por vistas</h3>
            <p className="text-purple-200 text-sm max-w-md mx-auto">
              Muy pronto podrás ganar dinero por cada vista en tus videos de progreso — como TikTok pero enfocado en perseverancia y superación personal. Entre más inspires, más ganas.
            </p>
            <div className="flex justify-center gap-6 mt-6">
              {['1K vistas', '10K vistas', '100K vistas'].map((v, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-black text-lg">{'💸'.repeat(i + 1)}</p>
                  <p className="text-purple-200 text-xs mt-1">{v}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* Precios */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <motion.div initial={{ x: '100%' }} whileInView={{ x: '0%' }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Planes simples</h2>
            <p className="text-xl text-gray-500">Empieza gratis. Crece cuando estés listo.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { nombre: 'Free', precio: 0, features: ['1 meta', 'Racha diaria', 'Sin monedas'], popular: false },
              { nombre: 'Light', precio: 49, features: ['3 metas', 'Hasta 6 monedas/día', 'Recompensas'], popular: false, promo: true },
              { nombre: 'Pro', precio: 99, features: ['Metas ilimitadas', 'Hasta 10 monedas/día', 'Recompensas', 'Soporte prioritario'], popular: true },
            ].map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }} whileHover={{ y: -6, transition: { duration: 0.2 } }} className={`bg-white rounded-2xl p-6 border-2 ${plan.popular ? 'border-orange-400 shadow-xl' : 'border-gray-100'}`}>
                {plan.popular && <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">MÁS POPULAR</div>}
                <h3 className="text-xl font-bold text-gray-800 mb-1">{plan.nombre}</h3>
                <div className="mb-4">
  {plan.precio === 0 ? (
    <span className="text-3xl font-black text-gray-800">Gratis</span>
  ) : (plan as any).promo ? (
    <div>
      <span className="text-sm line-through text-gray-400">${plan.precio} MXN/mes</span>
      <p className="text-2xl font-black text-green-600">¡Gratis!</p>
      <p className="text-xs text-green-500 font-medium">primeros 12 meses 🎁</p>
    </div>
  ) : (
    <div>
      <span className="text-3xl font-black text-gray-800">${plan.precio}</span>
      <span className="text-gray-400 text-sm"> MXN/mes</span>
    </div>
  )}
</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm text-gray-600"><span className="text-orange-500">✓</span> {f}</li>)}
                </ul>
                <Link href="/registro" className={`w-full block py-3 rounded-xl font-semibold text-center transition-colors ${plan.popular ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {plan.precio === 0 ? 'Empezar gratis' : (plan as any).promo ? 'Activar gratis por 12 meses' : `Elegir ${plan.nombre}`}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-orange-500 relative overflow-hidden">
        <motion.div initial={{ x: '-100%', opacity: 0 }} whileInView={{ x: '0%', opacity: 0.1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400" />
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="text-6xl mb-6">🔥</div>
          <h2 className="text-4xl font-black text-white mb-6">¿Listo para no rendirte?</h2>
          <p className="text-xl text-orange-100 mb-10">Únete a quienes ya están construyendo sus mejores hábitos, un día a la vez.</p>
          <Link href="/registro" className="bg-white text-orange-500 px-10 py-4 rounded-xl font-black text-xl hover:bg-orange-50 transition-colors shadow-xl">
            Comenzar gratis hoy →
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/logo.png" alt="Day by Day" className="h-10 w-auto" />
          <p className="text-gray-500 text-sm">© 2026 Day by Day · Paso a paso, cada día</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/login" className="hover:text-white">Iniciar sesión</Link>
            <Link href="/registro" className="hover:text-white">Registrarse</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}