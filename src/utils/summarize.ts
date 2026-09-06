import { z } from 'zod'
import { readCookie } from './reconciliation'

const summarizeEndpoint = '/api/summarize'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const wholeNumber = z.number().int().min(0).max(1_000_000)
const potatoesNumber = z.number().min(0).max(1_000_000)

export const summarizeInputSchema = z.object({
  closingSmallCups: wholeNumber,
  closingMediumCups: wholeNumber,
  closingLargeCups: wholeNumber,
  closingPotatoes: potatoesNumber,
})

// Form values remain strings until validation. This prevents JavaScript from
// coercing malformed values (for example, an empty string) into a valid zero.
export const summarizeFormSchema = z.object({
  smallCups: z.string().regex(/^\d+$/, 'Enter digits only.').transform(Number).pipe(wholeNumber),
  mediumCups: z.string().regex(/^\d+$/, 'Enter digits only.').transform(Number).pipe(wholeNumber),
  largeCups: z.string().regex(/^\d+$/, 'Enter digits only.').transform(Number).pipe(wholeNumber),
  potatoes: z.string().regex(/^\d+(?:\.\d)?$/, 'Enter kilos with at most one decimal place.').transform(Number).pipe(potatoesNumber),
})

const errorResponseSchema = z.object({ message: z.string() })
const summarizeResponseSchema = z.object({ message: z.string().optional() }).passthrough()

export type SummarizeInput = z.infer<typeof summarizeInputSchema>
export type SummarizeResponse = z.infer<typeof summarizeResponseSchema>

/** Sends the cashier's validated closing inventory using the current session. */
export async function submitSummary(input: SummarizeInput): Promise<SummarizeResponse> {
  const validInput = summarizeInputSchema.parse(input)

  if (!publishableKey) {
    throw new Error('Summarizing is unavailable because its environment configuration is missing.')
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
      closing_small_cups: validInput.closingSmallCups,
      closing_medium_cups: validInput.closingMediumCups,
      closing_large_cups: validInput.closingLargeCups,
      closing_potatoes: validInput.closingPotatoes,
    }),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Unable to summarize (${response.status}).`)
  }

  const result = summarizeResponseSchema.safeParse(responseBody)
  if (!result.success) {
    throw new Error('Summary was submitted, but the server returned an invalid response.')
  }

  return result.data
}
