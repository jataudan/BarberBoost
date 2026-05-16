import { XCircle } from 'lucide-react'

export default function AccountDisabledPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold mb-3">Account Disabled</h1>
        <p className="text-white/50 leading-relaxed mb-8">
          Your BarberBoost account has been permanently disabled. This is typically the result of
          a serious violation of our terms of service.
        </p>
        <p className="text-white/50 leading-relaxed mb-8">
          If you believe this is an error, please contact us immediately.
        </p>

        <a
          href="mailto:support@barberboost.app?subject=Account Disabled - Appeal"
          className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
        >
          Appeal This Decision
        </a>
      </div>
    </div>
  )
}
