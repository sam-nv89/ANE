import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Вспомогательная функция для "умного" форматирования количества.
 * Реализует логику ROUND UP для штук и RANGES (вилки) для веса.
 */
function formatSmartAmount(amount, unit) {
  const u = unit?.toLowerCase() || '';

  // 1. Штучные товары (яйца, фрукты, порции) - всегда Ceiling
  if (['шт', 'шт.', 'яйцо', 'яйца', 'яиц', 'банан', 'порция', 'зубчик'].includes(u)) {
    return Math.ceil(amount).toString();
  }

  // 2. Весовые и объемные (г, мл) - формируем вилку или округляем
  if (['г', 'г.', 'мл', 'мл.'].includes(u)) {
    if (amount % 50 === 0) return amount.toString();
    
    // Формируем вилку с шагом 50
    const min = Math.floor(amount / 50) * 50;
    const max = Math.ceil(amount / 50) * 50;
    
    // Если разница между значением и min очень маленькая (< 5), можно не давать вилку
    if (amount - min < 5) return min.toString();
    if (max - amount < 5) return max.toString();

    // Для маленьких весов ( < 50) просто показываем 50
    if (amount < 50) return '50';

    return `${min}–${max}`;
  }

  // 3. Ложки и прочее - округляем до 0.5
  return (Math.ceil(amount * 2) / 2).toString();
}

/**
 * useShoppingStore — агрегированный список покупок из недельного плана.
 * Обеспечивает Zero Waste: один и тот же ингредиент суммируется.
 */
export const useShoppingStore = create(
  persist(
    (set) => ({
      // items: Record<ingredientId, ShoppingItem>
      items: {},

      buildList: (plan, recipesDb) => {
        const aggregated = {};

        plan?.forEach((day) => {
          Object.values(day.meals).forEach((ref) => {
            if (!ref) return;
            const recipe = recipesDb.find((r) => r.id === ref.id);
            if (!recipe) return;

            recipe.ingredients.forEach((ing) => {
              const mult = ref.multiplier || 1;
              const scaledAmount = ing.amount * mult;
              if (aggregated[ing.id]) {
                aggregated[ing.id].rawAmount += scaledAmount;
              } else {
                aggregated[ing.id] = {
                  id: ing.id,
                  name: ing.name,
                  rawAmount: scaledAmount,
                  displayAmount: '', // будет заполнено в конце
                  unit: ing.unit,
                  category: ing.category ?? 'other',
                  checked: false,
                };
              }
            });
          });
        });

        // Финальное форматирование каждого элемента
        Object.keys(aggregated).forEach(id => {
          const item = aggregated[id];
          item.displayAmount = formatSmartAmount(item.rawAmount, item.unit);
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
