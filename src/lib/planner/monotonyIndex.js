/**
 * monotonyIndex.js — Module: Psychological Comfort.
 * Управляет разнообразием рациона через индекс монотонности.
 *
 * FIX: noRepeat теперь = 2 (не 1). Значение 1 означало: каждую неделю 7 уникальных
 * рецептов на каждый приём — невозможно при базе в 8 завтраков и 10 обедов,
 * а тем более после time-фильтра. Реалистичный минимум: 2 раза за 7 дней.
 */

/**
 * Максимальная частота появления одного блюда в неделе.
 */
const MAX_APPEARANCES = {
  allowRepeat: 3, // можно повторять: до 3 раз за 7 дней
  noRepeat:    2, // «без повторений» на практике: не более 2 раз за неделю
};

/**
 * Проверяет, можно ли добавить рецепт в план без нарушения индекса монотонности.
 * Подсчёт ведётся ТОЛЬКО среди рецептов того же mealType, чтобы один обед
 * не мешал завтракам.
 *
 * @param {string}   recipeId
 * @param {object[]} currentPlan      — уже выбранные RecipeRef[]
 * @param {boolean}  allowRepeatMeals
 * @param {string}   [mealType]       — 'breakfast'|'lunch'|'dinner'|'snack'
 * @returns {boolean}
 */
export function canAddWithoutMonotony(recipeId, currentPlan, allowRepeatMeals, mealType) {
  const maxCount = allowRepeatMeals
    ? MAX_APPEARANCES.allowRepeat
    : MAX_APPEARANCES.noRepeat;

  // Фильтруем только по той же категории (если категория передана)
  const relevantPlan = mealType
    ? currentPlan.filter((ref) => ref?.category === mealType)
    : currentPlan;

  const currentCount = relevantPlan.filter((ref) => ref?.id === recipeId).length;
  return currentCount < maxCount;
}

/**
 * Вычисляет «score монотонности» плана (0–1, меньше = разнообразнее).
 * Используется для аналитики и отображения на dashboard.
 * @param {object[]} planRefs  — все RecipeRef из плана
 * @returns {number}
 */
export function calcMonotonyScore(planRefs) {
  const nonNull = planRefs.filter(Boolean);
  if (nonNull.length === 0) return 0;

  const counts = {};
  nonNull.forEach(({ id }) => {
    counts[id] = (counts[id] ?? 0) + 1;
  });

  const uniqueRatio = Object.keys(counts).length / nonNull.length;
  return parseFloat((1 - uniqueRatio).toFixed(2));
}
