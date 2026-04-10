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
import { getCalorieDistribution } from '../nutrition/distribution';
import { getCyclePhase, getPhaseModifiers } from '../nutrition/cycleSync';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

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
 * Перемешивает массив, но дает приоритет рецептам с нужными тегами (Cycle Syncing).
 */
function shuffleAndBoost(arr, boostedTags) {
  const shuffled = shuffle(arr);
  if (!boostedTags || boostedTags.length === 0) return shuffled;

  return shuffled.sort((a, b) => {
    const aTags = a.microTags || a.tags || [];
    const bTags = b.microTags || b.tags || [];
    const aBoost = aTags.filter(t => boostedTags.includes(t)).length;
    const bBoost = bTags.filter(t => boostedTags.includes(t)).length;
    return bBoost - aBoost;
  });
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
    targetCal:   Math.round(targetCal),
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
 * @param {string[]} boostedTags    — префреренс по микронутриентам
 * @returns {object}  RecipeRef (никогда не null при непустом пуле)
 */
function pickRecipe(pool, selectedSoFar, targetCal, allowRepeat, mealType, boostedTags = []) {
  if (pool.length === 0) return null;

  const shuffled = shuffleAndBoost(pool, boostedTags);

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

  // Nuts, Seeds & Superfoods
  walnuts:     ['грецк', 'орех'],
  cashews:     ['кешью'],
  almonds:     ['миндаль'],
  seeds:       ['семена', 'семечки'],
  'dried-fruits': ['курага', 'изюм', 'чернослив', 'сухофрукт', 'финик'],
  pistachios:  ['фисташки'],
  hazelnuts:   ['фундук'],
  chia:        ['чиа'],
  flax:        ['льн', 'льнян'],
  'quinoa-veg': ['киноа', 'кеноа'],

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

/**
 * Helper: возвращает список ключевых слов для тех категорий, которые пользователь НЕ выбрал.
 */
function getUnselectedKeywords(selectedKeys, allKeys) {
  const unselected = allKeys.filter(k => !selectedKeys.includes(k));
  return unselected.flatMap(k => INGREDIENT_KEYWORDS[k] || []);
}

/**
 * Фильтрует базу рецептов на основе всех предпочтений и ограничений профиля.
 */
function filterRecipesForProfile(allRecipes, profile) {
  if (!profile) return allRecipes;
  const {
    allergens = [],
    dietaryStyles = [],
    dislikedIngredients = [],
    excludedIngredientsFreeText = '',
    likedProteins,
    likedVeg,
    likedDairy,
    likedGrains
  } = profile;

  // 1. Аллергены
  let recipes = filterSafeRecipes(allRecipes, allergens, dietaryStyles);

  // 2. Нелюбимые ингредиенты (по категориям из онбординга)
  const PROTEIN_KEYS = ['beef', 'pork', 'lamb', 'chicken', 'turkey', 'fish', 'seafood'];
  const VEG_KEYS     = [
    'tomato', 'cucumber', 'zucchini', 'broccoli', 'carrot', 'onion', 'potato', 'spinach', 'pumpkin', 
    'cabbage', 'bell-pepper', 'eggplant', 'garlic', 'mushrooms', 'apple', 'banana', 'citrus', 'berries', 
    'peach', 'beet', 'radish', 'turnip', 'parsnip', 'leek', 'cauliflower', 'brussels-sprouts', 'lettuce', 
    'arugula', 'pear', 'quince', 'cherry', 'apricot', 'plum', 'orange', 'lemon', 'mandarin', 'grapefruit', 
    'mango', 'pineapple', 'kiwi', 'papaya', 'strawberry', 'raspberry', 'blueberry', 'currant',
    'walnuts', 'cashews', 'almonds', 'seeds', 'dried-fruits', 'pistachios', 'hazelnuts', 'chia', 'flax', 'quinoa-veg'
  ];
  const DAIRY_KEYS   = ['cheese', 'cottage-cheese', 'yogurt', 'kefir', 'milk', 'eggs'];
  const GRAIN_KEYS   = ['pasta', 'buckwheat', 'rice', 'oats', 'quinoa', 'wheat', 'barley', 'corn', 'millet', 'bread', 'lentil', 'pea', 'chickpea', 'beans'];

  const rejectedKeywords = [
    ...getUnselectedKeywords(likedProteins || PROTEIN_KEYS, PROTEIN_KEYS),
    ...getUnselectedKeywords(likedVeg || VEG_KEYS, VEG_KEYS),
    ...getUnselectedKeywords(likedDairy || DAIRY_KEYS, DAIRY_KEYS),
    ...getUnselectedKeywords(likedGrains || GRAIN_KEYS, GRAIN_KEYS),
  ];

  recipes = recipes.filter((recipe) => {
    // Жёсткие ID
    if (recipe.ingredients?.some((ing) => dislikedIngredients.includes(ing.id))) return false;
    
    // Свободный ввод (textarea)
    if (excludedIngredientsFreeText?.trim().length > 0) {
      const texts = excludedIngredientsFreeText.toLowerCase().split(/[,\n]/).map(t => t.trim()).filter(Boolean);
      const hasExcludedText = recipe.ingredients?.some(ing => {
        const ingName = ing.name.toLowerCase();
        return texts.some(excluded => ingName.includes(excluded));
      });
      if (hasExcludedText) return false;
    }

    // По невыбранным макро-категориям
    if (rejectedKeywords.length > 0) {
      const hasRejectedCategory = recipe.ingredients?.some(ing => {
        const ingNameLower = ing.name.toLowerCase();
        return rejectedKeywords.some(rejWord => ingNameLower.includes(rejWord));
      });
      if (hasRejectedCategory) return false;
    }
    
    return true;
  });

  return recipes;
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
    cookTimeWindows,
    cookFrequency,
    preferLazy,
    allowRepeatMeals,
    mealFrequency = 3,
    mealSpecifics = [],
  } = profile;

  const { targetCalories } = nutrition;

  // 1. Предварительная фильтрация
  const safeRecipes = filterRecipesForProfile(allRecipes, profile);

  // 2. Времённой фильтр и сортировка
  const baseFiltered = filterByTimeWindow(safeRecipes, cookTimeWindows, preferLazy);
  const baseSorted   = sortByBatchPriority(baseFiltered, cookFrequency);

  // 3. Определение списка приёмов пищи
  const { distribution: CALORIE_DISTRIBUTION, types: currentMealTypes } = getCalorieDistribution(mealFrequency, mealSpecifics);

  // Разбиваем по категориям с fallback-расширением
  const pools = {};
  for (const mealType of currentMealTypes) {
    let pool = baseSorted.filter((r) => {
      const cat = r.category || 'snack';
      if (mealType.startsWith('snack')) return cat === 'snack';
      return cat === mealType;
    });

    if (pool.length < 3) {
      const maxVal = Array.isArray(cookTimeWindows) ? Math.max(...cookTimeWindows) : (cookTimeWindows || 60);
      const fallbackWindow = Math.round(maxVal * 1.5);
      const rawCategory = mealType.startsWith('snack') ? 'snack' : mealType;
      pool = filterByTimeWindow(
        safeRecipes.filter((r) => r.category === rawCategory),
        fallbackWindow,
        false
      );
    }

    if (pool.length === 0) {
      const rawCategory = mealType.startsWith('snack') ? 'snack' : mealType;
      pool = safeRecipes.filter((r) => r.category === rawCategory);
    }

    pools[mealType] = sortByBatchPriority(pool, cookFrequency);
  }

  // ── Шаг 4: Генерация по дням ──
  const plan = [];
  const selectedPerType = {};
  currentMealTypes.forEach(m => selectedPerType[m] = []);

  const today = new Date();

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const meals = {};
    let currentTargetCalories = targetCalories;
    let boostedTags = [];

    // Cycle Syncing Integration
    if (profile.gender === 'female' && profile.cycleTracking?.enabled && profile.cycleTracking.lastPeriodDate) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + dayIndex);
      const phaseData = getCyclePhase(profile.cycleTracking.lastPeriodDate, profile.cycleTracking.cycleLength, targetDate);
      if (phaseData) {
        const modifiers = getPhaseModifiers(phaseData.phase);
        currentTargetCalories += modifiers.kcalModifier;
        boostedTags = modifiers.boostedTags;
      }
    }

    for (const mealType of currentMealTypes) {
      const calorieTarget = Math.round(currentTargetCalories * CALORIE_DISTRIBUTION[mealType]);

      const picked = pickRecipe(
        pools[mealType],
        selectedPerType[mealType],
        calorieTarget,
        allowRepeatMeals,
        mealType,
        boostedTags
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

/**
 * Генерирует замену для ОДНОГО приёма пищи.
 */
export function generateSingleMeal(allRecipes, profile, nutrition, mealType, selectedSoFar = [], currentMealId = null) {
  // 1. Предварительная фильтрация по профилю
  let safeRecipes = filterRecipesForProfile(allRecipes, profile);

  // Исключаем текущее блюдо
  if (currentMealId) {
    safeRecipes = safeRecipes.filter(r => r.id !== currentMealId);
  }

  // 2. Time + Category
  const { cookTimeWindows, preferLazy, allowRepeatMeals, mealFrequency = 3, mealSpecifics = [] } = profile || {};
  const baseFiltered = filterByTimeWindow(safeRecipes, cookTimeWindows, preferLazy);
  const rawCategory = mealType.startsWith('snack') ? 'snack' : mealType;
  
  let pool = baseFiltered.filter((r) => r.category === rawCategory);

  // Fallback по времени (если слишком строгие рамки)
  if (pool.length === 0) {
    pool = safeRecipes.filter((r) => r.category === rawCategory);
  }

  // 3. Calorie target & Cycle Syncing
  const { distribution } = getCalorieDistribution(mealFrequency, mealSpecifics);
  let targetCals = (nutrition?.targetCalories || 2000);
  let boostedTags = [];

  if (profile.gender === 'female' && profile.cycleTracking?.enabled && profile.cycleTracking.lastPeriodDate) {
    const phaseData = getCyclePhase(profile.cycleTracking.lastPeriodDate, profile.cycleTracking.cycleLength, new Date());
    if (phaseData) {
      const modifiers = getPhaseModifiers(phaseData.phase);
      targetCals += modifiers.kcalModifier;
      boostedTags = modifiers.boostedTags;
    }
  }

  const calorieTarget = Math.round(targetCals * (distribution[mealType] || 0.1));

  const result = pickRecipe(pool, selectedSoFar, calorieTarget, allowRepeatMeals, mealType, boostedTags);
  return result;
}

/**
 * Возвращает список всех подходящих рецептов для конкретного слота.
 * Используется в UI для ручного выбора блюда.
 */
export function getFilteredPoolForMeal(allRecipes, profile, nutrition, mealType) {
  // 1. Предварительная фильтрация по профилю
  const safeRecipes = filterRecipesForProfile(allRecipes, profile);

  // 2. Времённой фильтр и категория
  const { cookTimeWindows, preferLazy, mealFrequency = 3, mealSpecifics = [] } = profile || {};
  const baseFiltered = filterByTimeWindow(safeRecipes, cookTimeWindows, preferLazy);
  const rawCategory = mealType.startsWith('snack') ? 'snack' : mealType;
  
  let pool = baseFiltered.filter((r) => r.category === rawCategory);

  // Fallback по времени (если слишком строгие рамки)
  if (pool.length === 0) {
    pool = safeRecipes.filter((r) => r.category === rawCategory);
  }

  // 3. Скейлинг под калории & Cycle Syncing
  const { distribution } = getCalorieDistribution(mealFrequency, mealSpecifics);
  let targetCalsBase = (nutrition?.targetCalories || 2000);

  if (profile.gender === 'female' && profile.cycleTracking?.enabled && profile.cycleTracking.lastPeriodDate) {
    const phaseData = getCyclePhase(profile.cycleTracking.lastPeriodDate, profile.cycleTracking.cycleLength, new Date());
    if (phaseData) {
      const modifiers = getPhaseModifiers(phaseData.phase);
      targetCalsBase += modifiers.kcalModifier;
    }
  }

  const calorieTarget = Math.round(targetCalsBase * (distribution[mealType] || 0.1));

  // Превращаем в Ref-объекты со скейлингом
  return pool.map(r => toRef(r, calorieTarget));
}


