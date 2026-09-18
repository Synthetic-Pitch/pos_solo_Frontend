import { z } from 'zod'
import { readCookie } from './reconciliation'

// A same-origin proxy keeps the HTTP-only session cookie out of JavaScript
// while still allowing the browser to send it to the Supabase function.
const revenueVerificationEndpoint = '/api/content-verification-revenue'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const revenueVerificationSchema = z.object({
  valid: z.boolean().optional(),
  message: z.string().optional(),
})

export type RevenueAccessVerification =
  | { valid: true }
  | { valid: false; message: string }

/** Checks whether the current session may access the revenue page. */
export async function verifyRevenueAccess(): Promise<RevenueAccessVerification> {
  if (!publishableKey) {
    return { valid: false, message: 'Revenue verification is unavailable. Please sign in again.' }
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    return { valid: false, message: 'Your session has expired. Please sign in again.' }
  }

  try {
    const response = await fetch(revenueVerificationEndpoint, {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
    })
    const body: unknown = await response.json().catch(() => null)
    const result = revenueVerificationSchema.safeParse(body)

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
