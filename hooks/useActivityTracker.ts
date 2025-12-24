import { useEffect, useRef } from 'react'

interface ActivityTrackerOptions {
  userId?: string
  interval?: number // in milliseconds, default 30 seconds
  enabled?: boolean
}

export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const { userId, interval = 30000, enabled = true } = options
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled || !userId) return

    const trackActivity = async (activityType?: string) => {
      try {
        await fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'anonymous'}`,
            'User-ID': userId
          },
          body: JSON.stringify({
            userId,
            activity: activityType || 'heartbeat'
          })
        })
      } catch (error) {
        console.error('Failed to track activity:', error)
      }
    }

    // Track initial activity
    trackActivity('page_load')

    // Set up interval for heartbeat
    intervalRef.current = setInterval(() => {
      trackActivity('heartbeat')
    }, interval)

    // Track user interactions
    const handleUserActivity = () => {
      trackActivity('user_interaction')
    }

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackActivity('page_hidden')
      } else {
        trackActivity('page_visible')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Track before unload (when user leaves)
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable delivery during page unload
      const data = JSON.stringify({
        userId,
        activity: 'page_unload'
      })
      navigator.sendBeacon('/api/user/activity', data)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Track when component unmounts
      trackActivity('component_unmount')
    }
  }, [userId, interval, enabled])

  // Function to manually track custom activities
  const trackCustomActivity = async (activityType: string) => {
    if (!enabled || !userId) return
    
    try {
      await fetch('/api/user/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'anonymous'}`,
          'User-ID': userId
        },
        body: JSON.stringify({
          userId,
          activity: activityType
        })
      })
    } catch (error) {
      console.error('Failed to track custom activity:', error)
    }
  }

  return { trackCustomActivity }
}
