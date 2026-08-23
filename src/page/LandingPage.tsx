import { useMutation } from '@tanstack/react-query'
import { CircleMinus, CirclePlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useBranchStore } from '../stores/use-branch-store'
import { useLoginStore } from '../stores/use-login-store'
import { login, loginInputSchema } from '../utils/login'

function LandingPage() {
  const navigate = useNavigate()
  const count = useBranchStore((state) => state.count)
  const increment = useBranchStore((state) => state.increment)
  const decrement = useBranchStore((state) => state.decrement)
  const setLoginResponse = useLoginStore((state) => state.setLoginResponse)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (loginResponse) => {
      setLoginResponse(loginResponse)
      setPassword('')
      toast.success('Login success')
      navigate(loginResponse.isReturning ? '/order' : '/reconciliation', {
        replace: true,
        // The order guard still redirects returning users who need
        // reconciliation, but its message is unnecessary immediately after a
        // successful login.
        state: { fromSuccessfulLogin: true },
      })
    },
    onError: (error) => {
      toast.error(error.message || 'This account is already active on another device. Sign in again from the device that started today\'s session.')
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})
  
    const result = loginInputSchema.safeParse({ username, password, branch: count })
    
    if (!result.success) {
      setFieldErrors(
        result.error.issues.reduce<Record<string, string>>((errors, issue) => {
          const field = issue.path[0]

          if (typeof field === 'string' && !errors[field]) {
            errors[field] = issue.message
          }

          return errors
        }, {}),
      )
      return
    }
  
    loginMutation.mutate(result.data)
  }

  return (
    <main className="h-dvh text-9xl font-geist-mono flex items-center justify-center">
      <section className="box_shadow h-[full] max-h-260 w-[96%] min-[400px]:w-130 px-4 min-[400px]:px-12 flex flex-col justify-center">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col py-30">
          <label htmlFor="username-inpt" className="text-xl min-[400px]:text-2xl font-poppins pb-4 text-gray-700">USERNAME</label>
          <input type="text" id="username-inpt" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength={50} aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'username-error' : undefined} className="w-full outline-none border-b-2 border-black text-2xl" />
          {fieldErrors.username && <p id="username-error" className="mt-2 text-base font-poppins text-red-600">{fieldErrors.username}</p>}
          <div className="mb-16" />
          <label htmlFor="password-inpt" className="text-xl min-[400px]:text-2xl font-poppins pb-4 text-gray-700">PASSWORD</label>
          <input type="password" id="password-inpt" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" maxLength={50} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} className="w-full outline-none border-b-2 border-black text-2xl" />
          {fieldErrors.password && <p id="password-error" className="mt-2 text-base font-poppins text-red-600">{fieldErrors.password}</p>}
          <footer>
            <header className="flex justify-center items-center gap-8 py-8 font-poppins">
              <button type="button" aria-label="Add branch" disabled={count === 10} onClick={increment} className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"><CirclePlus size={40} /></button>
              <span className="text-3xl min-[400px]:text-4xl">branch{count}</span>
              <button type="button" aria-label="Remove branch" disabled={count === 1} onClick={decrement} className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"><CircleMinus size={40} /></button>
            </header>
            <button type="submit" disabled={loginMutation.isPending} className="text-4xl text-[#fe7e32] font-bold flex justify-center w-full font-poppins cursor-pointer disabled:cursor-wait disabled:opacity-60">
              {loginMutation.isPending ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </footer>
        </form>
      </section>
    </main>
  )
}

export default LandingPage
