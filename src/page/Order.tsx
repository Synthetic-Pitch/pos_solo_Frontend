import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import inventoryIcon from '../assets/icon/inventory_icon.png'
import { useLoginStore } from '../stores/use-login-store'
import { useOrderStore } from '../stores/use-order-store'
import { useSalesCountStore } from '../stores/use-sales-count-store'
import { submitOrders, verifyOrderAccess } from '../utils/order'
import fries from "../assets/image/fries.png"
import {Plus,Minus} from "lucide-react"
function requiresReconciliation(message: string | undefined): boolean {
  // The backend has returned both "Must set reconciliation first" and
  // "Must set to reconciliation first". Treat either wording as the same
  // protected-flow instruction instead of sending a valid user to login.
  return /^must set(?:\s+to)?\s+reconciliation\s+first$/i.test(message?.trim() ?? '')
}

function OrderLoadingSkeleton() {
  return (
    <main className="min-h-dvh animate-pulse px-6 font-poppins" aria-busy="true" aria-label="Verifying order access">
      <header className="mx-auto flex w-full max-w-200 items-center justify-between py-3">
        <div className="h-12 w-28 rounded-4xl bg-gray-200" />
        <div className="h-16 w-16 rounded bg-gray-200" />
      </header>
      <section className="mx-auto w-full max-w-200 rounded-2xl" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <div key={item} className="border-b border-gray-200 py-6 last:border-0">
            <div className="flex items-center justify-between">
              <div className="mx-auto h-7 w-20 rounded bg-gray-200" />
              <div className="h-10 w-16 rounded bg-gray-200" />
            </div>
            <div className="mt-5 flex items-center">
              <div className="flex w-1/2 justify-center"><div className="h-28 w-24 rounded bg-gray-200" /></div>
              <div className="h-12 w-32 rounded bg-gray-200" />
            </div>
            <div className="mt-5 grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((flavor) => <div key={flavor} className="mx-auto h-14 w-12 rounded bg-gray-200" />)}
            </div>
          </div>
        ))}
        <div className="mx-auto mt-6 h-9 w-40 rounded bg-gray-200" />
        <div className="mt-6 h-20 w-full rounded bg-gray-200" />
      </section>
    </main>
  )
}

