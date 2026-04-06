export type { PlanId, PlanLimits } from '@/lib/stripe/plans'

export interface StripeCustomer {
  id: string
  email: string
  name: string
  metadata: {
    shopId: string
  }
}

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}
