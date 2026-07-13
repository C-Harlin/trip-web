import { useState } from 'react'
import { Check, Cloud, Copy, LogOut, Users, X } from 'lucide-react'
import type { CollaborationController } from '../hooks/useEditableItinerary'

interface Props {
  collaboration: CollaborationController
}

const STATUS_LABELS = {
  local: '本地模式',
  'sign-in': '等待登录',
  loading: '正在加载',
  synced: '已同步',
  saving: '正在保存',
  conflict: '存在冲突',
  error: '同步异常',
}

export function CollaborationButton({ collaboration }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const sendLink = async () => {
    if (!email.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await collaboration.requestMagicLink(email.trim())
      setMessage('登录链接已发送，请检查邮箱。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发送失败')
    } finally {
      setBusy(false)
    }
  }

  const createTrip = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const tripId = await collaboration.createSharedTrip()
      if (!tripId) setMessage('请先通过邮箱登录。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建失败')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const cloudActive = Boolean(collaboration.tripId)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-[#D6E4EA] bg-card/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-card"
      >
        <Users size={16} />
        <span className="hidden sm:inline">协作</span>
        {cloudActive && <span className={`h-2 w-2 rounded-full ${collaboration.status === 'conflict' || collaboration.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-900/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-5">
          <div className="w-full rounded-t-lg border border-[#D6E4EA] bg-card p-5 shadow-2xl sm:max-w-md sm:rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-slate-900"><Users size={18} />多人协作</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">邀请成员共同调整行程，修改会自动同步。</p>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>

            {!collaboration.configured ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">需要连接 Supabase</div>
                <p className="mt-1 text-xs leading-relaxed">在 `.env.local` 填写项目 URL 和 anon key，并执行 `supabase/schema.sql` 后即可启用。当前行程仍保存在本机。</p>
              </div>
            ) : cloudActive && collaboration.status !== 'sign-in' ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] p-3">
                  <Cloud size={20} className="text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{STATUS_LABELS[collaboration.status]}</div>
                    <div className="truncate text-xs text-slate-500">{collaboration.userEmail ?? '协作行程'}</div>
                  </div>
                </div>
                <button type="button" onClick={copyLink} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                  {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? '链接已复制' : '复制邀请链接'}
                </button>
                <button type="button" onClick={() => void collaboration.leaveCloudTrip()} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-900"><LogOut size={14} />退出登录</button>
                {collaboration.error && <p className="text-xs text-rose-600">{collaboration.error}</p>}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {!cloudActive && (
                  <button type="button" disabled={busy} onClick={createTrip} className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">创建共享行程</button>
                )}
                <div className="flex items-center gap-2"><span className="h-px flex-1 bg-[#D6E4EA]" /><span className="text-[11px] text-slate-400">邮箱登录</span><span className="h-px flex-1 bg-[#D6E4EA]" /></div>
                <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" className="input" />
                <button type="button" disabled={busy || !email.trim()} onClick={sendLink} className="w-full rounded-lg border border-[#CADAE2] bg-[#EEF5F8] px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">发送登录链接</button>
                {(message || collaboration.magicLinkSent) && <p className="text-center text-xs text-slate-500">{message ?? '登录链接已发送，请检查邮箱。'}</p>}
                {collaboration.error && <p className="text-center text-xs text-rose-600">{collaboration.error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
