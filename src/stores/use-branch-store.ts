import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type BranchStore = {
  count: number
  increment: () => void
  decrement: () => void
}

const MIN_BRANCH = 1
const MAX_BRANCHES = 10

const normalizeCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(MAX_BRANCHES, Math.max(MIN_BRANCH, Math.floor(value)))
    : MIN_BRANCH

/**
 * Stores only the non-sensitive branch count. Persisted browser storage is
 * considered untrusted, so its value is normalized before it reaches state.
 */
export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      count: MIN_BRANCH,
      increment: () =>
        set((state) => ({ count: Math.min(MAX_BRANCHES, state.count + 1) })),
      decrement: () =>
        set((state) => ({ count: Math.max(MIN_BRANCH, state.count - 1) })),
    }),
    {
      name: 'pos-branch-count',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ count }) => ({ count }),
      version: 1,
      merge: (persistedState, currentState) => ({
        ...currentState,
        count: normalizeCount((persistedState as Partial<BranchStore>)?.count),
      }),
    },
  ),
)
