import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CheckoutOrder, SalesCount } from '../utils/order'

export type OrderItem = CheckoutOrder

type OrderStore = {
  orders: OrderItem[]
  isGcashPayment: boolean
  selectedFlavorBySize: Record<string, string | undefined>
  salesCount: SalesCount | null
  setGcashPayment: (isGcashPayment: boolean) => void
  selectFlavor: (size: string, flavor: string) => void
  addOrder: (order: OrderItem) => void
  removeOrder: (size: string) => void
  clearOrders: () => void
  setSalesCount: (salesCount: SalesCount) => void
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      isGcashPayment: false,
      selectedFlavorBySize: {},
      salesCount: null,
      setGcashPayment: (isGcashPayment) => set((state) => ({
        isGcashPayment,
        orders: state.orders.map((order) => {
          if (isGcashPayment) return { ...order, payment_method: 'gcash' }

          const orderWithoutPaymentMethod = { ...order }
          delete orderWithoutPaymentMethod.payment_method
          return orderWithoutPaymentMethod
        }),
      })),
      selectFlavor: (size, flavor) => set((state) => ({
        selectedFlavorBySize: {
          ...state.selectedFlavorBySize,
          [size]: flavor,
        },
      })),
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      removeOrder: (size) => set((state) => {
        const orderIndex = state.orders.findLastIndex(
          (order) => order.size === size,
        )

        if (orderIndex === -1) return state

        return { orders: state.orders.filter((_, index) => index !== orderIndex) }
      }),
      clearOrders: () => set({ orders: [], selectedFlavorBySize: {} }),
      setSalesCount: (salesCount) => set({ salesCount }),
    }),
    {
      name: 'pos-orders',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
