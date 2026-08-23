import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { loginResponseSchema, type LoginResponse } from '../utils/login'

type LoginStore = {
  loginResponse: LoginResponse | null
  reconciliation: ReconciliationValues | null
  setLoginResponse: (loginResponse: LoginResponse) => void
  adjustReconciliation: (field: keyof ReconciliationValues, amount: number) => void
  clearLoginResponse: () => void
}

export type ReconciliationValues = {
  openingPotatoes: number
  smallCups: number
  mediumCups: number
  largeCups: number
}

const readLoginResponse = (value: unknown): LoginResponse | null => {
  const result = loginResponseSchema.safeParse(value)
  return result.success ? result.data : null
}

const createReconciliationValues = (loginResponse: LoginResponse): ReconciliationValues => ({
  openingPotatoes: loginResponse.stores_default.opening_potatoes,
  smallCups: loginResponse.stores_default.small_cups,
  mediumCups: loginResponse.stores_default.medium_cups,
  largeCups: loginResponse.stores_default.large_cups,
})

const readReconciliationValues = (value: unknown): ReconciliationValues | null => {
  if (!value || typeof value !== 'object') return null

  const fields: (keyof ReconciliationValues)[] = ['openingPotatoes', 'smallCups', 'mediumCups', 'largeCups']
  const values = value as Partial<ReconciliationValues>

  if (!fields.every((field) => typeof values[field] === 'number' && Number.isFinite(values[field]) && values[field]! >= 0)) {
    return null
  }

  return values as ReconciliationValues
}

/**
 * Keeps the non-credential data returned by a successful login available after
 * navigation or a browser refresh. The API session itself remains in its
 * HTTP-only cookie; no password or token is stored here.
 */
export const useLoginStore = create<LoginStore>()(
  persist(
    (set) => ({
      loginResponse: null,
      reconciliation: null,
      // Every new successful login starts a new reconciliation from the
      // server-provided store defaults.
      setLoginResponse: (loginResponse) => set({
        loginResponse,
        reconciliation: createReconciliationValues(loginResponse),
      }),
      adjustReconciliation: (field, amount) => set((state) => {
        if (!state.reconciliation || !Number.isFinite(amount)) return state

        return {
          reconciliation: {
            ...state.reconciliation,
            [field]: Math.max(0, state.reconciliation[field] + amount),
          },
        }
      }),
      clearLoginResponse: () => set({ loginResponse: null, reconciliation: null }),
    }),
    {
      name: 'pos-login-response',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ loginResponse, reconciliation }) => ({ loginResponse, reconciliation }),
      version: 2,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LoginStore>
        const loginResponse = readLoginResponse(persisted?.loginResponse)
        const reconciliation = readReconciliationValues(persisted?.reconciliation)

        return {
          ...currentState,
          loginResponse,
          // Seed existing persisted login responses once, so data saved by the
          // previous store version also receives reconciliation values.
          reconciliation: reconciliation ?? (loginResponse ? createReconciliationValues(loginResponse) : null),
        }
      },
    },
  ),
)
