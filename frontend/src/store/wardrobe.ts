import { create } from 'zustand'
import { api } from '../utils/api'

interface Item {
  id: number
  name: string
  category: string
  subcategory?: string
  color_primary: string
  color_secondary?: string
  pattern: string
  style_tags: string[]
  season: string[]
  image_path?: string
  times_worn: number
  last_worn?: string | null
  is_active: boolean
}

interface WardrobeState {
  items: Item[]
  loading: boolean
  uploading: boolean
  fetch: () => Promise<void>
  upload: (file: File, categoryKey: string, colorOverride?: string) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  loading: false,
  uploading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const items = await api.getItems()
      set({ items })
    } finally {
      set({ loading: false })
    }
  },

  upload: async (file, categoryKey, colorOverride?) => {
    set({ uploading: true })
    try {
      await api.uploadItem(file, categoryKey, colorOverride)
      await get().fetch()
    } finally {
      set({ uploading: false })
    }
  },

  remove: async (id) => {
    await api.deleteItem(id)
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
  },
}))
