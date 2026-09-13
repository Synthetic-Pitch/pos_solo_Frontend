
import { z } from 'zod'
import { readCookie } from './reconciliation'

// A same-origin proxy keeps the HTTP-only session cookie out of JavaScript
// while still allowing the browser to send it to the Supabase function.
const orderVerificationEndpoint = '/api/content-verification-order'
const addOrderEndpoint = '/api/add-order'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const orderVerificationSchema = z.object({
  valid: z.boolean().optional(),
  message: z.string().optional(),
})

export type OrderAccessVerification =
  | { valid: true }
  | { valid: false; message: string }

const checkoutOrderSchema = z.object({
  flavor: z.string().trim().min(1).max(100),
  size: z.string().trim().min(1).max(50),
  payment_method: z.literal('gcash').optional(),
})

const checkoutInputSchema = z.object({
  orders: z.array(checkoutOrderSchema).min(1, 'Add at least one order before checkout.').max(1_000),
})

const errorResponseSchema = z.object({ message: z.string() })

export type CheckoutOrder = z.infer<typeof checkoutOrderSchema>

/** Checks whether the current session may access the order page. */
export async function verifyOrderAccess(): Promise<OrderAccessVerification> {
  if (!publishableKey) {
    return { valid: false, message: 'Order verification is unavailable. Please sign in again.' }
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    return { valid: false, message: 'Your session has expired. Please sign in again.' }
  }

  try {
    const response = await fetch(orderVerificationEndpoint, {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
    })
    const body: unknown = await response.json().catch(() => null)
    const result = orderVerificationSchema.safeParse(body)

    if (response.ok && result.success && result.data.valid === true) {
      return { valid: true }
    }

    return {
      valid: false,
      message: result.success && result.data.message
        ? result.data.message
        : 'Unable to verify your session. Please sign in again.',
    }
  } catch {
    return { valid: false, message: 'Unable to verify your session. Please sign in again.' }
  }
}

/** Submits the cashier's current order list without exposing the session cookie. */
export async function submitOrders(orders: CheckoutOrder[]): Promise<void> {
  const input = checkoutInputSchema.parse({ orders })

  if (!publishableKey) {
    throw new Error('Checkout is unavailable because its environment configuration is missing.')
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const response = await fetch(addOrderEndpoint, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null)
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Checkout failed (${response.status}).`)
  }
}
