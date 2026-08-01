import type Stripe from 'stripe'

function scheduleIdOf(schedule: string | Stripe.SubscriptionSchedule | null): string | null {
  if (!schedule) return null
  return typeof schedule === 'string' ? schedule : schedule.id
}

function priceIdOf(price: string | { id: string }): string {
  return typeof price === 'string' ? price : price.id
}

/**
 * Books a price change to take effect at the current subscription's period end,
 * with no immediate proration invoice. Uses a Stripe Subscription Schedule: phase 1
 * mirrors the subscription's current billing cycle unchanged (read live off the
 * subscription itself, not the schedule, so this is safe to call again to replace
 * an already-pending change), phase 2 is the new price with no end date, so the
 * subscription simply keeps renewing at the new price from then on.
 */
export async function scheduleSubscriptionPriceChange(
  stripe: Stripe,
  subscriptionId: string,
  newPriceId: string,
): Promise<Stripe.SubscriptionSchedule> {
  // Cast to `any` for `current_period_start`/`current_period_end` — these are still present
  // at the top level in the pinned API version's actual runtime response (see getStripe()),
  // matching the convention already used for the same fields in the webhook handler and
  // elsewhere in this file's caller, even though the SDK's bundled types no longer declare them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = await stripe.subscriptions.retrieve(subscriptionId) as any
  const currentItem = sub.items.data[0]

  const existingScheduleId = scheduleIdOf(sub.schedule as string | Stripe.SubscriptionSchedule | null)
  const schedule = existingScheduleId
    ? await stripe.subscriptionSchedules.retrieve(existingScheduleId)
    : await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId })

  return stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      {
        items: [{
          price:    priceIdOf(currentItem.price),
          quantity: currentItem.quantity ?? 1,
        }],
        start_date:          sub.current_period_start,
        end_date:            sub.current_period_end,
        proration_behavior:  'none',
      },
      {
        items:              [{ price: newPriceId, quantity: 1 }],
        proration_behavior: 'none',
      },
    ],
  })
}

/** Cancels a pending scheduled plan change, reverting the subscription to normal (unscheduled). */
export async function releaseSubscriptionSchedule(stripe: Stripe, scheduleId: string): Promise<void> {
  await stripe.subscriptionSchedules.release(scheduleId)
}
