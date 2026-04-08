import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useProgressStore — отслеживает вес и compliance за каждый день.
 */
export const useProgressStore = create(
  persist(
    (set) => ({
      // weightLog: Array<{ date: ISO string, weightKg: number }>
      weightLog: [],

      // dailyCompliance: Record<dateStr, { planned: number, done: number }>
      dailyCompliance: {},

      // Actions

      /** Добавить/обновить замер веса за указанную дату */
      logWeight: (weightKg, customDate) => {
        const date = customDate || new Date().toISOString().slice(0, 10);
        set((state) => {
          const existing = state.weightLog.findIndex((e) => e.date === date);
          let newLog;
          if (existing >= 0) {
            newLog = [...state.weightLog];
            newLog[existing] = { date, weightKg };
          } else {
            newLog = [...state.weightLog, { date, weightKg }];
          }
          
          // Сортируем по дате, чтобы график и список были корректными
          newLog.sort((a, b) => a.date.localeCompare(b.date));
          
          return { weightLog: newLog };
        });
      },

      /** Обновить данные compliance из внешнего источника (например, после маппинга плана на даты) */
      syncCompliance: (dailyData) => {
        set((state) => ({
          dailyCompliance: {
            ...state.dailyCompliance,
            ...dailyData,
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
