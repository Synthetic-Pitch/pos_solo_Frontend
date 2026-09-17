import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { summaryReceiptSchema, type SummaryReceipt } from '../utils/summary'

type SummaryStore = {
  receipt: SummaryReceipt | null
  setReceipt: (receipt: SummaryReceipt) => void
  clearReceipt: () => void
}

const readReceipt = (value: unknown): SummaryReceipt | null => {
  const result = summaryReceiptSchema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Persists only the non-sensitive fields needed after a summary is submitted.
 * Data is validated both before writing and during hydration, so malformed or
 * stale browser storage cannot enter component state.
 */
export const useSummaryStore = create<SummaryStore>()(
  persist(
    (set) => ({
      receipt: null,
      setReceipt: (receipt) => {
        const validatedReceipt = summaryReceiptSchema.parse(receipt)
        set({ receipt: validatedReceipt })
      },
      clearReceipt: () => set({ receipt: null }),
    }),
    {
      name: 'pos-summary-receipt',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ receipt }) => ({ receipt }),
      version: 1,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SummaryStore>
        return { ...currentState, receipt: readReceipt(persisted?.receipt) }
      },
    },
  ),
)
