import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useFavoritesStore — хранит список ID избранных рецептов.
 */
export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (id) => {
        set((state) => {
          const isFav = state.favorites.includes(id);
          if (isFav) {
            return { favorites: state.favorites.filter((favId) => favId !== id) };
          } else {
            return { favorites: [...state.favorites, id] };
          }
        });
      },

      isFavorite: (id) => {
        return get().favorites.includes(id);
      },
    }),
    {
      name: 'ane-favorites',
      partialize: (state) => ({
        favorites: state.favorites,
      }),
    }
  )
);
