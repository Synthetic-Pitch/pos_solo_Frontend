import { Minus, Plus } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useLoginStore } from '../stores/use-login-store'
import { reconciliationInputSchema, submitReconciliation, verifyContentAccess } from '../utils/reconciliation'

gsap.registerPlugin(Flip)

type ReconciliationFieldProps = {
  label: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
  disabled?: boolean
  unit?: string
  prefix?: string
}

function ReconciliationField({ label, value, onDecrease, onIncrease, disabled = false, unit, prefix }: ReconciliationFieldProps) {
  return (
    <div className="py-3">
      <p className="font-semibold text-[gray]">{label}</p>
      <div className="flex items-center justify-center gap-5 pt-2">
        <button type="button" aria-label={`Decrease ${label}`} onClick={onDecrease} disabled={disabled || value === 0}>
          <Minus />
        </button>
        <span className="min-w-16 text-4xl">{prefix}{value.toLocaleString()}{unit ? ` ${unit}` : ''}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={onIncrease} disabled={disabled}>
          <Plus />
        </button>
      </div>
    </div>
  )
}

function ReconciliationLoadingSkeleton() {
  return (
    <main className="min-h-dvh flex items-start justify-center px-6 py-8 font-poppins" aria-busy="true" aria-label="Verifying access">
      <section className="min-[400px]:box_shadow w-full max-w-2xl animate-pulse p-8 sm:p-12">
        <div className="mx-auto h-7 w-56 rounded bg-gray-200" />
        <div className="mx-auto mt-4 h-11 w-40 rounded bg-gray-200" />
        <div className="mt-10 space-y-8">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-3">
              <div className="h-5 w-36 rounded bg-gray-200" />
              <div className="mx-auto h-10 w-64 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 h-12 w-36 rounded-2xl bg-gray-200" />
        <div className="mx-auto mt-10 h-12 w-36 rounded-2xl bg-gray-200" />
      </section>
    </main>
  )
}

