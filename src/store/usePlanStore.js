import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * usePlanStore — хранит сгенерированный недельный план питания.
 * plan[day][mealType] = Recipe | null
 */
export const usePlanStore = create(
  persist(
    (set) => ({
      // Недельный план: массив из 7 дней
      plan: null,
      isLoading: false,
      /*
        plan shape: Array (length 7) of:
        {
          dayIndex: 0-6,
          dayLabel: 'Пн' | 'Вт' | ...
          meals: {
            breakfast: RecipeRef | null,
            lunch:     RecipeRef | null,
            dinner:    RecipeRef | null,
            snack:     RecipeRef | null,
          },
          customMeals: [] // Array of { id, name, calories, protein, fat, carbs }
        }
        RecipeRef = { id, name, calories, protein, fat, carbs, cookTimeMin, imageEmoji }
      */

      // Отметки выполненных приёмов пищи: Set of "dayIndex:mealType"
      completed: [],

      // Дата последней генерации
      generatedAt: null,

      // Actions
      setLoading: (val) => set({ isLoading: val }),

      setPlan: (plan) =>
        set({ plan, generatedAt: new Date().toISOString(), completed: [], isLoading: false }),

      toggleCompleted: (dayIndex, mealType) => {
        const key = `${dayIndex}:${mealType}`;
        set((state) => {
          const set_ = new Set(state.completed);
          set_.has(key) ? set_.delete(key) : set_.add(key);
          return { completed: Array.from(set_) };
        });
      },

      replaceMeal: (dayIndex, mealType, newRecipeRef) =>
        set((state) => {
          const plan = state.plan.map((day, i) =>
            i === dayIndex
              ? { ...day, meals: { ...day.meals, [mealType]: newRecipeRef } }
              : day
          );
          return { plan };
        }),

      addCustomMeal: (dayIndex, meal) =>
        set((state) => {
          const plan = state.plan.map((day, i) =>
            i === dayIndex
              ? { ...day, customMeals: [...(day.customMeals || []), { ...meal, id: `custom-${Date.now()}` }] }
              : day
          );
          return { plan };
        }),

      removeCustomMeal: (dayIndex, customMealId) =>
        set((state) => {
          const plan = state.plan.map((day, i) =>
            i === dayIndex
              ? { ...day, customMeals: (day.customMeals || []).filter(m => m.id !== customMealId) }
              : day
          );
          return { plan };
        }),

      clearPlan: () => set({ plan: null, completed: [], generatedAt: null }),
    }),
    {
      name: 'ane-plan',
      partialize: (state) => ({
        plan: state.plan,
        completed: state.completed,
        generatedAt: state.generatedAt,
      }),
    }
  )
);
