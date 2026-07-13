import { useState } from 'react'
import { Check, Cloud, Crown, LogOut, RotateCw, Trash2, UserPlus, Users, X } from 'lucide-react'
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

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

export function CollaborationButton({ collaboration }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const openPanel = () => {
    setOpen(true)
    setMessage(null)
    void collaboration.refreshCollaboration()
  }

  const sendLink = async () => {
    if (!email.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await collaboration.requestMagicLink(email.trim())
      setMessage('所有者登录链接已发送，请在当前设备打开最新邮件。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发送失败')
    } finally {
      setBusy(false)
    }
  }

  const createInvite = async () => {
    if (!inviteName.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const inviteUrl = await collaboration.createInvite(inviteName.trim())
      await navigator.clipboard.writeText(inviteUrl)
      setInviteName('')
      setCopied(true)
      setMessage('一次性邀请链接已复制，有效期 7 天。')
      window.setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '创建邀请失败')
    } finally {
      setBusy(false)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    setBusy(true)
    try {
      await collaboration.revokeInvite(inviteId)
      setMessage('邀请已撤销。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '撤销失败')
    } finally {
      setBusy(false)
    }
  }

  const removeMember = async (userId: string) => {
    setBusy(true)
    try {
      await collaboration.removeMember(userId)
      setMessage('成员已移除。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '移除失败')
    } finally {
      setBusy(false)
    }
  }

  const cloudActive = Boolean(collaboration.tripId)
  const isOwner = collaboration.role === 'owner'

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="flex items-center gap-2 rounded-lg border border-[#D6E4EA] bg-card/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-card"
      >
        <Users size={16} />
        <span className="hidden sm:inline">协作</span>
        {cloudActive && (
          <span className={`h-2 w-2 rounded-full ${collaboration.status === 'conflict' || collaboration.status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-900/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-5">
          <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-lg border border-[#D6E4EA] bg-card p-5 shadow-2xl sm:max-w-md sm:rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-slate-900"><Users size={18} />协作成员</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">受邀朋友可以共同编辑这份行程。</p>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>

            {!collaboration.configured ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">需要连接 Supabase</div>
                <p className="mt-1 text-xs leading-relaxed">填写环境变量并执行最新的 `supabase/schema.sql` 后即可启用。</p>
              </div>
            ) : cloudActive && collaboration.status !== 'sign-in' ? (
              <div className="mt-5 space-y-5">
                <div className="flex items-center gap-3 rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] p-3">
                  <Cloud size={20} className="text-blue-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{STATUS_LABELS[collaboration.status]}</div>
                    <div className="truncate text-xs text-slate-500">{collaboration.isAnonymous ? '访客会话' : collaboration.userEmail}</div>
                  </div>
                  <button type="button" aria-label="刷新成员" onClick={() => void collaboration.refreshCollaboration()} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-white"><RotateCw size={15} /></button>
                </div>

                {isOwner && (
                  <section>
                    <div className="mb-2 text-xs font-semibold uppercase text-slate-400">邀请朋友</div>
                    <div className="flex gap-2">
                      <input
                        value={inviteName}
                        onChange={event => setInviteName(event.target.value)}
                        onKeyDown={event => { if (event.key === 'Enter') void createInvite() }}
                        placeholder="朋友的名字"
                        className="input min-w-0 flex-1"
                      />
                      <button type="button" title="创建并复制邀请链接" disabled={busy || !inviteName.trim()} onClick={() => void createInvite()} className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-600 text-white disabled:opacity-50">
                        {copied ? <Check size={17} /> : <UserPlus size={17} />}
                      </button>
                    </div>
                  </section>
                )}

                <section>
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-400">成员</div>
                  <div className="divide-y divide-[#D6E4EA] rounded-lg border border-[#D6E4EA]">
                    {collaboration.members.map(member => (
                      <div key={member.user_id} className="flex items-center gap-3 px-3 py-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#E7EFF3] text-xs font-bold text-slate-600">
                          {member.role === 'owner' ? <Crown size={15} /> : (member.display_name?.slice(0, 1) ?? '友')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-800">{member.role === 'owner' ? '行程所有者' : member.display_name ?? '旅行伙伴'}</div>
                          <div className="text-[11px] text-slate-400">{member.role === 'owner' ? '管理成员与行程' : '可以编辑行程'}</div>
                        </div>
                        {isOwner && member.role !== 'owner' && (
                          <button type="button" title="移除成员" disabled={busy} onClick={() => void removeMember(member.user_id)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {isOwner && collaboration.invites.length > 0 && (
                  <section>
                    <div className="mb-2 text-xs font-semibold uppercase text-slate-400">等待加入</div>
                    <div className="divide-y divide-[#D6E4EA] rounded-lg border border-[#D6E4EA]">
                      {collaboration.invites.map(invite => (
                        <div key={invite.id} className="flex items-center gap-3 px-3 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-800">{invite.label}</div>
                            <div className="text-[11px] text-slate-400">{formatExpiry(invite.expires_at)} 前有效</div>
                          </div>
                          <button type="button" title="撤销邀请" disabled={busy} onClick={() => void revokeInvite(invite.id)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={15} /></button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {(message || collaboration.error) && <p className={`text-center text-xs ${collaboration.error ? 'text-rose-600' : 'text-slate-500'}`}>{collaboration.error ?? message}</p>}
                <button type="button" onClick={() => void collaboration.leaveCloudTrip()} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-900"><LogOut size={14} />退出此设备</button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-[#D6E4EA] bg-[#EEF5F8] p-4">
                  <div className="text-sm font-semibold text-slate-800">所有者登录</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">登录后系统会自动创建或恢复共享行程。朋友无需在这里登录，应直接打开你发送的邀请链接。</p>
                </div>
                <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="你的邮箱" className="input" />
                <button type="button" disabled={busy || !email.trim()} onClick={() => void sendLink()} className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">发送所有者登录链接</button>
                {(message || collaboration.error) && <p className={`text-center text-xs ${collaboration.error ? 'text-rose-600' : 'text-slate-500'}`}>{collaboration.error ?? message}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