function ReconciliationPage() {
  const loginResponse = useLoginStore((state) => state.loginResponse)
  const reconciliation = useLoginStore((state) => state.reconciliation)
  const adjustReconciliation = useLoginStore((state) => state.adjustReconciliation)
  const [isAppealing, setIsAppealing] = useState(false)
  const [isAppealPanelMounted, setIsAppealPanelMounted] = useState(false)
  const [isAppealTransitioning, setIsAppealTransitioning] = useState(false)
  const [appealOpeningCash, setAppealOpeningCash] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const reconciliationCardRef = useRef<HTMLElement>(null)
  const appealPanelRef = useRef<HTMLFieldSetElement>(null)
  const actionButtonsRef = useRef<HTMLDivElement>(null)
  const currentDateDisplay = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date());
  const navigate = useNavigate();

  const contentVerificationQuery = useQuery({
    queryKey: ['content-verification', 'reconciliation'],
    queryFn: verifyContentAccess,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })

  // Fires once the moment the server explicitly rejects the session (as
  // opposed to still being in-flight). Kept separate from the render-time
  // check below so the toast does not re-fire on every re-render.
  useEffect(() => {
    if (contentVerificationQuery.isSuccess && contentVerificationQuery.data !== true) {
      toast.error('Unable to load this page. Please sign in again.')
    }
    if (contentVerificationQuery.isError) {
      toast.error('Unable to load this page. Please sign in again.')
    }
  }, [contentVerificationQuery.isSuccess, contentVerificationQuery.isError, contentVerificationQuery.data])

  const reconciliationMutation = useMutation({
    mutationFn: submitReconciliation,
    onSuccess: () => toast.success('Reconciliation submitted successfully.'),
    onError: (error) => toast.error(error.message || 'Unable to submit reconciliation.'),
  })

  // Still verifying with the server — show the skeleton, not an error yet.
  if (contentVerificationQuery.isLoading) {
    return <ReconciliationLoadingSkeleton />
  }

  // Server has explicitly responded and the session is not valid — bounce to
  // login instead of leaving the user stuck on a skeleton forever.
  if (contentVerificationQuery.isError || contentVerificationQuery.data !== true) {
    return <Navigate to="/" replace />
  }

  if (!loginResponse || !reconciliation) {
    return <Navigate to="/" replace />
  }

  const submitConfirmedReconciliation = () => {
    const hasAppeal = isAppealing && appealOpeningCash
    const now = new Date()
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const result = reconciliationInputSchema.safeParse({
      smallCups: reconciliation.smallCups,
      mediumCups: reconciliation.mediumCups,
      largeCups: reconciliation.largeCups,
      openingCash: loginResponse.stores_default.opening_cash,
      openingPotatoes: reconciliation.openingPotatoes,
      ...(hasAppeal && {
        appeal: {
          openingCash: appealOpeningCash,
          openingPotatoes: false,
          date: currentDate,
        },
      }),
    })
    
    if (!result.success) {
      toast.error('The reconciliation values are invalid.')
      return
    }

    reconciliationMutation.mutate(result.data, {
      onSuccess: () => {
        setIsConfirmationOpen(false)
        // Do not mount Order until the reconciliation endpoint confirms that
        // the server has saved the reconciliation. Its route-specific access
        // verification will then see the updated state.
        navigate('/order', { replace: true })
      },
    })
  }

  const toggleAppeal = () => {
    const card = reconciliationCardRef.current
    const actionButtons = actionButtonsRef.current
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!card || !actionButtons || prefersReducedMotion) {
      setIsAppealing((value) => !value)
      setIsAppealPanelMounted((value) => !value)
      return
    }

    setIsAppealTransitioning(true)

    if (!isAppealing) {
      const state = Flip.getState(actionButtons)
      const initialHeight = card.offsetHeight
      flushSync(() => setIsAppealPanelMounted(true))
      const finalHeight = card.offsetHeight
      gsap.set(card, { height: initialHeight, overflow: 'hidden' })

      Flip.from(state, {
        absolute: true,
        duration: .24,
        ease: 'power2.out',
      })
      gsap.to(card, {
        height: finalHeight,
        duration: .24,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(card, { clearProps: 'height,overflow' })
          gsap.fromTo(
            appealPanelRef.current,
            { autoAlpha: 0, y: -10 },
            {
              autoAlpha: 1,
              y: 0,
              delay: 0.12,
              duration: 0.25,
              ease: 'power2.out',
              onComplete: () => {
                setIsAppealing(true)
                setIsAppealTransitioning(false)
              },
            },
          )
        },
      })
      return
    }

    gsap.to(appealPanelRef.current, {
      autoAlpha: 0,
      y: -10,
      duration: .1,
      ease: 'power1.in',
      onComplete: () => {
        const initialHeight = card.offsetHeight
        gsap.set(card, { height: initialHeight, overflow: 'hidden' })
        const state = Flip.getState(actionButtons)
        flushSync(() => {
          setIsAppealing(false)
          setIsAppealPanelMounted(false)
        })
        const finalHeight = card.scrollHeight
        Flip.from(state, {
          absolute: true,
          duration: 0.34,
          ease: 'power2.out',
        })
        gsap.to(card, {
          height: finalHeight,
          duration: 0.34,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(card, { clearProps: 'height,overflow' })
            setIsAppealTransitioning(false)
          },
        })
      },
    })
  }

  return (
    <main className="min-h-dvh flex items-start justify-center px-6 py-8 font-poppins">
      <section ref={reconciliationCardRef} className="min-[400px]:box_shadow w-full max-w-2xl p-8 text-center sm:p-12 text-3xl font-poppins">
        <p className="font-poppins text-[#b6b6b6] font-bold">Verify Opening Cash</p>
        <p className="py-3 text-4xl font-bold text-[#fe7e32]">₱{loginResponse.stores_default.opening_cash.toLocaleString()}</p>
        <ReconciliationField label="Startup potatoes" value={reconciliation.openingPotatoes} unit="kg" disabled={reconciliationMutation.isPending} onDecrease={() => adjustReconciliation('openingPotatoes', -1)} onIncrease={() => adjustReconciliation('openingPotatoes', 1)} />
        <ReconciliationField label="Small cups" value={reconciliation.smallCups} disabled={reconciliationMutation.isPending} onDecrease={() => adjustReconciliation('smallCups', -1)} onIncrease={() => adjustReconciliation('smallCups', 1)} />
        <ReconciliationField label="Medium cups" value={reconciliation.mediumCups} disabled={reconciliationMutation.isPending} onDecrease={() => adjustReconciliation('mediumCups', -1)} onIncrease={() => adjustReconciliation('mediumCups', 1)} />
        <ReconciliationField label="Large cups" value={reconciliation.largeCups} disabled={reconciliationMutation.isPending} onDecrease={() => adjustReconciliation('largeCups', -1)} onIncrease={() => adjustReconciliation('largeCups', 1)} />
        {isAppealPanelMounted && (
          <fieldset
            ref={appealPanelRef}
            aria-hidden={!isAppealing}
            style={{ opacity: isAppealing ? 1 : 0, visibility: isAppealing ? 'visible' : 'hidden' }}
            className="mx-auto mt-4 flex max-w-md flex-col gap-3 rounded-xl border border-[#fe7e32] p-4 text-left text-base will-change-transform"
          >
            <legend className="px-2 font-semibold text-[#fe7e32]">Appeal details</legend>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={appealOpeningCash} onChange={(event) => setAppealOpeningCash(event.target.checked)} disabled={reconciliationMutation.isPending} />
              Appeal opening cash
            </label>
            <p className="flex flex-col gap-1">
              Appeal date
              <span className="rounded border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600">{currentDateDisplay}</span>
            </p>
          </fieldset>
        )}
        <div ref={actionButtonsRef} className="flex flex-col items-center justify-center gap-4 py-8 select-none">
          <button type="button" onClick={() => setIsConfirmationOpen(true)} disabled={reconciliationMutation.isPending || isAppealTransitioning} className="text-white bg-[#fe7e32] px-5 py-2 rounded-2xl text-3xl cursor-pointer disabled:cursor-wait disabled:opacity-60">confirm</button>
          <button type="button" onClick={toggleAppeal} disabled={reconciliationMutation.isPending || isAppealTransitioning} aria-expanded={isAppealing} className="text-[#fe7e32] text-2xl cursor-pointer disabled:opacity-60">{isAppealing ? 'cancel appeal' : 'appeal'}</button>
        </div>
      </section>
      {isConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl">
            <h2 id="confirmation-title" className="text-2xl font-bold text-[#fe7e32]">Confirm reconciliation</h2>
            <p className="mt-4 text-lg text-gray-700">Are you sure the selected values are correct?</p>
            <div className="mt-7 flex justify-center gap-4">
              <button type="button" onClick={() => setIsConfirmationOpen(false)} disabled={reconciliationMutation.isPending} className="rounded-xl border border-[#fe7e32] px-5 py-2 text-lg text-[#fe7e32] disabled:opacity-60">Go back</button>
              <button type="button" onClick={submitConfirmedReconciliation} disabled={reconciliationMutation.isPending} className="rounded-xl bg-[#fe7e32] px-5 py-2 text-lg text-white disabled:opacity-60">{reconciliationMutation.isPending ? 'Submitting...' : 'Yes, submit'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default ReconciliationPage;
