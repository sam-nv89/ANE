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
  const exactMult = targetCal / baseCal;
  // Округляем до ближайших 0.05 для создания естественной вариативности (чтобы не было одинаковых цифр)
  const snappedMult = Math.round(exactMult * 20) / 20;
  const safeMult = isNaN(snappedMult) || !isFinite(snappedMult) ? 1 : Math.max(0.05, snappedMult);

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

  // Уровень 1: Адекватный скейлинг (к-т от 0.4 до 3.0) + контроль монотонности
  const lvl1 = shuffled.filter((r) => {
    const mult = targetCal / r.nutrition.calories;
    return mult >= 0.4 && mult <= 3.0 && canAddWithoutMonotony(r.id, selectedSoFar, allowRepeat, mealType);
  });
  if (lvl1.length > 0) return toRef(lvl1[0], targetCal);

  // Уровень 2: Закрываем глаза на монотонность, но держим скейлинг в рамках
  const lvl2 = shuffled.filter((r) => {
    const mult = targetCal / r.nutrition.calories;
    return mult >= 0.3 && mult <= 4.0;
  });
  if (lvl2.length > 0) return toRef(lvl2[0], targetCal);

  // Уровень 3: Если и это не помогло (например, гигантская калорийность), берем просто с контролем монотонности
  const lvl3 = shuffled.filter((r) => canAddWithoutMonotony(r.id, selectedSoFar, allowRepeat, mealType));
  if (lvl3.length > 0) return toRef(lvl3[0], targetCal);

  // Уровень 4 (аварийный): берём любой ближайший
  const closest = [...pool].sort((a, b) =>
    Math.abs(a.nutrition.calories - targetCal) - Math.abs(b.nutrition.calories - targetCal)
  );
  return toRef(closest[0], targetCal);
}

const INGREDIENT_KEYWORDS = {
  // Proteins (Meat, Poultry, Fish)
  beef: ['говяж', 'говядин'],
  pork: ['свин'],
  lamb: ['баран'],
  chicken: ['кури', 'цыплен'],
  turkey: ['индейк'],
  fish: ['тун', 'лосось', 'треск', 'тиляпи', 'рыб', 'минтай'],
  seafood: ['креветк', 'кальмар', 'морепродукт', 'миди'],
  // Veggies - Корнеплоды
  carrot: ['морков'],
  beet: ['свёкл', 'свекл'],
  radish: ['редис', 'редьк'],
  turnip: ['реп'],
  parsnip: ['пастернак'],
  potato: ['картоф', 'батат'],
  
  // Veggies - Луковичные
  onion: ['лук'],
  garlic: ['чеснок'],
  leek: ['порей'],

  // Veggies - Капустные
  cabbage: ['капуст'],
  broccoli: ['брокколи'],
  cauliflower: ['цветная капуста'],
  'brussels-sprouts': ['брюссельск'],

  // Veggies - Паслёновые
  tomato: ['помидор', 'томат'],
  eggplant: ['баклажан'],
  'bell-pepper': ['перец болг', 'паприк'],

  // Veggies - Тыквенные
  cucumber: ['огурец', 'огурц'],
  zucchini: ['кабачок', 'цукини'],
  pumpkin: ['тыкв'],

  // Veggies - Листовые
  lettuce: ['салат'],
  spinach: ['шпинат'],
  arugula: ['руккол'],

  // Фрукты - Семечковые
  apple: ['яблок'],
  pear: ['груш'],
  quince: ['айв'],

  // Фрукты - Косточковые
  cherry: ['вишн', 'черешн'],
  peach: ['персик'],
  apricot: ['абрикос'],
  plum: ['слив'],

  // Фрукты - Цитрусовые
  orange: ['апельсин'],
  lemon: ['лимон'],
  mandarin: ['мандарин'],
  grapefruit: ['грейпфрут'],

  // Фрукты - Экзотические
  banana: ['банан'],
  mango: ['манго'],
  pineapple: ['ананас'],
  kiwi: ['киви'],
  papaya: ['папай'],

  // Ягоды
  strawberry: ['клубник', 'земляник'],
  raspberry: ['малин'],
  blueberry: ['черник', 'голубик'],
  currant: ['смородин'],
  // Dairy & Eggs
  cheese: ['сыр'],
  'cottage-cheese': ['творог'],
  yogurt: ['йогурт'],
  kefir: ['кефир', 'ряженк'],
  milk: ['молоко', 'сливк'],
  eggs: ['яйц', 'яйцо'],
  
  // Grains & Pasta
  pasta: ['паста', 'макарон', 'лапша', 'удон', 'соба'],
  buckwheat: ['гречк'],
  rice: ['рис'],
  oats: ['овсян', 'геркулес'],
  quinoa: ['киноа', 'кеноа'],
  wheat: ['булгур', 'кускус', 'манка', 'пшеничн'],
  barley: ['перлов', 'ячнев'],
  corn: ['кукуруз'],
  millet: ['пшен'],
  bread: ['хлеб', 'лаваш', 'булочк', 'батон'],

  // Legumes
  lentil: ['чечевиц'],
  pea: ['горох', 'горошек'],
  chickpea: ['нут'],
  beans: ['фасол']
};

