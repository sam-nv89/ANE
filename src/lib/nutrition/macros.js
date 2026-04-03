/**
 * macros.js — Распределение макронутриентов по цели.
 *
 * Пропорции основаны на рекомендациях ISSN (International Society
 * of Sports Nutrition) и ВОЗ:
 *   - Похудение: высокий белок (сохранение мышц), умеренные углеводы
 *   - Поддержание: сбалансированное соотношение
 *   - Набор: увеличенные углеводы для анаболического фона
 */

/** г белка / кг веса тела по цели */
const PROTEIN_PER_KG = {
  lose:     2.0, // высокий белок при дефиците
  maintain: 1.6,
  gain:     1.8,
};

/** Доля жиров от общих калорий */
const FAT_RATIO = {
  lose:     0.25,
  maintain: 0.30,
  gain:     0.25,
};

/**
 * Рассчитывает граммы БЖУ на день.
 * @param {number} targetCalories
 * @param {number} weightKg
 * @param {'lose'|'maintain'|'gain'} goal
 * @returns {{ protein: number, fat: number, carbs: number }}
 */
export function calcMacros(targetCalories, weightKg, goal) {
  // Белок: г по весу тела
  const protein = Math.round(weightKg * (PROTEIN_PER_KG[goal] ?? 1.6));

  // Жиры: процент от общей калорийности (1г жира = 9 ккал)
  const fat = Math.round((targetCalories * (FAT_RATIO[goal] ?? 0.30)) / 9);

  // Углеводы: остаток (1г белка/углеводов = 4 ккал)
  const usedCalories = protein * 4 + fat * 9;
  const carbs = Math.max(Math.round((targetCalories - usedCalories) / 4), 50);

  return { protein, fat, carbs };
}
