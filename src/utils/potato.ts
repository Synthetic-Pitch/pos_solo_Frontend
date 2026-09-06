import { z } from 'zod'
import { getApiDate } from './api-date'
import { readCookie } from './reconciliation'

// This route is proxied locally and rewritten in production so the browser can
// send the HTTP-only session cookie without exposing it to JavaScript.
const addPotatoEndpoint = '/api/add-potato'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const addPotatoInputSchema = z.object({
  kilo: z.number().finite().positive('Enter a potato amount greater than zero.').max(1_000_000),
})

const errorResponseSchema = z.object({ message: z.string() })

const addPotatoResponseSchema = z.object({
  message: z.string(),
  data: z.object({}).passthrough(),
})

export type AddPotatoInput = z.infer<typeof addPotatoInputSchema>
export type AddPotatoResponse = z.infer<typeof addPotatoResponseSchema>

/** Adds potatoes for today. The date is generated here, not accepted from UI. */
export async function addPotatoes(input: AddPotatoInput): Promise<AddPotatoResponse> {
  const validInput = addPotatoInputSchema.parse(input)

  if (!publishableKey) {
    throw new Error('Adding potatoes is unavailable because its environment configuration is missing.')
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
    body: JSON.stringify({ date: getApiDate(), kilo: validInput.kilo }),
  })

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const apiError = errorResponseSchema.safeParse(responseBody)
    throw new Error(apiError.success ? apiError.data.message : `Unable to add potatoes (${response.status}).`)
  }

  const result = addPotatoResponseSchema.safeParse(responseBody)
  if (!result.success) {
    throw new Error('Potatoes were added, but the server returned an invalid response.')
  }

  return result.data
}
