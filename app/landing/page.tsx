'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex flex-col">
      
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🔥</span>
          <span className="font-bold text-2xl text-gray-800">Day by Day</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
            Empezar gratis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-orange-100 text-orange-600 text-sm font-medium px-4 py-2 rounded-full mb-6">
              🔥 Construye hábitos que duran
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Un día a la vez,<br />
              <span className="text-orange-500">cambia tu vida</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10">
              Define tus metas, mantén tu racha diaria y gana recompensas reales por tu esfuerzo.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/registro" className="bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors">
                Comenzar ahora →
              </Link>
              <Link href="#como-funciona" className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors">
                Ver más
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-3 gap-6 mt-16"
          >
            {[
              { number: '🔥', label: 'Rachas diarias' },
              { number: '🏆', label: 'Recompensas reales' },
              { number: '📊', label: 'Estadísticas' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl mb-2">{stat.number}</div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

    </main>
  )
}