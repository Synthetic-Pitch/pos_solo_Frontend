import { z } from 'zod'
import { queryClient } from '../lib/query-client'
import { useBranchStore } from '../stores/use-branch-store'
import { useLoginStore } from '../stores/use-login-store'
import { useOrderStore } from '../stores/use-order-store'
import { useSummaryStore } from '../stores/use-summary-store'
import { readCookie } from './reconciliation'

// A same-origin proxy keeps the HTTP-only session cookie out of JavaScript
// while still allowing the browser to send it to the Supabase function.
const revenueVerificationEndpoint = '/api/content-verification-revenue'
const archiveEndpoint = '/api/archive'
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

const errorResponseSchema = z.object({ message: z.string() })
const archiveResponseSchema = z.object({
  message: z.string().optional(),
})

export type ArchiveResponse = z.infer<typeof archiveResponseSchema>

/** Clears persisted POS state after a successful archive. */
export function resetPersistedClientState() {
  useLoginStore.getState().clearLoginResponse()
  useSummaryStore.getState().clearReceipt()
  useOrderStore.setState({
    orders: [],
    isGcashPayment: false,
    selectedFlavorBySize: {},
    salesCount: null,
  })
  useBranchStore.setState({ count: 1 })
  document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  queryClient.clear()
}

/** Archives the current day using the HTTP-only session cookie. */
export async function archiveSession(): Promise<ArchiveResponse> {
  if (!publishableKey) {
    throw new Error('Archive is unavailable because its environment configuration is missing.')
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const response = await fetch(archiveEndpoint, {
    method: 'GET',
    headers: {
      apikey: publishableKey,
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
  })

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Archive failed (${response.status}).`)
  }

  const parsed = archiveResponseSchema.safeParse(responseBody)
  return parsed.success ? parsed.data : {}
}
