import { create } from 'zustand'

type UiStore = {
  selectedPostId: number | null
  selectPost: (postId: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedPostId: null,
  selectPost: (selectedPostId) => set({ selectedPostId }),
}))