const Order = () => {
  const location = useLocation()
  const loginResponse = useLoginStore((state) => state.loginResponse)
  const orders = useOrderStore((state) => state.orders)
  const gcash = useOrderStore((state) => state.isGcashPayment)
  const setGcashPayment = useOrderStore((state) => state.setGcashPayment)
  const selectedFlavorBySize = useOrderStore((state) => state.selectedFlavorBySize)
  const selectFlavor = useOrderStore((state) => state.selectFlavor)
  const addOrder = useOrderStore((state) => state.addOrder)
  const removeOrder = useOrderStore((state) => state.removeOrder)
  const clearOrders = useOrderStore((state) => state.clearOrders)
  const setSalesCount = useSalesCountStore((state) => state.setSalesCount)
  const storeDefaults = loginResponse?.stores_default
  const fromSuccessfulLogin = Boolean(
    (location.state as { fromSuccessfulLogin?: boolean } | null)?.fromSuccessfulLogin,
  )
  const navigate = useNavigate();
  const contentVerificationQuery = useQuery({
    queryKey: ['content-verification-order', 'order'],
    queryFn: verifyOrderAccess,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })

  const checkoutMutation = useMutation({
    mutationFn: submitOrders,
    onSuccess: (response) => {
      setSalesCount(response.sales_count)
      clearOrders()
      toast.success('Order submitted successfully.')
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to submit the order.')
    },
  })

  useEffect(() => {
    if (contentVerificationQuery.isSuccess && !contentVerificationQuery.data.valid) {
      const needsReconciliation = requiresReconciliation(contentVerificationQuery.data.message)
      if (!fromSuccessfulLogin || !needsReconciliation) {
        toast.error(contentVerificationQuery.data.message)
      }
    } else if (contentVerificationQuery.isError) {
      toast.error('Unable to verify your session. Please sign in again.')
    } else if (contentVerificationQuery.isSuccess && !loginResponse) {
      toast.error('Unable to load this page. Please sign in again.')
    }
  }, [contentVerificationQuery.data, contentVerificationQuery.isError, contentVerificationQuery.isSuccess, fromSuccessfulLogin, loginResponse])
  
  if (contentVerificationQuery.isLoading) {
    return <OrderLoadingSkeleton />
  }

  if (contentVerificationQuery.isError) {
    return <Navigate to="/" replace />
  }

  if (contentVerificationQuery.data?.valid === false) {
    return <Navigate
      to={requiresReconciliation(contentVerificationQuery.data.message) ? '/reconciliation' : '/'}
      replace
    />
  }
  
  if (!loginResponse) {
    return <Navigate to="/" replace />
  }

  const total = storeDefaults?.sizes_price.reduce(
    (sum, { size, price }) => sum + orders.filter((order) => order.size === size).length * price,
    0,
  ) ?? 0

  return (
    <div className="min-h-dvh px-6 font-poppins !select-none">
      <header className="mx-auto flex w-full max-w-200 justify-between items-center py-3">
        <button type="button" onClick={() => setGcashPayment(!gcash)} className={`h-12 rounded-4xl px-8 text-2xl text-white outline-0 ${gcash ? 'bg-[#0a81ff]' : 'bg-[#b6b6b6]'}`}>gcash</button>
        <img src={inventoryIcon} alt="Inventory" className="h-16" onClick={()=>navigate("/overall")} />
      </header>
      {storeDefaults && (
        <section className="mx-auto w-full max-w-200 rounded-2xl" aria-labelledby="store-defaults-title">
          <ul>
            {
              storeDefaults.sizes_price.map((item, index) => {
                const selectedFlavor = selectedFlavorBySize[item.size]
                const sizeOrderCount = orders.filter((order) => order.size === item.size).length

                return (
                  <li key={index} className=" mt-2">
                    <div className="relative flex justify-center items-center pt-6">
                      <span className="text-2xl text-[#b6b6b6] font-azeret-mono">{item.size}</span>
                      <span className="absolute right-0 text-4xl text-[#fe7e32] font-playwrite-vn">{item.price}</span>
                    </div>
                    <div className="relative flex items-center py-4">
                      <div className="relative w-1/2 flex items-center justify-center">
                        <img src={fries} alt=""
                        className={
                          `${item.size === "small" && "h-25"} ${item.size === "medium" && "h-30"} ${item.size === "large" && "h-35"}`
                          }/>
                      </div>
                      <section className="w-1/2 flex font-poppins text-5xl items-center gap-4 font-semibold">
                        <button
                          type="button"
                          aria-label={`Add ${item.size} order`}
                          disabled={!selectedFlavor}
                          onClick={() => selectedFlavor && addOrder({
                            flavor: selectedFlavor,
                            size: item.size,
                            ...(gcash && { payment_method: 'gcash' }),
                          })}
                          className="disabled:cursor-not-allowed disabled:opacity-30"
                        ><Plus size={30}/></button>
                        {sizeOrderCount}
                        <button
                          type="button"
                          aria-label={`Remove ${item.size} order`}
                          disabled={sizeOrderCount === 0}
                          onClick={() => removeOrder(item.size)}
                          className="disabled:cursor-not-allowed disabled:opacity-30"
                        ><Minus size={30}/></button>
                      </section>
                    </div>
                    <div className="flex justify-evenly font-poppins w-full">
                      {
                        storeDefaults.flavors.map((flavor, flavorIndex) => {
                          return (
                            <button
                              key={flavorIndex}
                              type="button"
                              onClick={() => selectFlavor(item.size, flavor.flavor)}
                              aria-pressed={selectedFlavor === flavor.flavor}
                              className="flex flex-1 cursor-pointer flex-col items-center"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                                <img src={flavor.sourceURL} alt={flavor.flavor} className="max-h-full max-w-full object-contain" />
                              </div>
                              <span className={`mt-1 text-center leading-tight ${selectedFlavor === flavor.flavor ? 'text-[#fe7e32]' : ''}`}>{flavor.flavor}</span>
                            </button>
                          )
                        })
                      }
                    </div>
                    {index !== storeDefaults.sizes_price.length - 1 && (
                      <hr className="bg-[#b6b6b6] h-0.5 border-0 p-0 mt-2" />
                    )}
                  </li>
                )
              })
            }
          </ul>
        </section>
      )}
      <div className="text-3xl font-bold flex justify-center py-6 font-roboto ">total : {total}</div>
      <button
        type="button"
        onClick={() => checkoutMutation.mutate(orders)}
        disabled={checkoutMutation.isPending || orders.length === 0}
        className="flex w-full justify-center bg-[#fe7e32] py-8 font-mono text-4xl text-white disabled:cursor-not-allowed disabled:opacity-60"
      >{checkoutMutation.isPending ? 'submitting...' : 'checkout'}</button>
    </div>
  )
}

export default Order
