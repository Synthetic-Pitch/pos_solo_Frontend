import { z } from 'zod'
import { readCookie } from './reconciliation'

// The same-origin route is proxied by Vite and rewritten by Vercel, preserving
// the HTTP-only session cookie and avoiding direct cross-origin requests.
const summarizeEndpoint = '/api/summarize'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const cupCountSchema = z.number().int().min(0).max(1_000_000)

export const summaryInputSchema = z.object({
  closingSmallCups: cupCountSchema,
  closingMediumCups: cupCountSchema,
  closingLargeCups: cupCountSchema,
  closingPotatoes: z.number().finite().min(0).max(1_000_000),
})

export type SummaryInput = z.infer<typeof summaryInputSchema>

const errorResponseSchema = z.object({ message: z.string() })

/** Sends the cashier's closing inventory to the summary function. */
export async function submitSummary(input: SummaryInput): Promise<unknown> {
  const validatedInput = summaryInputSchema.parse(input)

  if (!publishableKey) {
    throw new Error('Summary is unavailable because its environment configuration is missing.')
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const response = await fetch(summarizeEndpoint, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({
      closing_small_cups: validatedInput.closingSmallCups,
      closing_medium_cups: validatedInput.closingMediumCups,
      closing_large_cups: validatedInput.closingLargeCups,
      closing_potatoes: validatedInput.closingPotatoes,
    }),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Summary failed (${response.status}).`)
  }

  return responseBody
}
