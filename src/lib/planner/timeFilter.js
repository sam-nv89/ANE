/**
 * timeFilter.js — Module: Time-Adaptive.
 * Фильтрует рецепты по временно́му окну пользователя и предпочтению «ленивых» блюд.
 */

/**
 * Возвращает рецепты, исполнимые в заданное временно́е окно (или окна).
 * @param {object[]} recipes
 * @param {number|number[]} maxCookTimeMin  — из профиля (15 | 30 | 60 | 120)
 * @param {boolean}  preferLazy            — предпочитает ли пользователь «ленивые» блюда
 * @returns {object[]}
 */
export function filterByTimeWindow(recipes, maxCookTimeMin, preferLazy = false) {
  const maxVal = Array.isArray(maxCookTimeMin) 
    ? Math.max(...maxCookTimeMin) 
    : maxCookTimeMin;

  return recipes.filter((recipe) => {
    // Жёсткое ограничение по времени (берём максимальное из выбранных окон)
    if (recipe.cookTimeMin > maxVal) return false;

    // Пользователь предпочитает «ленивое» — в малом окне (<=30) 
    // отсеиваем не ленивые, если они требуют > 15 мин
    if (preferLazy && (maxVal || 0) <= 30 && !recipe.tags?.includes('lazy')) {
      return recipe.cookTimeMin <= 15;
    }

    return true;
  });
}

/**
 * Для batch-cook пользователей: повышает рейтинг рецептов,
 * которые можно приготовить заранее и хранить > 2 дней.
 * @param {object[]} recipes
 * @param {string}   cookFrequency  — 'batch' | 'daily' | 'alternate' | 'few'
 * @returns {object[]} — тот же массив, отсортированный по приоритету
 */
export function sortByBatchPriority(recipes, cookFrequency) {
  if (cookFrequency !== 'batch') return recipes;

  return [...recipes].sort((a, b) => {
    const aIsBatch = a.tags?.includes('batch-friendly') ? 1 : 0;
    const bIsBatch = b.tags?.includes('batch-friendly') ? 1 : 0;
    return bIsBatch - aIsBatch;
  });
}
