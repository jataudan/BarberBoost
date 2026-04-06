export type { Database } from './database'
export type { PlanId, StripeCustomer, StripeWebhookEvent } from './stripe'

export interface User {
  id: string
  email: string
  shopId?: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface DateRange {
  from: Date
  to: Date
}
