import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSalesCountStore } from '../stores/use-sales-count-store'
import { addCups, cupQuantitySchema } from '../utils/cup'
import { addPotatoes, addPotatoInputSchema } from '../utils/potato'

const Overview = () => {
  const navigate = useNavigate()
  const salesCount = useSalesCountStore((state) => state.salesCount)
  const [isPotatoModalOpen, setIsPotatoModalOpen] = useState(false)
  const [kilo, setKilo] = useState('')
  const [kiloError, setKiloError] = useState('')
  const [isCupModalOpen, setIsCupModalOpen] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [cupSize, setCupSize] = useState<'small' | 'medium' | 'large'>('small')
  const [cupError, setCupError] = useState('')


  const addPotatoMutation = useMutation({
    mutationFn: addPotatoes,
    onSuccess: (response) => {
      setKilo('')
      setKiloError('')
      setIsPotatoModalOpen(false)
      toast.success(response.message)
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to add potatoes.')
    },
  })

  const addCupMutation = useMutation({
    mutationFn: addCups,
    onSuccess: (response) => {
      setQuantity('')
      setCupSize('small')
      setCupError('')
      setIsCupModalOpen(false)
      toast.success(response.message)
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to add cups.')
    },
  })

  useEffect(() => {
    if (!isPotatoModalOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !addPotatoMutation.isPending) {
        setIsPotatoModalOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [addPotatoMutation.isPending, isPotatoModalOpen])

  useEffect(() => {
    if (!isCupModalOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !addCupMutation.isPending) {
        setIsCupModalOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [addCupMutation.isPending, isCupModalOpen])

  const openPotatoModal = () => {
    setKiloError('')
    setIsPotatoModalOpen(true)
  }

  const openCupModal = () => {
    setCupError('')
    setIsCupModalOpen(true)
  }

  const handleAddPotatoes = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKiloError('')

    const result = addPotatoInputSchema.safeParse({ kilo: Number(kilo) })
    if (!result.success) {
      setKiloError(result.error.issues[0]?.message ?? 'Enter a valid potato amount.')
      return
    }

    addPotatoMutation.mutate(result.data)
  }

  const handleAddCups = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCupError('')

    const quantityResult = cupQuantitySchema.safeParse(quantity)
    if (!quantityResult.success) {
      setCupError(quantityResult.error.issues[0]?.message ?? 'Enter a valid cup quantity.')
      return
    }

    addCupMutation.mutate({ quantity: quantityResult.data, cupSize })
  }

  return (
    <div>
        <button className="flex" onClick={() => navigate('/order')}>
            <h3 className="bg-[#b1b2b5] text-white pr-20 pl-9 text-3xl py-8 rounded-br-full font-poppins outline" >back</h3>
        </button>
        <main className="flex flex-col items-center justify-center">
          <section className="px-7 font-poppins border mx-0 w-full min-[400px]:m-12 my-12 max-w-200" aria-label="Sales count">
            <h2 className="text-2xl font-bold py-4">Sales count</h2>
            <div className="grid grid-cols-2">
              <section className="border-t border-black py-6 text-sm min-[300px]:text-2xl flex flex-col gap-4">
                <h3 className="h-[30%]">LIL FUN</h3>
                <h3 className="h-[30%]">SHARE FUN</h3>
                <h3 className="h-[30%]">BIG FUN</h3>
              </section>
              <section className="border-t border-l border-black py-6 pl-4 text-sm min-[300px]:text-2xl flex flex-col gap-4">
                <h3 className="h-[30%]">{salesCount.small}</h3>
                <h3 className="h-[30%]">{salesCount.medium}</h3>
                <h3 className="h-[30%]">{salesCount.large}</h3>
              </section>
            </div>
          </section>
          <main className="w-full max-w-200 ">
            <span className="text-[gray] text-xl">ADD</span>
            <div className="w-full h-50 flex justify-evenly items-center">
              <button type="button" onClick={openCupModal} className="rounded-l-full h-[70%] w-[50%] bg-[#fe7e32] text-white text-3xl font-bold border-r border-black cursor-pointer">CUPS</button>
              <button type="button" onClick={openPotatoModal} className="rounded-r-full h-[70%] w-[50%] bg-[#fe7e32] text-white text-3xl font-bold cursor-pointer">POTATO</button>
            </div>
            <footer className="flex justify-center my-28">
              <button className="text-[#fe7e32] text-6xl font-poppins cursor-pointer" onClick={()=>navigate("/verify-summarize")}>Summarize</button>
            </footer>
          </main>
        </main>
        {isPotatoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !addPotatoMutation.isPending) {
                setIsPotatoModalOpen(false)
              }
            }}
          >
            <section role="dialog" aria-modal="true" aria-labelledby="add-potatoes-title" className="w-full max-w-md rounded-2xl bg-white p-6 font-poppins shadow-xl">
              <h2 id="add-potatoes-title" className="text-2xl font-bold">Add potatoes</h2>
              <p className="mt-2 text-gray-600">Enter the kilograms received today.</p>
              <form onSubmit={handleAddPotatoes} noValidate className="mt-6">
                <label htmlFor="potato-kilo" className="block text-lg font-medium">Kilograms</label>
                <input
                  id="potato-kilo"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={kilo}
                  onChange={(event) => setKilo(event.target.value)}
                  disabled={addPotatoMutation.isPending}
                  aria-invalid={Boolean(kiloError)}
                  aria-describedby={kiloError ? 'potato-kilo-error' : undefined}
                  autoFocus
                  required
                  className="mt-2 w-full rounded-lg border border-gray-400 px-3 py-2 text-xl outline-none focus:border-[#fe7e32]"
                />
                {kiloError && <p id="potato-kilo-error" className="mt-2 text-sm text-red-600">{kiloError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsPotatoModalOpen(false)} disabled={addPotatoMutation.isPending} className="rounded-lg px-4 py-2 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={addPotatoMutation.isPending} className="rounded-lg bg-[#fe7e32] px-4 py-2 text-white disabled:opacity-50">
                    {addPotatoMutation.isPending ? 'Adding...' : 'Add potatoes'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
        {isCupModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !addCupMutation.isPending) {
                setIsCupModalOpen(false)
              }
            }}
          >
            <section role="dialog" aria-modal="true" aria-labelledby="add-cups-title" className="w-full max-w-md rounded-2xl bg-white p-6 font-poppins shadow-xl">
              <h2 id="add-cups-title" className="text-2xl font-bold">Add cups</h2>
              <p className="mt-2 text-gray-600">Choose the cup size and enter the quantity received today.</p>
              <form onSubmit={handleAddCups} noValidate className="mt-6">
                <label htmlFor="cup-size" className="block text-lg font-medium">Cup size</label>
                <select
                  id="cup-size"
                  value={cupSize}
                  onChange={(event) => setCupSize(event.target.value as 'small' | 'medium' | 'large')}
                  disabled={addCupMutation.isPending}
                  className="mt-2 w-full rounded-lg border border-gray-400 px-3 py-2 text-xl outline-none focus:border-[#fe7e32]"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                <label htmlFor="cup-quantity" className="mt-4 block text-lg font-medium">Quantity</label>
                <input
                  id="cup-quantity"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={quantity}
                  onChange={(event) => {
                    const nextQuantity = event.target.value
                    if (/^\d*$/.test(nextQuantity)) setQuantity(nextQuantity)
                  }}
                  disabled={addCupMutation.isPending}
                  aria-invalid={Boolean(cupError)}
                  aria-describedby={cupError ? 'cup-quantity-error' : undefined}
                  autoFocus
                  required
                  className="mt-2 w-full rounded-lg border border-gray-400 px-3 py-2 text-xl outline-none focus:border-[#fe7e32]"
                />
                {cupError && <p id="cup-quantity-error" className="mt-2 text-sm text-red-600">{cupError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCupModalOpen(false)} disabled={addCupMutation.isPending} className="rounded-lg px-4 py-2 disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={addCupMutation.isPending} className="rounded-lg bg-[#fe7e32] px-4 py-2 text-white disabled:opacity-50">
                    {addCupMutation.isPending ? 'Adding...' : 'Add cups'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
    </div>
  )
}

export default Overview;
