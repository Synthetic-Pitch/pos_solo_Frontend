import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CheckoutResponse } from '../utils/order'

export type SalesCount = CheckoutResponse['sales_count']

type SalesCountStore = {
  salesCount: SalesCount
  setSalesCount: (salesCount: SalesCount) => void
}

const emptySalesCount: SalesCount = { small: 0, medium: 0, large: 0 }

const normalizeSalesCount = (value: unknown): SalesCount => {
  if (!value || typeof value !== 'object') return emptySalesCount

  const counts = value as Partial<SalesCount>
  const normalize = (count: unknown) =>
    typeof count === 'number' && Number.isFinite(count) && count >= 0
      ? Math.floor(count)
      : 0

  return {
    small: normalize(counts.small),
    medium: normalize(counts.medium),
    large: normalize(counts.large),
  }
}

/** Persists the latest server-confirmed total sales by cup size. */
export const useSalesCountStore = create<SalesCountStore>()(
  persist(
    (set) => ({
      salesCount: emptySalesCount,
      setSalesCount: (salesCount) => set({ salesCount: normalizeSalesCount(salesCount) }),
    }),
    {
      name: 'pos-sales-count',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ salesCount }) => ({ salesCount }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        salesCount: normalizeSalesCount((persistedState as Partial<SalesCountStore>)?.salesCount),
      }),
    },
  ),
)
