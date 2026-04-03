/**
 * generator.js — Основной алгоритм генерации недельного рациона.
 *
 * Pipeline:
 * 1. Allergen hard-filter         (allergens.js)
 * 2. Taste preference filter      (dislikedIngredients)
 * 3. Time-Adaptive filter         (timeFilter.js)
 * 4. Calorie fitting              (pickRecipe с расширяющимся окном)
 * 5. Monotony control             (monotonyIndex.js — per-mealType)
 *
 * Возвращает план на 7 дней × 4 приёма пищи.
 *
 * FIXES (2026-04-03):
 * - monotonyIndex считается per-mealType (не глобально)
 * - pickRecipe имеет 3-уровневый fallback: сначала ±20%, потом ±35%, потом ближайший
 * - timeFilter имеет fallback: если пул пустеет — расширяет окно до ×1.5
 * - calories рецепта читается через recipe.nutrition.calories (не recipe.calories)
 */

import { filterSafeRecipes } from '../nutrition/allergens';
import { filterByTimeWindow, sortByBatchPriority } from './timeFilter';
import { canAddWithoutMonotony } from './monotonyIndex';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Распределение калорий по приёмам пищи (% от дневной нормы) */
const CALORIE_DISTRIBUTION = {
  breakfast: 0.25,
  lunch:     0.35,
  dinner:    0.28,
  snack:     0.12,
};

/**
 * Fisher-Yates shuffle для случайного перемешивания массива.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Преобразует рецепт в лёгкую ссылку для хранения в плане,
 * масштабируя БЖУ под целевые калории.
 */
function toRef(recipe, targetCal) {
  const baseCal = recipe.nutrition.calories;
  const multiplier = targetCal / baseCal;
  const safeMult = isNaN(multiplier) || !isFinite(multiplier) ? 1 : multiplier;

  return {
    id:          recipe.id,
    name:        recipe.name,
    calories:    Math.round(recipe.nutrition.calories * safeMult),
    protein:     Math.round(recipe.nutrition.protein * safeMult),
    fat:         Math.round(recipe.nutrition.fat * safeMult),
    carbs:       Math.round(recipe.nutrition.carbs * safeMult),
    cookTimeMin: recipe.cookTimeMin,
    imageEmoji:  recipe.imageEmoji ?? '🍽️',
    category:    recipe.category,
    tags:        recipe.tags ?? [],
    multiplier:  safeMult,
  };
}

/**
 * Выбирает лучший рецепт из пула для конкретного приёма пищи.
 *
 * 4-уровневый fallback, чтобы НИКОГДА не возвращать null при непустом пуле:
 *   1. Кандидаты в ±30% + ограничение монотонности
 *   2. Кандидаты в ±30% без ограничения монотонности
 *   3. Кандидаты в ±45% без ограничения монотонности
 *   4. Любой рецепт из пула (ближайший по калориям)
 *
 * @param {object[]} pool           — отфильтрованный пул рецептов нужной категории
 * @param {object[]} selectedSoFar  — уже выбранные ref во всём плане
 * @param {number}   targetCal      — целевые ккал для этого слота
 * @param {boolean}  allowRepeat
 * @param {string}   mealType       — 'breakfast'|'lunch'|'dinner'|'snack'
 * @returns {object}  RecipeRef (никогда не null при непустом пуле)
 */
