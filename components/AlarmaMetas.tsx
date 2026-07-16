'use client'
import { useEffect } from 'react'

interface Goal { id: string; title: string; reminder_time: string | null; reminder_enabled: boolean }

export default function AlarmaMetas({ goals }: { goals: Goal[] }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const check = () => {
      const ahora = new Date()
      const minsAhora = ahora.getHours() * 60 + ahora.getMinutes()
      const hoy = ahora.toDateString()

      goals.forEach(g => {
        if (!g.reminder_enabled || !g.reminder_time) return
        const [h, m] = g.reminder_time.split(':').map(Number)
        let minsAlarma = h * 60 + m - 5 // 5 min antes
        if (minsAlarma < 0) minsAlarma += 1440

        const diff = minsAlarma - minsAhora
        if (diff === 0) {
          const key = `alarma_${g.id}_${hoy}`
          if (localStorage.getItem(key)) return
          if (Notification.permission === 'granted') {
            new Notification(`🔥 En 5 min: ${g.title}`, {
              body: 'Prepárate, es hora de no rendirte.',
              icon: '/logo.png'
            })
            localStorage.setItem(key, '1')
          }
        }
      })
    }

    const interval = setInterval(check, 60000) // revisa cada minuto
    check() // primera vez al entrar
    return () => clearInterval(interval)
  }, [goals])

  return null
}
