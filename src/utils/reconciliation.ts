import { z } from 'zod'

// Keep this request same-origin. The development proxy and Vercel rewrite map
// it to the Supabase function while allowing the browser to attach its
// HTTP-only session cookie.
const reconciliationEndpoint = '/api/reconciliation'
// Kept same-origin so custom authentication headers do not trigger a browser
// CORS preflight against the Supabase function.
const contentVerificationEndpoint = '/api/content-verification'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const countSchema = z.number().int().min(0).max(1_000_000)

export const reconciliationInputSchema = z.object({
  smallCups: countSchema,
  mediumCups: countSchema,
  largeCups: countSchema,
  openingCash: countSchema,
  openingPotatoes: countSchema,
  appeal: z.object({
    openingCash: z.boolean(),
    openingPotatoes: z.boolean(),
    date: z.string().date(),
  }).optional(),
})

export type ReconciliationInput = z.infer<typeof reconciliationInputSchema>

const errorResponseSchema = z.object({
  message: z.string(),
})

export function readCookie(name: string): string | null {
  const encodedName = `${encodeURIComponent(name)}=`

  for (const cookie of document.cookie.split(';')) {
    const value = cookie.trim()
    if (!value.startsWith(encodedName)) continue

    try {
      return decodeURIComponent(value.slice(encodedName.length))
    } catch {
      return null
    }
  }

  return null
}

const contentVerificationSchema = z.object({
  valid: z.boolean(),
})

/**
 * Verifies that the browser's session is allowed to view protected content.
 * The session cookie stays HTTP-only; only its matching public CSRF token is
 * read by the client and supplied in the required request header.
 */
export async function verifyContentAccess(): Promise<boolean> {
  if (!publishableKey) return false

  const csrfToken = readCookie('csrf_token');
  if (!csrfToken) return false

  try {
    const response = await fetch(contentVerificationEndpoint, {
      method: 'GET',
      headers: {
        apikey: publishableKey,
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
    })

    if (!response.ok) return false
    
    const result = contentVerificationSchema.safeParse(await response.json())
    return result.success && result.data.valid
  } catch {
    return false
  }
}

function formatAppealDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return `${day}-${month}-${String(year).slice(-2)}`
}

export async function submitReconciliation(input: ReconciliationInput): Promise<void> {
  if (!publishableKey) {
    throw new Error('Reconciliation is unavailable because its environment configuration is missing.')
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const body = {
    small_cups: input.smallCups,
    medium_cups: input.mediumCups,
    large_cups: input.largeCups,
    opening_cash: input.openingCash,
    opening_potatoes: input.openingPotatoes,
    ...(input.appeal && {
      appeal: {
        opening_cash: input.appeal.openingCash,
        opening_potatoes: input.appeal.openingPotatoes,
        // The function expects the compact D-M-YY representation illustrated
        // in its request contract, while the UI keeps an ISO date value.
        date: formatAppealDate(input.appeal.date),
      },
    }),
  }

  const response = await fetch(reconciliationEndpoint, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
      // The CSRF token is intentionally read only from its public cookie;
      // the session cookie remains HTTP-only and is sent by the browser.
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null)
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Reconciliation failed (${response.status}).`)
  }
}
