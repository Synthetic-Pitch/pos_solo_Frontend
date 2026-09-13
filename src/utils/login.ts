import { z } from 'zod'

// This is a same-origin proxy route. Vite serves it during development and
// Vercel rewrites it in production, avoiding cross-site cookie/CORS issues.
const loginEndpoint = '/api/login'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const loginInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Username is required.')
    .max(50, 'Username must be 50 characters or fewer.')
    .includes('@', { message: 'Username must include an @ character.' }),
  password: z
    .string()
    .min(1, 'Password is required.')
    .max(50, 'Password must be 50 characters or fewer.'),
  branch: z.number().int().min(1).max(10),
})

export const loginResponseSchema = z.object({
  message: z.string(),
  email: z.string().email(),
  isReturning: z.boolean(),
  role: z.string(),
  stores_default: z.object({
    small_cups: z.number(),
    medium_cups: z.number(),
    large_cups: z.number(),
    opening_cash: z.number(),
    opening_potatoes: z.number(),
    flavors: z.array(z.object({
      flavor: z.string(),
      sourceURL: z.string().url(),
    })),
    sizes_price: z.array(z.object({
      size: z.string(),
      price: z.number(),
    })),
  }),
})

const errorResponseSchema = z.object({ message: z.string() })

export type LoginInput = z.infer<typeof loginInputSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>

export async function login(input: LoginInput): Promise<LoginResponse> {
  if (!publishableKey) {
    throw new Error('Login is unavailable because its environment configuration is missing.')
  }
  
  const response = await fetch(loginEndpoint, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
    },
    // The API identifies branches by names such as "branch1", not their raw
    // numeric suffix. This also matches the label shown in the UI.
    body: JSON.stringify({ ...input, branch: `branch${input.branch}` }),
    // The login function sets and checks session_cookie. `include` allows the
    // browser to store it after the first login and send it on the next one.
    credentials: 'include',
  })
  
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const apiError = errorResponseSchema.safeParse(body)
    throw new Error(apiError.success ? apiError.data.message : `Login failed (${response.status}).`)
  }

  const parsedLoginResponse = loginResponseSchema.safeParse(body)

  if (!parsedLoginResponse.success) {
    throw new Error(
      'This branch has no store defaults configured. Please ask an administrator to set up the branch.'
    )
  }

  const loginResponse = parsedLoginResponse.data

  if (import.meta.env.DEV) {
    console.log('Validated login response:', loginResponse)
  }

  return loginResponse
}
