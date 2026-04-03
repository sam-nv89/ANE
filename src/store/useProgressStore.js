import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useProgressStore — отслеживает вес и compliance за каждый день.
 */
export const useProgressStore = create(
  persist(
    (set, get) => ({
      // weightLog: Array<{ date: ISO string, weightKg: number }>
      weightLog: [],

      // dailyCompliance: Record<dateStr, { planned: number, done: number }>
      dailyCompliance: {},

      // Actions

      /** Добавить/обновить замер веса за сегодня */
      logWeight: (weightKg) => {
        const date = new Date().toISOString().slice(0, 10);
        set((state) => {
          const existing = state.weightLog.findIndex((e) => e.date === date);
          if (existing >= 0) {
            const updated = [...state.weightLog];
            updated[existing] = { date, weightKg };
            return { weightLog: updated };
          }
          return { weightLog: [...state.weightLog, { date, weightKg }] };
        });
      },

      /** Пересчитать compliance на основе плана и отметок выполнения */
      syncCompliance: (plan, completedKeys) => {
        const date = new Date().toISOString().slice(0, 10);
        const totalMeals = plan?.reduce(
          (acc, day) => acc + Object.values(day.meals).filter(Boolean).length,
          0
        ) ?? 0;
        const done = completedKeys.length;

        set((state) => ({
          dailyCompliance: {
            ...state.dailyCompliance,
            [date]: { planned: totalMeals, done },
          },
        }));
      },

      clearProgress: () => set({ weightLog: [], dailyCompliance: {} }),
    }),
    {
      name: 'ane-progress',
      partialize: (state) => ({
        weightLog: state.weightLog,
        dailyCompliance: state.dailyCompliance,
      }),
    }
  )
);
