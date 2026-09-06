
import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { submitSummary, summarizeFormSchema } from '../utils/summarize'

const VerifySummarize = () => {
  const [potatoes, setPotatoes] = useState('')
  const [smallCups, setSmallCups] = useState('')
  const [mediumCups, setMediumCups] = useState('')
  const [largeCups, setLargeCups] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const summarizeMutation = useMutation({
    mutationFn: submitSummary,
    onSuccess: (response) => {
      console.log('Summarize response:', response)
      setPotatoes('')
      setSmallCups('')
      setMediumCups('')
      setLargeCups('')
      setFieldErrors({})
      toast.success(response.message ?? 'Summary submitted successfully.')
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to submit the summary.')
    },
  })

  const acceptPotatoValue = (value: string) => {
    // Allows whole kilos or exactly one decimal place, for example 5 or 5.5.
    if (/^\d*(?:\.\d?)?$/.test(value)) setPotatoes(value)
  }

  const acceptCupValue = (value: string, setValue: (value: string) => void) => {
    if (/^\d*$/.test(value)) setValue(value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})

    const result = summarizeFormSchema.safeParse({ potatoes, smallCups, mediumCups, largeCups })
    if (!result.success) {
      setFieldErrors(result.error.issues.reduce<Record<string, string>>((errors, issue) => {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field]) errors[field] = issue.message
        return errors
      }, {}))
      return
    }

    summarizeMutation.mutate({
      closingPotatoes: result.data.potatoes,
      closingSmallCups: result.data.smallCups,
      closingMediumCups: result.data.mediumCups,
      closingLargeCups: result.data.largeCups,
    })
  }

  return (
    <main className="min-h-dvh  px-2 font-poppins">
      <section className="mx-auto min-h-dvh w-full px-5 pt-7 flex flex-col items-center">
        <h1 className="text-center text-xl font-bold text-[gray]">verify leftover</h1>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 justify-center py-8 w-full max-w-100">
            <label htmlFor="potatoes" className="text-[gray] select-none">potatoes kilo</label>
            <input type="text" inputMode="decimal" id="potatoes" value={potatoes} onChange={(event) => acceptPotatoValue(event.target.value)} disabled={summarizeMutation.isPending} aria-invalid={Boolean(fieldErrors.potatoes)} aria-describedby={fieldErrors.potatoes ? 'potatoes-error' : undefined} className="placeholder:text-center outline-0 border-b border-[gray] focus:border-[#fe7e32] disabled:opacity-60" />
            {fieldErrors.potatoes && <p id="potatoes-error" className="text-sm text-red-600">{fieldErrors.potatoes}</p>}
            <label htmlFor="small_cups" className="text-[gray] select-none">small cups</label>
            <input type="text" inputMode="numeric" id="small_cups" value={smallCups} onChange={(event) => acceptCupValue(event.target.value, setSmallCups)} disabled={summarizeMutation.isPending} aria-invalid={Boolean(fieldErrors.smallCups)} aria-describedby={fieldErrors.smallCups ? 'small-cups-error' : undefined} className="placeholder:text-center outline-0 border-b border-[gray] focus:border-[#fe7e32] disabled:opacity-60"/>
            {fieldErrors.smallCups && <p id="small-cups-error" className="text-sm text-red-600">{fieldErrors.smallCups}</p>}
            <label htmlFor="medium_cups" className="text-[gray] select-none ">medium cups</label>
            <input type="text" inputMode="numeric" id="medium_cups" value={mediumCups} onChange={(event) => acceptCupValue(event.target.value, setMediumCups)} disabled={summarizeMutation.isPending} aria-invalid={Boolean(fieldErrors.mediumCups)} aria-describedby={fieldErrors.mediumCups ? 'medium-cups-error' : undefined} className="placeholder:text-center outline-0 border-b border-[gray] focus:border-[#fe7e32] disabled:opacity-60"/>
            {fieldErrors.mediumCups && <p id="medium-cups-error" className="text-sm text-red-600">{fieldErrors.mediumCups}</p>}
            <label htmlFor="large_cups" className="text-[gray]">large cups</label>
            <input type="text" inputMode="numeric" id="large_cups" value={largeCups} onChange={(event) => acceptCupValue(event.target.value, setLargeCups)} disabled={summarizeMutation.isPending} aria-invalid={Boolean(fieldErrors.largeCups)} aria-describedby={fieldErrors.largeCups ? 'large-cups-error' : undefined} className="placeholder:text-center outline-0 border-b border-[gray] focus:border-[#fe7e32] disabled:opacity-60"/>
            {fieldErrors.largeCups && <p id="large-cups-error" className="text-sm text-red-600">{fieldErrors.largeCups}</p>}
            <button type="submit" disabled={summarizeMutation.isPending} className="flex justify-end py-8 px-4 text-2xl text-[#fe7e32] cursor-pointer disabled:cursor-wait disabled:opacity-60">{summarizeMutation.isPending ? 'submitting...' : 'proceed'}</button>
        </form>
      </section>
    </main>
  )
}

export default VerifySummarize
