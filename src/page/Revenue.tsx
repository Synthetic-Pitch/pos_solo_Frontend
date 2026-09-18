
import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSummaryStore } from '../stores/use-summary-store'
import { archiveSession, verifyRevenueAccess } from '../utils/revenue'

const formatNumber = (value: number) => new Intl.NumberFormat().format(value)
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

function RevenueLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#fffaf7] p-6 font-poppins sm:p-8" aria-busy="true" aria-label="Verifying revenue access">
      <section className="mx-auto max-w-5xl animate-pulse" aria-hidden="true">
        <div className="h-10 w-72 rounded bg-gray-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-32 rounded-2xl bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-200" />
        </div>
        <div className="mt-6 h-64 rounded-2xl bg-gray-200" />
        <div className="mt-6 h-40 rounded-2xl bg-gray-200" />
      </section>
    </main>
  )
}

const Revenue = () => {
  const navigate = useNavigate()
  const receipt = useSummaryStore((state) => state.receipt)
  const contentVerificationQuery = useQuery({
    queryKey: ['content-verification-revenue', 'revenue'],
    queryFn: verifyRevenueAccess,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })

  const archiveMutation = useMutation({
    mutationFn: archiveSession,
    onSuccess: (response) => {
      toast.success(response.message || 'Archived successfully.')
      navigate('/shiftend', { replace: true })
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to archive.')
    },
  })

  useEffect(() => {
    if (contentVerificationQuery.isSuccess && !contentVerificationQuery.data.valid) {
      toast.error(contentVerificationQuery.data.message)
    } else if (contentVerificationQuery.isError) {
      toast.error('Unable to verify your session. Please sign in again.')
    }
  }, [contentVerificationQuery.data, contentVerificationQuery.isError, contentVerificationQuery.isSuccess])

  if (archiveMutation.isSuccess) {
    return null
  }

  if (contentVerificationQuery.isLoading) {
    return <RevenueLoadingSkeleton />
  }

  if (contentVerificationQuery.isError || contentVerificationQuery.data?.valid !== true) {
    return <Navigate to="/" replace />
  }

  if (!receipt) {
    return (
      <main className="min-h-screen bg-[#fffaf7] p-8 font-poppins">
        <section className="mx-auto mt-20 max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-[#fe7e32]">No summary yet</h1>
          <p className="mt-3 text-gray-600">Submit a summary from the overview page to view its revenue report.</p>
        </section>
      </main>
    )
  }
  
  return (
    <main className="min-h-screen bg-[#fffaf7] p-6 font-poppins sm:p-8">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#fe7e32]">Revenue summary</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl bg-[#fe7e32] p-6 text-white shadow-sm">
            <p className="text-lg">Total revenue</p>
            <p className="mt-2 text-4xl font-bold">{formatCurrency(receipt.total_revenue)}</p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-lg text-gray-600">Total sales</p>
            <p className="mt-2 text-4xl font-bold text-gray-800">{formatNumber(receipt.total_sales)}</p>
          </article>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="pb-3 font-medium">Payment method</th>
                  <th className="pb-3 font-medium">Small</th>
                  <th className="pb-3 font-medium">Medium</th>
                  <th className="pb-3 font-medium">Large</th>
                  <th className="pb-3 font-medium">Sales</th>
                  <th className="pb-3 text-right font-medium">Earned</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(receipt.payments).map(([method, payment]) => (
                  <tr key={method} className="border-b last:border-0">
                    <td className="py-4 font-medium capitalize">{method.replace(/_/g, ' ')}</td>
                    <td className="py-4">{formatNumber(payment.small_fries)}</td>
                    <td className="py-4">{formatNumber(payment.medium_fries)}</td>
                    <td className="py-4">{formatNumber(payment.large_fries)}</td>
                    <td className="py-4">{formatNumber(payment.total_sales)}</td>
                    <td className="py-4 text-right font-semibold">{formatCurrency(payment.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">Inventory remaining</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(receipt.inventory_left).map(([item, amount]) => (
              <div key={item} className="rounded-xl bg-[#fff3ec] p-4">
                <p className="capitalize text-gray-600">{item.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-2xl font-bold text-gray-800">{formatNumber(amount)}{item === 'potatoes' ? ' kg' : ''}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex justify-center pb-6">
          <button
            type="button"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
            className="rounded-full bg-[#fe7e32] px-12 py-4 text-xl font-semibold text-white shadow-sm transition hover:bg-[#e66d28] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Revenue