function getUnselectedKeywords(selectedKeys, allKeys) {
  const unselected = allKeys.filter(k => !selectedKeys.includes(k));
  return unselected.flatMap(k => INGREDIENT_KEYWORDS[k] || []);
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
    dislikedFreeText = [],
    cookTimeWindows,
    cookFrequency,
    preferLazy,
    allowRepeatMeals,
    likedProteins,
    likedVeg,
    likedDairy,
    likedGrains
  } = profile;

  const { targetCalories } = nutrition;

  // ── Шаг 1: Аллерген-фильтр ──
  let safeRecipes = filterSafeRecipes(allRecipes, allergens, dietaryStyles);

  // ── Шаг 2: Фильтр нелюбимых ингредиентов ──
  const PROTEIN_KEYS = ['beef', 'pork', 'lamb', 'chicken', 'turkey', 'fish', 'seafood'];
  const VEG_KEYS     = ['tomato', 'cucumber', 'zucchini', 'broccoli', 'carrot', 'onion', 'potato', 'spinach', 'pumpkin', 'cabbage', 'bell-pepper', 'eggplant', 'garlic', 'mushrooms', 'apple', 'banana', 'citrus', 'berries', 'peach', 'beet', 'radish', 'turnip', 'parsnip', 'leek', 'cauliflower', 'brussels-sprouts', 'lettuce', 'arugula', 'pear', 'quince', 'cherry', 'apricot', 'plum', 'orange', 'lemon', 'mandarin', 'grapefruit', 'mango', 'pineapple', 'kiwi', 'papaya', 'strawberry', 'raspberry', 'blueberry', 'currant'];
  const DAIRY_KEYS   = ['cheese', 'cottage-cheese', 'yogurt', 'kefir', 'milk', 'eggs'];
  const GRAIN_KEYS   = ['pasta', 'buckwheat', 'rice', 'oats', 'quinoa', 'wheat', 'barley', 'corn', 'millet', 'bread', 'lentil', 'pea', 'chickpea', 'beans'];

  const rejectedKeywords = [
    ...getUnselectedKeywords(likedProteins || PROTEIN_KEYS, PROTEIN_KEYS),
    ...getUnselectedKeywords(likedVeg || VEG_KEYS, VEG_KEYS),
    ...getUnselectedKeywords(likedDairy || DAIRY_KEYS, DAIRY_KEYS),
    ...getUnselectedKeywords(likedGrains || GRAIN_KEYS, GRAIN_KEYS),
  ];

  safeRecipes = safeRecipes.filter((recipe) => {
    // Жёсткие ID (старая логика)
    if (recipe.ingredients?.some((ing) => dislikedIngredients.includes(ing.id))) return false;
    
    // Свободный ввод (новая логика)
    if (dislikedFreeText.length > 0) {
      const texts = dislikedFreeText.map(t => t.toLowerCase());
      const hasDislikedText = recipe.ingredients?.some(ing => 
        texts.some(disliked => ing.name.toLowerCase().includes(disliked))
      );
      if (hasDislikedText) return false;
    }

    // Новая логика: отсеиваем жестко по невыбранным макро-категориям
    if (rejectedKeywords.length > 0) {
      const hasRejectedCategory = recipe.ingredients?.some(ing => {
        const ingNameLower = ing.name.toLowerCase();
        return rejectedKeywords.some(rejWord => ingNameLower.includes(rejWord));
      });
      if (hasRejectedCategory) return false;
    }
    
    return true;
  });

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
