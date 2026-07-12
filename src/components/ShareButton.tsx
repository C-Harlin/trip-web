import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
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
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/90 hover:bg-card border border-[#D6E4EA] text-sm font-medium text-slate-700 shadow-sm transition-all cursor-pointer"
    >
      {copied ? (
        <>
          <Check size={16} />
          <span>链接已复制</span>
        </>
      ) : (
        <>
          <Share2 size={16} />
          <span>分享行程</span>
        </>
      )}
    </button>
  )
}
