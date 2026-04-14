import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * useProgressStore — отслеживает вес и compliance за каждый день.
 */
export const useProgressStore = create(
  persist(
    immer((set) => ({
      weightLog: [],
      dailyCompliance: {},

      /** Добавить/обновить замер веса за указанную дату */
      logWeight: (weightKg, customDate) => {
        const date = customDate || new Date().toISOString().slice(0, 10);
        set((state) => {
          const index = state.weightLog.findIndex((e) => e.date === date);
          if (index >= 0) {
            state.weightLog[index].weightKg = weightKg;
          } else {
            state.weightLog.push({ date, weightKg });
          }
          state.weightLog.sort((a, b) => a.date.localeCompare(b.date));
        });
      },

      /** Обновить данные compliance */
      syncCompliance: (dailyData) => {
        set((state) => {
          Object.assign(state.dailyCompliance, dailyData);
        });
      },

      clearProgress: () => set({ weightLog: [], dailyCompliance: {} }),
    })),
    {
      name: 'ane-progress',
      partialize: (state) => ({
        weightLog: state.weightLog,
        dailyCompliance: state.dailyCompliance,
      }),
    }
  )
);

