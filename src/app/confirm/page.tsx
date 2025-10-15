'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToastContext } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

export default function ConfirmPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { confirmSignup, resendCode } = useAuth()
  const { success, error } = useToastContext()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const e = sp.get('email')
    if (e) setEmail(e)
  }, [sp])

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    try {
      await confirmSignup(email, code)
      success('Verified', 'Your email has been confirmed. Please sign in.')
      router.push('/login')
    } catch (err: any) {
      error('Verification failed', err?.message ?? 'Please try again')
    }
  }

  async function onResend() {
    try {
      setSending(true)
      await resendCode(email)
      success('Code sent', 'We re-sent a verification code to your email.')
    } catch (err: any) {
      error('Failed to resend', err?.message ?? 'Please try again later')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="max-w-md mx-auto py-14 text-white">
      <h1 className="text-2xl font-semibold mb-6">Verify your email</h1>
      <form onSubmit={onConfirm} className="space-y-4">
        <input className="w-full px-3 py-2 rounded bg-gray-800" placeholder="Email"
               type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full px-3 py-2 rounded bg-gray-800" placeholder="6-digit code"
               value={code} onChange={e=>setCode(e.target.value)} required />
        <button className="w-full bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded font-medium">
          Confirm
        </button>
      </form>
      <button onClick={onResend} disabled={sending}
              className="mt-4 text-sm text-orange-400 hover:text-orange-300 underline disabled:opacity-60">
        {sending ? 'Resending...' : 'Resend code'}
      </button>
    </main>
  )
}
