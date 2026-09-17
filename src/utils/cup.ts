import { z } from 'zod'
import { readCookie } from './reconciliation'

// Kept same-origin through the development proxy and production rewrite so
// the browser can send its HTTP-only session cookie without a CORS request.
const addCupEndpoint = '/api/add-cup'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const cupSizes = ['small', 'medium', 'large'] as const

export const addCupInputSchema = z.object({
  quantity: z.number().int().positive('Enter at least one cup.').max(1_000_000, 'The quantity is too large.'),
  cupSize: z.enum(cupSizes),
})

export type AddCupInput = z.infer<typeof addCupInputSchema>

const errorResponseSchema = z.object({ message: z.string() })

function getLocalToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatApiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day}-${month}-${String(year).slice(-2)}`
}

/** Adds cups using today's local JavaScript calendar date. */
export async function addCups(input: AddCupInput): Promise<void> {
  const validatedInput = addCupInputSchema.parse(input)

  if (!publishableKey) {
    throw new Error('Cup entry is unavailable because its environment configuration is missing.')
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
      quantity: validatedInput.quantity,
      cup_size: validatedInput.cupSize,
      date: formatApiDate(getLocalToday()),
    }),
  })

  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null)
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Unable to add cups (${response.status}).`)
  }
}