function pickRecipe(pool, selectedSoFar, targetCal, allowRepeat, mealType) {
  if (pool.length === 0) return null;

  const shuffled = shuffle(pool);

  // Уровень 1: ±30% + монотонность (широкое окно для лучшего покрытия базы)
  const lvl1 = shuffled.filter((r) => {
    const cal = r.nutrition.calories;
    return cal >= targetCal * 0.70 && cal <= targetCal * 1.30 &&
           canAddWithoutMonotony(r.id, selectedSoFar, allowRepeat, mealType);
  });
  if (lvl1.length > 0) return toRef(lvl1[0], targetCal);

  // Уровень 2: ±30% без ограничения монотонности
  const lvl2 = shuffled.filter((r) => {
    const cal = r.nutrition.calories;
    return cal >= targetCal * 0.70 && cal <= targetCal * 1.30;
  });
  if (lvl2.length > 0) return toRef(lvl2[0], targetCal);

  // Уровень 3: расширяем окно до ±45%
  const lvl3 = shuffled.filter((r) => {
    const cal = r.nutrition.calories;
    return cal >= targetCal * 0.55 && cal <= targetCal * 1.45;
  });
  if (lvl3.length > 0) return toRef(lvl3[0], targetCal);

  // Уровень 4 (аварийный): берём ближайший по калориям из всего пула
  const closest = [...pool].sort((a, b) =>
    Math.abs(a.nutrition.calories - targetCal) - Math.abs(b.nutrition.calories - targetCal)
  );
  return toRef(closest[0], targetCal);
}

/**
 * Главная функция генерации рациона.
 *
 * @param {object[]} allRecipes     — полная база рецептов
 * @param {object}   profile        — профиль из useUserStore
 * @param {object}   nutrition      — { targetCalories, protein, fat, carbs }
 * @returns {object[]}              — план на 7 дней
 */
export function generatePlan(allRecipes, profile, nutrition) {
  const {
    allergens        = [],
    dietaryStyles    = [],
    dislikedIngredients = [],
    cookTimeWindows,
    cookFrequency,
    preferLazy,
    allowRepeatMeals,
  } = profile;

  const { targetCalories } = nutrition;

  // ── Шаг 1: Аллерген-фильтр ──
  let safeRecipes = filterSafeRecipes(allRecipes, allergens, dietaryStyles);

  // ── Шаг 2: Фильтр нелюбимых ингредиентов ──
  safeRecipes = safeRecipes.filter((recipe) =>
    !recipe.ingredients?.some((ing) => dislikedIngredients.includes(ing.id))
  );

  // ── Шаг 3: Времённой фильтр с fallback-расширением ──
  const baseFiltered = filterByTimeWindow(safeRecipes, cookTimeWindows, preferLazy);
  const baseSorted   = sortByBatchPriority(baseFiltered, cookFrequency);

  // Разбиваем по категориям с fallback-расширением
  const pools = {};
  for (const mealType of MEAL_TYPES) {
    let pool = baseSorted.filter((r) => r.category === mealType);

    // Fallback: если пул меньше 3 рецептов — ослабляем time-ограничение
    if (pool.length < 3) {
      const maxVal = Array.isArray(cookTimeWindows) ? Math.max(...cookTimeWindows) : (cookTimeWindows || 60);
      const fallbackWindow = Math.round(maxVal * 1.5);
      pool = filterByTimeWindow(
        safeRecipes.filter((r) => r.category === mealType),
        fallbackWindow,
        false // не применяем lazy-фильтр в fallback
      );
    }

    // Аварийный fallback: берём все безопасные рецепты этой категории
    if (pool.length === 0) {
      pool = safeRecipes.filter((r) => r.category === mealType);
    }

    pools[mealType] = sortByBatchPriority(pool, cookFrequency);
  }

  // ── Шаг 4: Генерация по дням ──
  const plan = [];
  // Ведём счётчик per-mealType раздельно для корректного контроля монотонности
  const selectedPerType = {
    breakfast: [],
    lunch:     [],
    dinner:    [],
    snack:     [],
  };

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const meals = {};

    for (const mealType of MEAL_TYPES) {
      const calorieTarget = Math.round(targetCalories * CALORIE_DISTRIBUTION[mealType]);

      const picked = pickRecipe(
        pools[mealType],
        selectedPerType[mealType], // передаём только список своего типа
        calorieTarget,
        allowRepeatMeals,
        mealType
      );

      meals[mealType] = picked;
      if (picked) selectedPerType[mealType].push(picked);
    }

    plan.push({
      dayIndex,
      dayLabel: DAY_LABELS[dayIndex],
      meals,
    });
  }

  return plan;
}
