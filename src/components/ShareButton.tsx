import { useState } from 'react'
import { buildShareUrl } from '../utils/urlState'

interface Props {
  skipped: Set<string>
}

export function ShareButton({ skipped }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = buildShareUrl(skipped)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-medium transition-all cursor-pointer"
    >
      {copied ? (
        <>
          <span>✓</span>
          <span>链接已复制</span>
        </>
      ) : (
        <>
          <span>🔗</span>
          <span>分享行程</span>
        </>
      )}
    </button>
  )
}
