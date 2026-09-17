import { z } from 'zod'
import { readCookie } from './reconciliation'

// This same-origin route is proxied by Vite and rewritten by Vercel. It keeps
// the HTTP-only session cookie out of JavaScript and avoids cross-origin CORS.
const addPotatoEndpoint = '/api/add-potato'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const kilogramSchema = z.number().finite().positive('Enter an amount greater than 0 kg.').max(1_000_000, 'The amount is too large.')

export const addPotatoInputSchema = z.object({
  kilo: kilogramSchema,
})

export type AddPotatoInput = z.infer<typeof addPotatoInputSchema>

const errorResponseSchema = z.object({ message: z.string() })

/** Returns today's local calendar date in ISO format. */
export function getLocalToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// The function's documented example uses D-M-YY, while the UI retains the
// unambiguous ISO value until immediately before sending it.
function formatApiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day}-${month}-${String(year).slice(-2)}`
}

/** Adds a potato stock amount using today's local JavaScript calendar date. */
export async function addPotatoes(input: AddPotatoInput): Promise<void> {
  const validatedInput = addPotatoInputSchema.parse(input)
  const currentDate = getLocalToday()

  if (!publishableKey) {
    throw new Error('Potato entry is unavailable because its environment configuration is missing.')
  }

  const csrfToken = readCookie('csrf_token')
  if (!csrfToken) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const response = await fetch(addPotatoEndpoint, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({
      kilo: validatedInput.kilo,
      date: formatApiDate(currentDate),
    }),
  })

  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null)
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Unable to add potatoes (${response.status}).`)
  }
}
