/**
 * distribution.js — Единая логика распределения калорий по приемам пищи.
 * Используется генератором и страницей деталей (MealDetail) для синхронизации масштабирования.
 */

export const MEAL_WEIGHTS = {
  breakfast: 0.25,
  lunch:     0.35,
  dinner:    0.28,
  snack:     0.12,
  snack2:    0.10,
  snack3:    0.10,
  snack4:    0.10,
};

/**
 * Рассчитывает веса (коэффициенты) для каждого приема пищи на основе частоты питания и предпочтений.
 * 
 * @param {number} mealFrequency - Количетво приемов (от 3 до 7)
 * @param {string[]} mealSpecifics - Доп. настройки (heavy-breakfast, light-dinner, no-breakfast, no-dinner)
 * @returns {object} { distribution: { mealType: weight }, types: string[] }
 */
export function getCalorieDistribution(mealFrequency = 3, mealSpecifics = []) {
  // Базовый набор типов
  let currentMealTypes = ['breakfast', 'lunch', 'dinner'];
  if (mealFrequency >= 4) currentMealTypes.push('snack2');
  if (mealFrequency >= 5) currentMealTypes.push('snack');
  if (mealFrequency >= 6) currentMealTypes.push('snack3');
  if (mealFrequency >= 7) currentMealTypes.push('snack4');

  // Сортировка по времени (DEFAULT_ORDER)
  const order = ['breakfast', 'snack', 'lunch', 'snack2', 'snack3', 'dinner', 'snack4'];
  currentMealTypes.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  // Исключения
  if (mealSpecifics.includes('no-breakfast')) {
    currentMealTypes = currentMealTypes.filter(m => m !== 'breakfast');
  }
  if (mealSpecifics.includes('no-dinner')) {
    currentMealTypes = currentMealTypes.filter(m => m !== 'dinner');
  }

  // Расчет весов
  const weights = { ...MEAL_WEIGHTS };
  if (mealSpecifics.includes('heavy-breakfast')) weights.breakfast = 0.35;
  if (mealSpecifics.includes('light-dinner'))    weights.dinner = 0.15;

  // Нормализация
  const totalWeight = currentMealTypes.reduce((sum, m) => sum + (weights[m] || 0.1), 0);
  
  const distribution = {};
  currentMealTypes.forEach(m => {
    distribution[m] = (weights[m] || 0.1) / totalWeight;
  });

  return { 
    distribution, 
    types: currentMealTypes 
  };
}
