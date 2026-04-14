import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * usePlanStore — хранит сгенерированный недельный план питания.
 */
export const usePlanStore = create(
  persist(
    immer((set, get) => ({
      plan: null,
      completed: [],
      generatedAt: null,

      setPlan: (plan) =>
        set({ plan, generatedAt: new Date().toISOString(), completed: [] }),

      toggleCompleted: (dayIndex, mealType) => {
        const key = `${dayIndex}:${mealType}`;
        set((state) => {
          const idx = state.completed.indexOf(key);
          if (idx > -1) {
            state.completed.splice(idx, 1);
          } else {
            state.completed.push(key);
          }
        });
      },

      replaceMeal: (dayIndex, mealType, newRecipeRef) =>
        set((state) => {
          if (state.plan?.[dayIndex]) {
            state.plan[dayIndex].meals[mealType] = newRecipeRef;
          }
        }),

      addCustomMeal: (dayIndex, meal) =>
        set((state) => {
          if (state.plan?.[dayIndex]) {
            if (!state.plan[dayIndex].customMeals) state.plan[dayIndex].customMeals = [];
            state.plan[dayIndex].customMeals.push({ ...meal, id: `custom-${Date.now()}` });
          }
        }),

      removeCustomMeal: (dayIndex, customMealId) =>
        set((state) => {
          if (state.plan?.[dayIndex]) {
            state.plan[dayIndex].customMeals = (state.plan[dayIndex].customMeals || []).filter(m => m.id !== customMealId);
          }
        }),

      clearPlan: () => set({ plan: null, completed: [], generatedAt: null }),
    })),
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

