import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useShoppingStore — агрегированный список покупок из недельного плана.
 * Обеспечивает Zero Waste: один и тот же ингредиент суммируется.
 */
export const useShoppingStore = create(
  persist(
    (set, get) => ({
      // items: Record<ingredientId, ShoppingItem>
      items: {},
      /*
        ShoppingItem:
        {
          id: string,
          name: string,
          totalAmount: number,
          unit: string,
          category: 'vegetables' | 'protein' | 'dairy' | 'grains' | 'other',
          checked: boolean,
        }
      */

      // Actions
      buildList: (plan, recipesDb) => {
        const aggregated = {};

        plan?.forEach((day) => {
          Object.values(day.meals).forEach((ref) => {
            if (!ref) return;
            const recipe = recipesDb.find((r) => r.id === ref.id);
            if (!recipe) return;

            recipe.ingredients.forEach((ing) => {
              if (aggregated[ing.id]) {
                aggregated[ing.id].totalAmount += ing.amount;
              } else {
                aggregated[ing.id] = {
                  id: ing.id,
                  name: ing.name,
                  totalAmount: ing.amount,
                  unit: ing.unit,
                  category: ing.category ?? 'other',
                  checked: false,
                };
              }
            });
          });
        });

        set({ items: aggregated });
      },

      toggleItem: (id) =>
        set((state) => ({
          items: {
            ...state.items,
            [id]: { ...state.items[id], checked: !state.items[id].checked },
          },
        })),

      clearList: () => set({ items: {} }),
    }),
    {
      name: 'ane-shopping',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
