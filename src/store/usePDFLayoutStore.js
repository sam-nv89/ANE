import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store to manage the layout of elements in the PDF constructor.
 * Stores X, Y, and visibility status for each layout block.
 */
export const usePDFLayoutStore = create(
  persist(
    (set) => ({
      layouts: {}, // { elementId: { x, y, width, height } }
      
      updateLayout: (id, layout) => set((state) => ({
        layouts: {
          ...state.layouts,
          [id]: { ...state.layouts[id], ...layout }
        }
      })),

      setLayouts: (newLayouts) => set({ layouts: newLayouts }),

      resetLayouts: () => set({ layouts: {} }),
    }),
    {
      name: 'pdf-layout-storage',
      onRehydrateStorage: () => (state) => {
        state._hasHydrated = true;
      }
    }
  )
);
