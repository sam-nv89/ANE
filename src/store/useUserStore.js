import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useUserStore — хранит профиль пользователя и рассчитанные КБЖУ.
 * Персистентность через localStorage (ключ 'ane-user').
 */
export const useUserStore = create(
  persist(
    (set) => ({
      // Флаг завершения онбординга
      profileComplete: false,

      // Данные профиля
      profile: null,
      /*
        profile shape:
        {
          name: string,
          age: number,
          gender: 'male' | 'female',
          heightCm: number,
          weightKg: number,
          activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive',
          goal: 'lose' | 'maintain' | 'gain',
          goalLabel: string,
          goalRate: number,          // кг/неделю (отриц. для похудения)
          cookTimeWindow: 15 | 30 | 60 | 120,  // минут
          cookFrequency: 'daily' | 'alternate' | 'few' | 'batch',
          preferLazy: boolean,
          tasteCategories: string[], // ['meat', 'fish', 'poultry', 'vegetarian']
          dislikedIngredients: string[],
          allowRepeatMeals: boolean,
          allergens: string[],
          medicalRestrictions: string[],
          dietaryStyles: string[],
        }
      */

      // Рассчитанные показатели (заполняются на SummaryStep)
      nutrition: null,
      /*
        nutrition shape:
        {
          bmr: number,       // базовый обмен (ккал)
          tdee: number,      // с учётом активности
          targetCalories: number,
          protein: number,   // г/день
          fat: number,
          carbs: number,
        }
      */

      // Actions
      setProfile: (data) => set({ profile: data }),

      setNutrition: (data) => set({ nutrition: data }),

      completeOnboarding: (profileData, nutritionData) =>
        set({
          profile: profileData,
          nutrition: nutritionData,
          profileComplete: true,
        }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: { ...state.profile, ...partial },
        })),

      resetProfile: () =>
        set({ profile: null, nutrition: null, profileComplete: false }),
    }),
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
