import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * useUserStore — хранит профиль пользователя и рассчитанные КБЖУ.
 */
export const useUserStore = create(
  persist(
    immer((set) => ({
      profileComplete: false,
      profile: null,
      nutrition: null,

      setProfile: (data) => set({ profile: data }),

      setNutrition: (data) => set({ nutrition: data }),

      completeOnboarding: (profileData, nutritionData) =>
        set({
          profile: profileData,
          nutrition: nutritionData,
          profileComplete: true,
        }),

      updateProfile: (partial) =>
        set((state) => {
          if (state.profile) {
            Object.assign(state.profile, partial);
          }
        }),

      resetProfile: () =>
        set({ profile: null, nutrition: null, profileComplete: false }),
    })),
    {
      name: 'ane-user',
      partialize: (state) => ({
        profileComplete: state.profileComplete,
        profile: state.profile,
        nutrition: state.nutrition,
      }),
    }
  )
);

