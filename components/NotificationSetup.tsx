'use client'
import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function NotificationSetup() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const setupNotifications = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            subscription: subscription.toJSON()
          })
        })
      } catch (err) {
        console.error('Error configurando notificaciones:', err)
      }
    }

    setupNotifications()
  }, [])

  return null
}