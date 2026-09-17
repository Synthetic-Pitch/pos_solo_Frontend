import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { useOrderStore } from "../stores/use-order-store";
import { useSummaryStore } from "../stores/use-summary-store";
import { addCups } from "../utils/cup";
import { addPotatoes } from "../utils/potato";
import { submitSummary } from "../utils/summary";

const Overview = () => {
  const navigate = useNavigate();
  const salesCount = useOrderStore((state) => state.salesCount)
  const setSummaryReceipt = useSummaryStore((state) => state.setReceipt)
  const [isPotatoModalOpen, setIsPotatoModalOpen] = useState(false)
  const [isCupModalOpen, setIsCupModalOpen] = useState(false)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [kilo, setKilo] = useState('')
  const [cupQuantity, setCupQuantity] = useState('')
  const [cupSize, setCupSize] = useState<'small' | 'medium' | 'large'>('small')
  const [closingSmallCups, setClosingSmallCups] = useState('')
  const [closingMediumCups, setClosingMediumCups] = useState('')
  const [closingLargeCups, setClosingLargeCups] = useState('')
  const [closingPotatoes, setClosingPotatoes] = useState('')
  const kiloInputRef = useRef<HTMLInputElement>(null)
  const cupQuantityInputRef = useRef<HTMLInputElement>(null)

  const addPotatoMutation = useMutation({
    mutationFn: addPotatoes,
    onSuccess: () => {
      toast.success('Potatoes added successfully.')
      setIsPotatoModalOpen(false)
      setKilo('')
    },
    onError: (error) => toast.error(error.message || 'Unable to add potatoes.'),
  })

  const addCupMutation = useMutation({
    mutationFn: addCups,
    onSuccess: () => {
      toast.success('Cups added successfully.')
      setIsCupModalOpen(false)
      setCupQuantity('')
      setCupSize('small')
    },
    onError: (error) => toast.error(error.message || 'Unable to add cups.'),
  })

  const summarizeMutation = useMutation({
    mutationFn: submitSummary,
    onSuccess: (response) => {
      setSummaryReceipt(response.receipt)
      setIsSummaryModalOpen(false)
    },
    onError: (error) => toast.error(error.message || 'Unable to submit the summary.'),
  })

  useEffect(() => {
    if (!isPotatoModalOpen) return

    kiloInputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !addPotatoMutation.isPending) {
        setIsPotatoModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPotatoModalOpen, addPotatoMutation.isPending]);

  function openPotatoModal() {
    setKilo('')
    setIsPotatoModalOpen(true)
  }

  function openCupModal() {
    setCupQuantity('')
    setCupSize('small')
    setIsCupModalOpen(true)
  }

  function handlePotatoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedKilo = Number(kilo)
    if (!Number.isFinite(parsedKilo) || parsedKilo <= 0) {
      toast.error('Enter an amount greater than 0 kg.')
      return
    }
    addPotatoMutation.mutate({ kilo: parsedKilo })
  }

  function handleCupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedQuantity = Number(cupQuantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Enter a whole number of cups greater than 0.')
      return
    }
    addCupMutation.mutate({ quantity: parsedQuantity, cupSize })
  }

  function handleSummarySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const small = Number(closingSmallCups)
    const medium = Number(closingMediumCups)
    const large = Number(closingLargeCups)
    const potatoes = Number(closingPotatoes)

    if (![small, medium, large].every((value) => Number.isInteger(value) && value >= 0) || !Number.isFinite(potatoes) || potatoes < 0) {
      toast.error('Enter valid closing inventory values.')
      return
    }

    summarizeMutation.mutate({
      closingSmallCups: small,
      closingMediumCups: medium,
      closingLargeCups: large,
      closingPotatoes: potatoes,
    })
  }

  useEffect(() => {
    if (!isCupModalOpen) return

    cupQuantityInputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !addCupMutation.isPending) {
        setIsCupModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCupModalOpen, addCupMutation.isPending])
  return (
    <div>
        <button className="flex" onClick={()=>navigate("/order")}>
            <h3 className="bg-[#b1b2b5] text-white pr-20 pl-9 text-3xl py-8 rounded-br-full font-poppins" >back</h3>
        </button>
        <main className="p-8 font-poppins flex justify-evenly gap-4 ">
          {salesCount && (
            <div className="flex justify-evenly w-100 py-4 font-poppins border-black border">
              <div className="flex flex-col gap-2">
                <h1>Lil Fun</h1>
                <h1>Share Fun</h1>
                <h1>Big Fun</h1>
              </div>
              <div className="flex flex-col gap-2">
                <h1>{salesCount.small}</h1>
                <h1>{salesCount.medium}</h1>
                <h1>{salesCount.large}</h1>
              </div>
            </div>
          ) }
        </main>
        <section className="flex flex-col items-center">
          <main className="w-full min-[600px]:w-[90%] min-[900px]:w-100 ">
            <span className="text-[gray]">add</span>
            <section className="flex justify-center">
              <button type="button" onClick={openCupModal} className="bg-[#fe7e32] h-20 w-40 border-r rounded-l-full cursor-pointer text-white text-2xl">cup</button>
              <button type="button" onClick={openPotatoModal} className="bg-[#fe7e32] h-20 w-40 rounded-r-full cursor-pointer text-white text-2xl">potato</button>
            </section>
          </main>
        </section>
        <footer className="flex justify-center py-18">
          <button type="button" onClick={() => setIsSummaryModalOpen(true)} disabled={summarizeMutation.isPending} className="text-[#fe7e32] text-4xl cursor-pointer disabled:cursor-wait disabled:opacity-60">
            Summarize
          </button>
        </footer>
        {isPotatoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !addPotatoMutation.isPending) setIsPotatoModalOpen(false)
            }}
          >
            <form onSubmit={handlePotatoSubmit} role="dialog" aria-modal="true" aria-labelledby="add-potatoes-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
              <h2 id="add-potatoes-title" className="text-2xl font-bold text-[#fe7e32]">Add potatoes</h2>
              <p className="mt-2 text-gray-600">Enter the weight received. Today’s date is recorded automatically.</p>
              <label className="mt-6 flex flex-col gap-2 text-lg font-medium text-gray-700">
                Kilograms
                <input ref={kiloInputRef} type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" value={kilo} onChange={(event) => setKilo(event.target.value)} disabled={addPotatoMutation.isPending} required className="rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100" />
              </label>
              <div className="mt-7 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPotatoModalOpen(false)} disabled={addPotatoMutation.isPending} className="rounded-xl border border-[#fe7e32] px-5 py-2 text-lg text-[#fe7e32] disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={addPotatoMutation.isPending} className="rounded-xl bg-[#fe7e32] px-5 py-2 text-lg text-white disabled:cursor-wait disabled:opacity-60">{addPotatoMutation.isPending ? 'Adding...' : 'Add potatoes'}</button>
              </div>
            </form>
          </div>
        )}
        {isCupModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !addCupMutation.isPending) setIsCupModalOpen(false)
            }}
          >
            <form onSubmit={handleCupSubmit} role="dialog" aria-modal="true" aria-labelledby="add-cups-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
              <h2 id="add-cups-title" className="text-2xl font-bold text-[#fe7e32]">Add cups</h2>
              <p className="mt-2 text-gray-600">Enter the cups received. Today’s date is recorded automatically.</p>
              <label className="mt-6 flex flex-col gap-2 text-lg font-medium text-gray-700">
                Cup size
                <select value={cupSize} onChange={(event) => setCupSize(event.target.value as typeof cupSize)} disabled={addCupMutation.isPending} className="rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
              <label className="mt-4 flex flex-col gap-2 text-lg font-medium text-gray-700">
                Quantity
                <input ref={cupQuantityInputRef} type="number" inputMode="numeric" min="1" max="1000000" step="1" value={cupQuantity} onChange={(event) => setCupQuantity(event.target.value)} disabled={addCupMutation.isPending} required className="rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100" />
              </label>
              <div className="mt-7 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCupModalOpen(false)} disabled={addCupMutation.isPending} className="rounded-xl border border-[#fe7e32] px-5 py-2 text-lg text-[#fe7e32] disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={addCupMutation.isPending} className="rounded-xl bg-[#fe7e32] px-5 py-2 text-lg text-white disabled:cursor-wait disabled:opacity-60">{addCupMutation.isPending ? 'Adding...' : 'Add cups'}</button>
              </div>
            </form>
          </div>
        )}
        {isSummaryModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !summarizeMutation.isPending) setIsSummaryModalOpen(false)
            }}
          >
            <form onSubmit={handleSummarySubmit} role="dialog" aria-modal="true" aria-labelledby="summary-title" className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
              <h2 id="summary-title" className="text-2xl font-bold text-[#fe7e32]">Closing inventory</h2>
              <p className="mt-2 text-gray-600">Enter the remaining cups and potatoes for the summary.</p>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2 font-medium text-gray-700">Small cups<input type="number" inputMode="numeric" min="0" max="1000000" step="1" value={closingSmallCups} onChange={(event) => setClosingSmallCups(event.target.value)} disabled={summarizeMutation.isPending} required className="rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100" /></label>
                <label className="flex flex-col gap-2 font-medium text-gray-700">Medium cups<input type="number" inputMode="numeric" min="0" max="1000000" step="1" value={closingMediumCups} onChange={(event) => setClosingMediumCups(event.target.value)} disabled={summarizeMutation.isPending} required className="rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100" /></label>
                <label className="flex flex-col gap-2 font-medium text-gray-700">Large cups<input type="number" inputMode="numeric" min="0" max="1000000" step="1" value={closingLargeCups} onChange={(event) => setClosingLargeCups(event.target.value)} disabled={summarizeMutation.isPending} required className="rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100" /></label>
              </div>
              <label className="mt-4 flex flex-col gap-2 text-lg font-medium text-gray-700">Closing potatoes (kg)<input type="number" inputMode="decimal" min="0" max="1000000" step="0.01" value={closingPotatoes} onChange={(event) => setClosingPotatoes(event.target.value)} disabled={summarizeMutation.isPending} required className="rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#fe7e32] focus:ring-2 focus:ring-[#fe7e32]/30 disabled:bg-gray-100" /></label>
              <div className="mt-7 flex justify-end gap-3">
                <button type="button" onClick={() => setIsSummaryModalOpen(false)} disabled={summarizeMutation.isPending} className="rounded-xl border border-[#fe7e32] px-5 py-2 text-lg text-[#fe7e32] disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={summarizeMutation.isPending} className="rounded-xl bg-[#fe7e32] px-5 py-2 text-lg text-white disabled:cursor-wait disabled:opacity-60">{summarizeMutation.isPending ? 'Submitting...' : 'Submit summary'}</button>
              </div>
            </form>
          </div>
        )}
    </div>
  )
}

export default Overview;
