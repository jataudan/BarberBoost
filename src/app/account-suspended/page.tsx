import Link from 'next/link'
import { PauseCircle } from 'lucide-react'

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-6">
          <PauseCircle className="w-8 h-8 text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold mb-3">Account Suspended</h1>
        <p className="text-white/50 leading-relaxed mb-8">
          Your BarberBoost account has been temporarily suspended. This may be due to an outstanding
          balance, a policy violation, or a security review.
        </p>
        <p className="text-white/50 leading-relaxed mb-8">
          Please contact our support team to resolve this and get your account reactivated.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:support@barberboost.app?subject=Account Suspension - Please Help"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
          >
            Contact Support
          </a>
          <Link
            href="/settings/billing"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Check Billing
          </Link>
        </div>
      </div>
    </div>
  )
}
