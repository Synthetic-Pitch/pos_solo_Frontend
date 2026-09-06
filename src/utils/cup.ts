import { z } from 'zod'
import { getApiDate } from './api-date'
import { readCookie } from './reconciliation'

const addCupEndpoint = '/api/add-cup'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const addCupInputSchema = z.object({
  quantity: z.number().int('Enter a whole number of cups.').positive('Enter at least one cup.').max(1_000_000),
  cupSize: z.enum(['small', 'medium', 'large']),
})

// Keep the UI value as text until validation so values such as `2.5`, `2e3`,
// signs, and other non-digit characters cannot be coerced into valid numbers.
export const cupQuantitySchema = z
  .string()
  .regex(/^\d+$/, 'Enter whole numbers only.')
  .transform(Number)
  .pipe(addCupInputSchema.shape.quantity)

const errorResponseSchema = z.object({ message: z.string() })
const addCupResponseSchema = z.object({
  message: z.string(),
  data: z.object({}).passthrough(),
})

export type AddCupInput = z.infer<typeof addCupInputSchema>
export type AddCupResponse = z.infer<typeof addCupResponseSchema>

/** Adds cups for today. The date is generated in code, not accepted from UI. */
export async function addCups(input: AddCupInput): Promise<AddCupResponse> {
  const validInput = addCupInputSchema.parse(input)

  if (!publishableKey) {
    throw new Error('Adding cups is unavailable because its environment configuration is missing.')
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const response = await fetch(addCupEndpoint, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({
      date: getApiDate(),
      quantity: validInput.quantity,
      cup_size: validInput.cupSize,
    }),
  })

  const responseBody: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Unable to add cups (${response.status}).`)
  }

  const result = addCupResponseSchema.safeParse(responseBody)
  if (!result.success) {
    throw new Error('Cups were added, but the server returned an invalid response.')
  }

  return result.data
}
