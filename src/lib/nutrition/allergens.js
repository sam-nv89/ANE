/**
 * allergens.js — Жёсткий фильтр аллергенов и медицинских ограничений.
 *
 * Логика: рецепт исключается, если ПО КРАЙНЕЙ МЕРЕ ОДИН его аллерген
 * присутствует в профиле пользователя. Никаких компромиссов.
 */

/**
 * Проверяет, безопасен ли рецепт для пользователя.
 * @param {object} recipe
 * @param {string[]} userAllergens  — из профиля
 * @param {string[]} userDietary    — диетические стили
 * @returns {boolean}
 */
export function isSafeForUser(recipe, userAllergens = [], userDietary = []) {
  // 1. Проверка аллергенов
  if (recipe.allergens?.some((a) => userAllergens.includes(a))) {
    return false;
  }

  // 2. Проверка диетических стилей
  if (userDietary.includes('vegetarian') && recipe.tags?.includes('meat')) {
    return false;
  }
  if (userDietary.includes('vegan') && recipe.tags?.includes('animal-product')) {
    return false;
  }
  if (userDietary.includes('keto') && (recipe.nutrition?.carbs ?? 0) > 15) {
    return false;
  }
  if (userDietary.includes('halal') && recipe.tags?.includes('pork')) {
    return false;
  }

  return true;
}

/**
 * Фильтрует массив рецептов по профилю пользователя.
 * @param {object[]} recipes
 * @param {string[]} userAllergens
 * @param {string[]} userDietary
 * @returns {object[]}
 */
export function filterSafeRecipes(recipes, userAllergens, userDietary) {
  return recipes.filter((r) => isSafeForUser(r, userAllergens, userDietary));
}
