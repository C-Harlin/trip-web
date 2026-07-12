import { useEffect, useState } from 'react'

export function OfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (online) return null

  return (
    <div role="status" className="fixed left-1/2 top-3 z-[70] -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-lg">
      当前离线，显示已缓存的行程与凭证
    </div>
  )
}
